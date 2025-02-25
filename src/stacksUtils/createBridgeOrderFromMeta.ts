import { unwrapResponse } from "clarity-codegen"
import { evmTokenToCorrespondingStacksToken } from "../evmUtils/peggingHelpers"
import { getRunesSupportedRoutes } from "../metaUtils/apiHelpers/getRunesSupportedRoutes"
import { getBRC20SupportedRoutes } from "../metaUtils/apiHelpers/getBRC20SupportedRoutes"
import { addressToBuffer } from "../utils/addressHelpers"
import {
  _KnownRoute_FromMeta,
  KnownRoute_FromMeta_ToBitcoin,
  KnownRoute_FromMeta_ToEVM,
  KnownRoute_FromMeta_ToMeta,
  KnownRoute_FromMeta_ToStacks,
} from "../utils/buildSupportedRoutes"
import { UnsupportedBridgeRouteError } from "../utils/errors"
import { decodeHex } from "../utils/hexHelpers"
import { SwapRouteViaALEX_WithMinimumAmountsToReceive } from "../utils/SwapRouteHelpers"
import { assertExclude, checkNever } from "../utils/typeHelpers"
import { KnownChainId, KnownTokenId } from "../utils/types/knownIds"
import { EVMAddress } from "../xlinkSdkUtils/types"
import { SDKGlobalContext } from "../xlinkSdkUtils/types.internal"
import { CreateBridgeOrderResult } from "./createBridgeOrderFromBitcoin"
import { contractAssignedChainIdFromKnownChain } from "./crossContractDataMapping"
import { StacksContractName } from "./stxContractAddresses"
import { getTerminatingStacksTokenContractAddress } from "../evmUtils/peggingHelpers"
import {
  executeReadonlyCallXLINK,
  getStacksContractCallInfo,
  getStacksTokenContractInfo,
  numberToStacksContractNumber,
} from "./xlinkContractHelpers"

export async function createBridgeOrderFromMeta(
  sdkContext: SDKGlobalContext,
  info: _KnownRoute_FromMeta & {
    fromBitcoinScriptPubKey: Uint8Array
    toBitcoinScriptPubKey: Uint8Array
    toAddress: string
    swap?: SwapRouteViaALEX_WithMinimumAmountsToReceive
  },
): Promise<undefined | CreateBridgeOrderResult> {
  if (KnownChainId.isStacksChain(info.toChain)) {
    if (KnownTokenId.isStacksToken(info.toToken)) {
      return createBridgeOrder_MetaToStacks(sdkContext, {
        ...info,
        toChain: info.toChain,
        toToken: info.toToken,
        toStacksAddress: info.toAddress,
      })
    }
  }
  assertExclude(info.toChain, assertExclude.i<KnownChainId.StacksChain>())

  if (KnownChainId.isEVMChain(info.toChain)) {
    if (KnownTokenId.isEVMToken(info.toToken)) {
      return createBridgeOrder_MetaToEVM(sdkContext, {
        ...info,
        toChain: info.toChain,
        toToken: info.toToken,
        toEVMAddress: info.toAddress as EVMAddress,
      })
    }
  }
  assertExclude(info.toChain, assertExclude.i<KnownChainId.EVMChain>())

  if (KnownChainId.isBitcoinChain(info.toChain)) {
    if (KnownTokenId.isBitcoinToken(info.toToken)) {
      return createBridgeOrder_MetaToBitcoin(sdkContext, {
        ...info,
        toChain: info.toChain,
        toToken: info.toToken,
        toBitcoinScriptPubKey: info.toBitcoinScriptPubKey,
      })
    }
  }
  assertExclude(info.toChain, assertExclude.i<KnownChainId.BitcoinChain>())

  if (KnownChainId.isBRC20Chain(info.toChain)) {
    if (KnownTokenId.isBRC20Token(info.toToken)) {
      return createBridgeOrder_MetaToMeta(sdkContext, {
        ...info,
        toChain: info.toChain,
        toToken: info.toToken,
        toBitcoinScriptPubKey: info.toBitcoinScriptPubKey,
      })
    }
  }
  assertExclude(info.toChain, assertExclude.i<KnownChainId.BRC20Chain>())

  if (KnownChainId.isRunesChain(info.toChain)) {
    if (KnownTokenId.isRunesToken(info.toToken)) {
      return createBridgeOrder_MetaToMeta(sdkContext, {
        ...info,
        toChain: info.toChain,
        toToken: info.toToken,
        toBitcoinScriptPubKey: info.toBitcoinScriptPubKey,
      })
    }
  }
  assertExclude(info.toChain, assertExclude.i<KnownChainId.RunesChain>())

  checkNever(info)
  throw new UnsupportedBridgeRouteError(
    (info as any).fromChain,
    (info as any).toChain,
    (info as any).fromToken,
    (info as any).toToken,
  )
}

export async function createBridgeOrder_MetaToStacks(
  sdkContext: SDKGlobalContext,
  info: KnownRoute_FromMeta_ToStacks & {
    fromBitcoinScriptPubKey: Uint8Array
    toStacksAddress: string
    swap?: SwapRouteViaALEX_WithMinimumAmountsToReceive
  },
): Promise<undefined | CreateBridgeOrderResult> {
  let data: undefined | Uint8Array

  const contractBaseCallInfo = getStacksContractCallInfo(
    info.toChain,
    StacksContractName.MetaPegInEndpoint,
  )
  const contractSwapCallInfo = getStacksContractCallInfo(
    info.toChain,
    StacksContractName.MetaPegInEndpointSwap,
  )
  if (contractBaseCallInfo == null || contractSwapCallInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const { toStacksAddress, swap: swapInfo } = info

  const targetTokenContractInfo = await getStacksTokenContractInfo(
    sdkContext,
    info.toChain,
    info.toToken,
  )
  if (targetTokenContractInfo == null) {
    return undefined
  }

  if (swapInfo == null) {
    data = await executeReadonlyCallXLINK(
      contractBaseCallInfo.contractName,
      "create-order-cross-or-fail",
      {
        order: {
          from: info.fromBitcoinScriptPubKey,
          to: addressToBuffer(info.toChain, toStacksAddress),
          "chain-id": undefined,
          token: `${targetTokenContractInfo.deployerAddress}.${targetTokenContractInfo.contractName}`,
          "token-out": `${targetTokenContractInfo.deployerAddress}.${targetTokenContractInfo.contractName}`,
        },
      },
      contractBaseCallInfo.executeOptions,
    ).then(unwrapResponse)
  } else {
    data = await executeReadonlyCallXLINK(
      contractSwapCallInfo.contractName,
      "create-order-cross-swap-or-fail",
      {
        order: {
          from: info.fromBitcoinScriptPubKey,
          to: addressToBuffer(info.toChain, toStacksAddress),
          "chain-id": undefined,
          routing: swapInfo.swapPools.map(n => n.poolId),
          "min-amount-out": numberToStacksContractNumber(
            swapInfo.minimumAmountsToReceive,
          ),
          "token-out": `${targetTokenContractInfo.deployerAddress}.${targetTokenContractInfo.contractName}`,
        },
      },
      contractSwapCallInfo.executeOptions,
    ).then(unwrapResponse)
  }

  return {
    terminatingStacksToken: targetTokenContractInfo,
    data: data!,
  }
}

export async function createBridgeOrder_MetaToEVM(
  sdkContext: SDKGlobalContext,
  info: KnownRoute_FromMeta_ToEVM & {
    fromBitcoinScriptPubKey: Uint8Array
    toEVMAddress: EVMAddress
    swap?: SwapRouteViaALEX_WithMinimumAmountsToReceive
  },
): Promise<undefined | CreateBridgeOrderResult> {
  const transitStacksChain =
    info.fromChain === KnownChainId.BRC20.Mainnet ||
    info.fromChain === KnownChainId.Runes.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet
  const contractBaseCallInfo = getStacksContractCallInfo(
    transitStacksChain,
    StacksContractName.MetaPegInEndpoint,
  )
  const contractSwapCallInfo = getStacksContractCallInfo(
    transitStacksChain,
    StacksContractName.MetaPegInEndpointSwap,
  )
  if (contractBaseCallInfo == null || contractSwapCallInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const { swap: swapInfo, toEVMAddress } = info

  const targetChainId = contractAssignedChainIdFromKnownChain(info.toChain)

  const swappedStacksToken = await evmTokenToCorrespondingStacksToken(
    sdkContext,
    info.toChain,
    info.toToken,
  )
  if (swappedStacksToken == null) return undefined
  const swappedStacksTokenAddress = await getStacksTokenContractInfo(
    sdkContext,
    transitStacksChain,
    swappedStacksToken,
  )
  if (swappedStacksTokenAddress == null) return undefined

  const terminatingStacksTokenAddress =
    (await getTerminatingStacksTokenContractAddress(sdkContext, {
      stacksChain: transitStacksChain,
      evmChain: info.toChain,
      evmToken: info.toToken,
    })) ?? swappedStacksTokenAddress

  let data: undefined | Uint8Array
  if (swapInfo == null) {
    data = await executeReadonlyCallXLINK(
      contractBaseCallInfo.contractName,
      "create-order-cross-or-fail",
      {
        order: {
          from: info.fromBitcoinScriptPubKey,
          to: decodeHex(toEVMAddress),
          "chain-id": targetChainId,
          token: `${swappedStacksTokenAddress.deployerAddress}.${swappedStacksTokenAddress.contractName}`,
          "token-out": `${terminatingStacksTokenAddress.deployerAddress}.${terminatingStacksTokenAddress.contractName}`,
        },
      },
      contractBaseCallInfo.executeOptions,
    ).then(unwrapResponse)
  } else {
    data = await executeReadonlyCallXLINK(
      contractSwapCallInfo.contractName,
      "create-order-cross-swap-or-fail",
      {
        order: {
          from: info.fromBitcoinScriptPubKey,
          to: decodeHex(toEVMAddress),
          "chain-id": targetChainId,
          routing: swapInfo.swapPools.map(n => n.poolId),
          "min-amount-out": numberToStacksContractNumber(
            swapInfo.minimumAmountsToReceive,
          ),
          "token-out": `${terminatingStacksTokenAddress.deployerAddress}.${terminatingStacksTokenAddress.contractName}`,
        },
      },
      contractSwapCallInfo.executeOptions,
    ).then(unwrapResponse)
  }

  return {
    terminatingStacksToken: {
      deployerAddress: terminatingStacksTokenAddress.deployerAddress,
      contractName: terminatingStacksTokenAddress.contractName,
    },
    data: data!,
  }
}

export async function createBridgeOrder_MetaToBitcoin(
  sdkContext: SDKGlobalContext,
  info: KnownRoute_FromMeta_ToBitcoin & {
    fromBitcoinScriptPubKey: Uint8Array
    toBitcoinScriptPubKey: Uint8Array
    swap?: SwapRouteViaALEX_WithMinimumAmountsToReceive
  },
): Promise<undefined | CreateBridgeOrderResult> {
  const transitStacksChain =
    info.fromChain === KnownChainId.BRC20.Mainnet ||
    info.fromChain === KnownChainId.Runes.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet
  const contractBaseCallInfo = getStacksContractCallInfo(
    transitStacksChain,
    StacksContractName.MetaPegInEndpoint,
  )
  const contractSwapCallInfo = getStacksContractCallInfo(
    transitStacksChain,
    StacksContractName.MetaPegInEndpointSwap,
  )
  if (contractBaseCallInfo == null || contractSwapCallInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const { swap: swapInfo } = info

  const targetChainId = contractAssignedChainIdFromKnownChain(info.toChain)

  const swappedStacksToken = KnownTokenId.Stacks.aBTC
  const swappedStacksTokenAddress = await getStacksTokenContractInfo(
    sdkContext,
    transitStacksChain,
    swappedStacksToken,
  )
  if (swappedStacksTokenAddress == null) return undefined

  let data: undefined | Uint8Array
  if (swapInfo == null) {
    data = await executeReadonlyCallXLINK(
      contractBaseCallInfo.contractName,
      "create-order-cross-or-fail",
      {
        order: {
          from: info.fromBitcoinScriptPubKey,
          to: info.toBitcoinScriptPubKey,
          "chain-id": targetChainId,
          token: `${swappedStacksTokenAddress.deployerAddress}.${swappedStacksTokenAddress.contractName}`,
          "token-out": `${swappedStacksTokenAddress.deployerAddress}.${swappedStacksTokenAddress.contractName}`,
        },
      },
      contractBaseCallInfo.executeOptions,
    ).then(unwrapResponse)
  } else {
    data = await executeReadonlyCallXLINK(
      contractSwapCallInfo.contractName,
      "create-order-cross-swap-or-fail",
      {
        order: {
          from: info.fromBitcoinScriptPubKey,
          to: info.toBitcoinScriptPubKey,
          "chain-id": targetChainId,
          routing: swapInfo.swapPools.map(n => n.poolId),
          "min-amount-out": numberToStacksContractNumber(
            swapInfo.minimumAmountsToReceive,
          ),
          "token-out": `${swappedStacksTokenAddress.deployerAddress}.${swappedStacksTokenAddress.contractName}`,
        },
      },
      contractSwapCallInfo.executeOptions,
    ).then(unwrapResponse)
  }

  return {
    terminatingStacksToken: {
      deployerAddress: swappedStacksTokenAddress.deployerAddress,
      contractName: swappedStacksTokenAddress.contractName,
    },
    data: data!,
  }
}

export async function createBridgeOrder_MetaToMeta(
  sdkContext: SDKGlobalContext,
  info: KnownRoute_FromMeta_ToMeta & {
    fromBitcoinScriptPubKey: Uint8Array
    toBitcoinScriptPubKey: Uint8Array
    swap?: SwapRouteViaALEX_WithMinimumAmountsToReceive
  },
): Promise<undefined | CreateBridgeOrderResult> {
  const transitStacksChain =
    info.fromChain === KnownChainId.BRC20.Mainnet ||
    info.fromChain === KnownChainId.Runes.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet
  const contractBaseCallInfo = getStacksContractCallInfo(
    transitStacksChain,
    StacksContractName.MetaPegInEndpoint,
  )
  const contractSwapCallInfo = getStacksContractCallInfo(
    transitStacksChain,
    StacksContractName.MetaPegInEndpointSwap,
  )
  if (contractBaseCallInfo == null || contractSwapCallInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const { swap: swapInfo } = info

  const targetChainId = contractAssignedChainIdFromKnownChain(info.toChain)

  // prettier-ignore
  const swappedStacksToken =
    KnownChainId.isBRC20Chain(info.toChain) ?
      await getBRC20SupportedRoutes(sdkContext, info.toChain).then(routes => {
        const route = routes.find(n => n.brc20Token === info.toToken)
        return route?.stacksToken
      }) :
    KnownChainId.isRunesChain(info.toChain) ?
      await getRunesSupportedRoutes(sdkContext, info.toChain).then(routes => {
        const route = routes.find(n => n.runesToken === info.toToken)
        return route?.stacksToken
      }) :
    (checkNever(info.toChain), undefined)
  if (swappedStacksToken == null) return undefined
  const swappedStacksTokenAddress = await getStacksTokenContractInfo(
    sdkContext,
    transitStacksChain,
    swappedStacksToken,
  )
  if (swappedStacksTokenAddress == null) return undefined

  let data: undefined | Uint8Array
  if (swapInfo == null) {
    data = await executeReadonlyCallXLINK(
      contractBaseCallInfo.contractName,
      "create-order-cross-or-fail",
      {
        order: {
          from: info.fromBitcoinScriptPubKey,
          to: info.toBitcoinScriptPubKey,
          "chain-id": targetChainId,
          token: `${swappedStacksTokenAddress.deployerAddress}.${swappedStacksTokenAddress.contractName}`,
          "token-out": `${swappedStacksTokenAddress.deployerAddress}.${swappedStacksTokenAddress.contractName}`,
        },
      },
      contractBaseCallInfo.executeOptions,
    ).then(unwrapResponse)
  } else {
    data = await executeReadonlyCallXLINK(
      contractSwapCallInfo.contractName,
      "create-order-cross-swap-or-fail",
      {
        order: {
          from: info.fromBitcoinScriptPubKey,
          to: info.toBitcoinScriptPubKey,
          "chain-id": targetChainId,
          routing: swapInfo.swapPools.map(n => n.poolId),
          "min-amount-out": numberToStacksContractNumber(
            swapInfo.minimumAmountsToReceive,
          ),
          "token-out": `${swappedStacksTokenAddress.deployerAddress}.${swappedStacksTokenAddress.contractName}`,
        },
      },
      contractSwapCallInfo.executeOptions,
    ).then(unwrapResponse)
  }

  return {
    terminatingStacksToken: {
      deployerAddress: swappedStacksTokenAddress.deployerAddress,
      contractName: swappedStacksTokenAddress.contractName,
    },
    data: data!,
  }
}
