import { unwrapResponse } from "clarity-codegen"
import { getTerminatingStacksTokenContractAddress } from "../evmUtils/peggingHelpers"
import { addressToBuffer } from "../utils/addressHelpers"
import { last } from "../utils/arrayHelpers"
import {
  KnownRoute_FromBitcoin_ToBRC20,
  KnownRoute_FromBitcoin_ToRunes,
} from "../utils/buildSupportedRoutes"
import { UnsupportedBridgeRouteError } from "../utils/errors"
import { decodeHex } from "../utils/hexHelpers"
import {
  SwapRoute_WithMinimumAmountsToReceive,
  toCorrespondingStacksToken,
} from "../utils/SwapRouteHelpers"
import { assertExclude, checkNever } from "../utils/typeHelpers"
import { KnownChainId, KnownTokenId } from "../utils/types/knownIds"
import { StacksContractAddress } from "../xlinkSdkUtils/types"
import { SDKGlobalContext } from "../xlinkSdkUtils/types.internal"
import { contractAssignedChainIdFromKnownChain } from "./crossContractDataMapping"
import { StacksContractName } from "./stxContractAddresses"
import {
  executeReadonlyCallXLINK,
  getStacksContractCallInfo,
  getStacksTokenContractInfo,
  numberToStacksContractNumber,
} from "./xlinkContractHelpers"

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
    fromToken: KnownTokenId.BitcoinToken
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
    info.fromToken,
    info.toToken,
  )
}

export async function createBridgeOrder_BitcoinToStacks(
  sdkContext: SDKGlobalContext,
  info: {
    fromChain: KnownChainId.BitcoinChain
    fromToken: KnownTokenId.BitcoinToken
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
  const contractAggCallInfo = getStacksContractCallInfo(
    info.fromChain === KnownChainId.Bitcoin.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet,
    StacksContractName.BTCPegInEndpointAggregator,
  )
  if (
    contractBaseCallInfo == null ||
    contractSwapCallInfo == null ||
    contractAggCallInfo == null
  ) {
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
  if (targetTokenContractInfo == null) return undefined

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
  } else if (swapInfo.via === "ALEX") {
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
  } else if (swapInfo.via === "evmDexAggregator") {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
      swapInfo,
    )
  } else {
    checkNever(swapInfo)
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
      swapInfo,
    )
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
    fromToken: KnownTokenId.BitcoinToken
    fromBitcoinScriptPubKey: Uint8Array
    toChain: KnownChainId.EVMChain
    toToken: KnownTokenId.EVMToken
    toEVMAddress: string
    swap?: SwapRoute_WithMinimumAmountsToReceive
  },
): Promise<undefined | CreateBridgeOrderResult> {
  const transitStacksChain =
    info.fromChain === KnownChainId.Bitcoin.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet

  const contractBaseCallInfo = getStacksContractCallInfo(
    transitStacksChain,
    StacksContractName.BTCPegInEndpoint,
  )
  const contractSwapCallInfo = getStacksContractCallInfo(
    transitStacksChain,
    StacksContractName.BTCPegInEndpointSwap,
  )
  const contractAggCallInfo = getStacksContractCallInfo(
    transitStacksChain,
    StacksContractName.BTCPegInEndpointAggregator,
  )
  if (
    contractBaseCallInfo == null ||
    contractSwapCallInfo == null ||
    contractAggCallInfo == null
  ) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const { swap: swapInfo, toEVMAddress } = info

  const targetChainId = contractAssignedChainIdFromKnownChain(info.toChain)

  const bridgedFromStacksToken = await toCorrespondingStacksToken(
    sdkContext,
    info.fromChain,
    info.fromToken,
  )
  const bridgedToStacksToken = await toCorrespondingStacksToken(
    sdkContext,
    info.toChain,
    info.toToken,
  )
  if (bridgedFromStacksToken == null || bridgedToStacksToken == null) {
    return undefined
  }
  const bridgedFromStacksTokenAddress = await getStacksTokenContractInfo(
    sdkContext,
    transitStacksChain,
    bridgedFromStacksToken,
  )
  const bridgedToStacksTokenAddress = await getStacksTokenContractInfo(
    sdkContext,
    transitStacksChain,
    bridgedToStacksToken,
  )
  if (
    bridgedFromStacksTokenAddress == null ||
    bridgedToStacksTokenAddress == null
  ) {
    return undefined
  }

  const terminatingStacksTokenAddress =
    (await getTerminatingStacksTokenContractAddress(sdkContext, {
      stacksChain: transitStacksChain,
      evmChain: info.toChain,
      evmToken: info.toToken,
    })) ?? bridgedToStacksTokenAddress

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
          token: `${bridgedToStacksTokenAddress.deployerAddress}.${bridgedToStacksTokenAddress.contractName}`,
          "token-out": `${terminatingStacksTokenAddress.deployerAddress}.${terminatingStacksTokenAddress.contractName}`,
        },
      },
      contractBaseCallInfo.executeOptions,
    ).then(unwrapResponse)
  } else if (swapInfo.via === "ALEX") {
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
  } else if (swapInfo.via === "evmDexAggregator") {
    const swapFromTokenStacksAddress =
      (await getTerminatingStacksTokenContractAddress(sdkContext, {
        stacksChain: transitStacksChain,
        evmChain: swapInfo.evmChain,
        evmToken: swapInfo.fromEVMToken,
      })) ?? bridgedFromStacksTokenAddress
    const swapToTokenStacksAddress = terminatingStacksTokenAddress

    const swapOnChainId = contractAssignedChainIdFromKnownChain(
      swapInfo.evmChain,
    )
    if (swapOnChainId == null) {
      throw new UnsupportedBridgeRouteError(
        info.fromChain,
        info.toChain,
        info.fromToken,
        info.toToken,
        swapInfo,
      )
    }
    data = await executeReadonlyCallXLINK(
      contractAggCallInfo.contractName,
      "create-order-agg-or-fail",
      {
        order: {
          from: info.fromBitcoinScriptPubKey,
          to: decodeHex(toEVMAddress),
          "chain-id": targetChainId,
          "dest-chain-id": swapOnChainId,
          "min-amount-out": numberToStacksContractNumber(
            swapInfo.minimumAmountsToReceive,
          ),
          "token-out": `${bridgedToStacksTokenAddress.deployerAddress}.${bridgedToStacksTokenAddress.contractName}`,
          "swap-token-in": `${swapFromTokenStacksAddress.deployerAddress}.${swapFromTokenStacksAddress.contractName}`,
          "swap-token-out": `${swapToTokenStacksAddress.deployerAddress}.${swapToTokenStacksAddress.contractName}`,
        },
      },
      contractAggCallInfo.executeOptions,
    ).then(unwrapResponse)
  } else {
    checkNever(swapInfo)
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
      swapInfo,
    )
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
  info: (KnownRoute_FromBitcoin_ToBRC20 | KnownRoute_FromBitcoin_ToRunes) & {
    fromBitcoinScriptPubKey: Uint8Array
    toBitcoinScriptPubKey: Uint8Array
    swap?: SwapRoute_WithMinimumAmountsToReceive
  },
): Promise<undefined | CreateBridgeOrderResult> {
  const transitStacksChain =
    info.fromChain === KnownChainId.Bitcoin.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet

  const contractBaseCallInfo = getStacksContractCallInfo(
    transitStacksChain,
    StacksContractName.BTCPegInEndpoint,
  )
  const contractSwapCallInfo = getStacksContractCallInfo(
    transitStacksChain,
    StacksContractName.BTCPegInEndpointSwap,
  )
  const contractAggCallInfo = getStacksContractCallInfo(
    transitStacksChain,
    StacksContractName.BTCPegInEndpointAggregator,
  )
  if (
    contractBaseCallInfo == null ||
    contractSwapCallInfo == null ||
    contractAggCallInfo == null
  ) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const { swap: swapInfo } = info

  const targetChainId = contractAssignedChainIdFromKnownChain(info.toChain)

  const bridgedFromStacksToken = await toCorrespondingStacksToken(
    sdkContext,
    info.fromChain,
    info.fromToken,
  )
  const bridgedToStacksToken = await toCorrespondingStacksToken(
    sdkContext,
    info.toChain,
    info.toToken,
  )
  if (bridgedFromStacksToken == null || bridgedToStacksToken == null) {
    return undefined
  }
  const bridgedFromStacksTokenAddress = await getStacksTokenContractInfo(
    sdkContext,
    transitStacksChain,
    bridgedFromStacksToken,
  )
  const bridgedToStacksTokenAddress = await getStacksTokenContractInfo(
    sdkContext,
    transitStacksChain,
    bridgedToStacksToken,
  )
  if (
    bridgedFromStacksTokenAddress == null ||
    bridgedToStacksTokenAddress == null
  ) {
    return undefined
  }

  // prettier-ignore
  const terminatingStacksTokenAddress = (
    swapInfo == null ? undefined :
    swapInfo.via === "ALEX" ? last(swapInfo.swapPools).toTokenAddress :
    swapInfo.via === "evmDexAggregator" ?
      await getTerminatingStacksTokenContractAddress(
        sdkContext,
        {
          stacksChain: transitStacksChain,
          evmChain: swapInfo.evmChain,
          evmToken: swapInfo.toEVMToken,
        }
      ) :
    (checkNever(swapInfo), undefined)
  ) ?? bridgedToStacksTokenAddress

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
          token: `${bridgedToStacksTokenAddress.deployerAddress}.${bridgedToStacksTokenAddress.contractName}`,
          "token-out": `${terminatingStacksTokenAddress.deployerAddress}.${terminatingStacksTokenAddress.contractName}`,
        },
      },
      contractBaseCallInfo.executeOptions,
    ).then(unwrapResponse)
  } else if (swapInfo.via === "ALEX") {
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
          "token-out": `${terminatingStacksTokenAddress.deployerAddress}.${terminatingStacksTokenAddress.contractName}`,
        },
      },
      contractSwapCallInfo.executeOptions,
    ).then(unwrapResponse)
  } else if (swapInfo.via === "evmDexAggregator") {
    const swapFromTokenStacksAddress =
      (await getTerminatingStacksTokenContractAddress(sdkContext, {
        stacksChain: transitStacksChain,
        evmChain: swapInfo.evmChain,
        evmToken: swapInfo.fromEVMToken,
      })) ?? bridgedFromStacksTokenAddress
    const swapToTokenStacksAddress = terminatingStacksTokenAddress

    const swapOnChainId = contractAssignedChainIdFromKnownChain(
      swapInfo.evmChain,
    )
    if (swapOnChainId == null) {
      throw new UnsupportedBridgeRouteError(
        info.fromChain,
        info.toChain,
        info.fromToken,
        info.toToken,
        swapInfo,
      )
    }
    data = await executeReadonlyCallXLINK(
      contractAggCallInfo.contractName,
      "create-order-agg-or-fail",
      {
        order: {
          from: info.fromBitcoinScriptPubKey,
          to: info.toBitcoinScriptPubKey,
          "chain-id": targetChainId,
          "dest-chain-id": swapOnChainId,
          "min-amount-out": numberToStacksContractNumber(
            swapInfo.minimumAmountsToReceive,
          ),
          "token-out": `${bridgedToStacksTokenAddress.deployerAddress}.${bridgedToStacksTokenAddress.contractName}`,
          "swap-token-in": `${swapFromTokenStacksAddress.deployerAddress}.${swapFromTokenStacksAddress.contractName}`,
          "swap-token-out": `${swapToTokenStacksAddress.deployerAddress}.${swapToTokenStacksAddress.contractName}`,
        },
      },
      contractAggCallInfo.executeOptions,
    ).then(unwrapResponse)
  } else {
    checkNever(swapInfo)
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
      swapInfo,
    )
  }

  return {
    terminatingStacksToken: {
      deployerAddress: terminatingStacksTokenAddress.deployerAddress,
      contractName: terminatingStacksTokenAddress.contractName,
    },
    data: data!,
  }
}
