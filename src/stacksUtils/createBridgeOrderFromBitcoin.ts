import { unwrapResponse } from "clarity-codegen"
import { evmTokenToCorrespondingStacksToken } from "../evmUtils/peggingHelpers"
import { getRunesSupportedRoutes } from "../metaUtils/apiHelpers/getRunesSupportedRoutes"
import { getBRC20SupportedRoutes } from "../metaUtils/apiHelpers/getBRC20SupportedRoutes"
import {
  KnownRoute_FromBitcoin_ToBRC20,
  KnownRoute_FromBitcoin_ToRunes,
} from "../utils/buildSupportedRoutes"
import { UnsupportedBridgeRouteError } from "../utils/errors"
import { decodeHex } from "../utils/hexHelpers"
import { SwapRoute_WithMinimumAmountsToReceive } from "../utils/SwapRouteHelpers"
import { assertExclude, checkNever } from "../utils/typeHelpers"
import { KnownChainId, KnownTokenId } from "../utils/types/knownIds"
import { StacksContractAddress } from "../xlinkSdkUtils/types"
import { SDKGlobalContext } from "../xlinkSdkUtils/types.internal"
import { contractAssignedChainIdFromKnownChain } from "./crossContractDataMapping"
import {
  getTerminatingStacksTokenContractAddress,
  StacksContractName,
} from "./stxContractAddresses"
import {
  executeReadonlyCallXLINK,
  getStacksContractCallInfo,
  getStacksTokenContractInfo,
  numberToStacksContractNumber,
} from "./xlinkContractHelpers"
import { addressToBuffer } from "../utils/addressHelpers"

export interface BridgeSwapRouteNode {
  poolId: bigint
  tokenAddress: StacksContractAddress
}

export interface CreateBridgeOrderResult {
  terminatingStacksToken: StacksContractAddress
  data: Uint8Array
}

export async function createBridgeOrderFromBitcoin(
  sdkContext: SDKGlobalContext,
  info: {
    fromChain: KnownChainId.BitcoinChain
    fromBitcoinScriptPubKey: Uint8Array
    toChain:
      | KnownChainId.StacksChain
      | KnownChainId.EVMChain
      | KnownChainId.BRC20Chain
      | KnownChainId.RunesChain
    toToken:
      | KnownTokenId.StacksToken
      | KnownTokenId.EVMToken
      | KnownTokenId.BRC20Token
      | KnownTokenId.RunesToken
    toAddress: string
    toBitcoinScriptPubKey: Uint8Array
    swap?: SwapRoute_WithMinimumAmountsToReceive
  },
): Promise<undefined | CreateBridgeOrderResult> {
  if (KnownChainId.isStacksChain(info.toChain)) {
    if (KnownTokenId.isStacksToken(info.toToken)) {
      return createBridgeOrder_BitcoinToStacks(sdkContext, {
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
      return createBridgeOrder_BitcoinToEVM(sdkContext, {
        ...info,
        toChain: info.toChain,
        toToken: info.toToken,
        toEVMAddress: info.toAddress,
      })
    }
  }
  assertExclude(info.toChain, assertExclude.i<KnownChainId.EVMChain>())

  if (KnownChainId.isBRC20Chain(info.toChain)) {
    if (KnownTokenId.isBRC20Token(info.toToken)) {
      return createBridgeOrder_BitcoinToMeta(sdkContext, {
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
      return createBridgeOrder_BitcoinToMeta(sdkContext, {
        ...info,
        toChain: info.toChain,
        toToken: info.toToken,
        toBitcoinScriptPubKey: info.toBitcoinScriptPubKey,
      })
    }
  }
  assertExclude(info.toChain, assertExclude.i<KnownChainId.RunesChain>())

  checkNever(info.toChain)
  throw new UnsupportedBridgeRouteError(
    info.fromChain,
    info.toChain,
    KnownTokenId.Bitcoin.BTC,
    info.toToken,
  )
}

export async function createBridgeOrder_BitcoinToStacks(
  sdkContext: SDKGlobalContext,
  info: {
    fromChain: KnownChainId.BitcoinChain
    fromBitcoinScriptPubKey: Uint8Array
    toChain: KnownChainId.StacksChain
    toToken: KnownTokenId.StacksToken
    toStacksAddress: string
    swap?: SwapRoute_WithMinimumAmountsToReceive
  },
): Promise<undefined | CreateBridgeOrderResult> {
  let data: undefined | Uint8Array

  const contractBaseCallInfo = getStacksContractCallInfo(
    info.toChain,
    StacksContractName.BTCPegInEndpoint,
  )
  const contractSwapCallInfo = getStacksContractCallInfo(
    info.toChain,
    StacksContractName.BTCPegInEndpointSwap,
  )
  if (contractBaseCallInfo == null || contractSwapCallInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
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

export async function createBridgeOrder_BitcoinToEVM(
  sdkContext: SDKGlobalContext,
  info: {
    fromChain: KnownChainId.BitcoinChain
    fromBitcoinScriptPubKey: Uint8Array
    toChain: KnownChainId.EVMChain
    toToken: KnownTokenId.EVMToken
    toEVMAddress: string
    swap?: SwapRoute_WithMinimumAmountsToReceive
  },
): Promise<undefined | CreateBridgeOrderResult> {
  const contractBaseCallInfo = getStacksContractCallInfo(
    info.fromChain === KnownChainId.Bitcoin.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet,
    StacksContractName.BTCPegInEndpoint,
  )
  const contractSwapCallInfo = getStacksContractCallInfo(
    info.fromChain === KnownChainId.Bitcoin.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet,
    StacksContractName.BTCPegInEndpointSwap,
  )
  if (contractBaseCallInfo == null || contractSwapCallInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
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
    contractBaseCallInfo.network.isMainnet()
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet,
    swappedStacksToken,
  )
  if (swappedStacksTokenAddress == null) return undefined

  const terminatingStacksTokenAddress =
    (await getTerminatingStacksTokenContractAddress(sdkContext, {
      fromChain: contractBaseCallInfo.network.isMainnet()
        ? KnownChainId.Stacks.Mainnet
        : KnownChainId.Stacks.Testnet,
      fromToken: swappedStacksToken,
      toChain: info.toChain,
      toToken: info.toToken,
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

export async function createBridgeOrder_BitcoinToMeta(
  sdkContext: SDKGlobalContext,
  info: Omit<
    KnownRoute_FromBitcoin_ToBRC20 | KnownRoute_FromBitcoin_ToRunes,
    "fromToken"
  > & {
    fromBitcoinScriptPubKey: Uint8Array
    toBitcoinScriptPubKey: Uint8Array
    swap?: SwapRoute_WithMinimumAmountsToReceive
  },
): Promise<undefined | CreateBridgeOrderResult> {
  const contractBaseCallInfo = getStacksContractCallInfo(
    info.fromChain === KnownChainId.Bitcoin.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet,
    StacksContractName.BTCPegInEndpoint,
  )
  const contractSwapCallInfo = getStacksContractCallInfo(
    info.fromChain === KnownChainId.Bitcoin.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet,
    StacksContractName.BTCPegInEndpointSwap,
  )
  if (contractBaseCallInfo == null || contractSwapCallInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
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
    contractBaseCallInfo.network.isMainnet()
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet,
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
