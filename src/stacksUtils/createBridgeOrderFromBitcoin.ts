import { unwrapResponse } from "clarity-codegen"
import { getTerminatingStacksTokenContractAddress } from "../evmUtils/peggingHelpers"
import { addressToBuffer } from "../utils/addressHelpers"
import {
  KnownRoute_FromBitcoin,
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
import {
  getChainIdNetworkType,
  KnownChainId,
  KnownTokenId,
} from "../utils/types/knownIds"
import {
  EVMAddress,
  isEVMAddress,
  StacksContractAddress,
} from "../xlinkSdkUtils/types"
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
  tokenOutTrait: StacksContractAddress
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
    if (KnownTokenId.isEVMToken(info.toToken) && isEVMAddress(info.toAddress)) {
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
  if (info.swap?.via === "evmDexAggregator") {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
      info.swap,
    )
  }

  return createBridgeOrderFromBitcoinImpl(sdkContext, {
    ...info,
    fromAddressBuffer: info.fromBitcoinScriptPubKey,
    toAddressBuffer: addressToBuffer(info.toChain, info.toStacksAddress),
  })
}

export async function createBridgeOrder_BitcoinToEVM(
  sdkContext: SDKGlobalContext,
  info: {
    fromChain: KnownChainId.BitcoinChain
    fromToken: KnownTokenId.BitcoinToken
    fromBitcoinScriptPubKey: Uint8Array
    toChain: KnownChainId.EVMChain
    toToken: KnownTokenId.EVMToken
    toEVMAddress: EVMAddress
    swap?: SwapRoute_WithMinimumAmountsToReceive
  },
): Promise<undefined | CreateBridgeOrderResult> {
  return createBridgeOrderFromBitcoinImpl(sdkContext, {
    ...info,
    fromAddressBuffer: info.fromBitcoinScriptPubKey,
    toAddressBuffer: decodeHex(info.toEVMAddress),
  })
}

export async function createBridgeOrder_BitcoinToMeta(
  sdkContext: SDKGlobalContext,
  info: (KnownRoute_FromBitcoin_ToBRC20 | KnownRoute_FromBitcoin_ToRunes) & {
    fromBitcoinScriptPubKey: Uint8Array
    toBitcoinScriptPubKey: Uint8Array
    swap?: SwapRoute_WithMinimumAmountsToReceive
  },
): Promise<undefined | CreateBridgeOrderResult> {
  return createBridgeOrderFromBitcoinImpl(sdkContext, {
    ...info,
    fromAddressBuffer: info.fromBitcoinScriptPubKey,
    toAddressBuffer: info.toBitcoinScriptPubKey,
  })
}

async function createBridgeOrderFromBitcoinImpl(
  sdkContext: SDKGlobalContext,
  info: KnownRoute_FromBitcoin & {
    fromAddressBuffer: Uint8Array
    toAddressBuffer: Uint8Array
    swap?: SwapRoute_WithMinimumAmountsToReceive
  },
): Promise<undefined | CreateBridgeOrderResult> {
  const transitStacksChain =
    getChainIdNetworkType(info.fromChain) === "mainnet"
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

  const targetChainId = KnownChainId.isStacksChain(info.toChain)
    ? undefined
    : contractAssignedChainIdFromKnownChain(info.toChain)

  const bridgedFromStacksToken = await toCorrespondingStacksToken(
    sdkContext,
    info.fromChain,
    info.fromToken,
  )
  const bridgedFromStacksTokenAddress =
    bridgedFromStacksToken == null
      ? null
      : await getStacksTokenContractInfo(
          sdkContext,
          transitStacksChain,
          bridgedFromStacksToken,
        )
  const bridgedToStacksToken = await toCorrespondingStacksToken(
    sdkContext,
    info.toChain,
    info.toToken,
  )
  const bridgedToStacksTokenAddress =
    bridgedToStacksToken == null
      ? null
      : await getStacksTokenContractInfo(
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

  const tokenOutStacksAddress =
    (KnownChainId.isEVMChain(info.toChain) &&
    KnownTokenId.isEVMToken(info.toToken)
      ? await getTerminatingStacksTokenContractAddress(sdkContext, {
          stacksChain: transitStacksChain,
          evmChain: info.toChain,
          evmToken: info.toToken,
        })
      : undefined) ?? bridgedToStacksTokenAddress

  let data: undefined | Uint8Array
  if (swapInfo == null) {
    data = await executeReadonlyCallXLINK(
      contractBaseCallInfo.contractName,
      "create-order-cross-or-fail",
      {
        order: {
          from: info.fromAddressBuffer,
          to: info.toAddressBuffer,
          "chain-id": targetChainId,
          token: `${bridgedToStacksTokenAddress.deployerAddress}.${bridgedToStacksTokenAddress.contractName}`,
          "token-out": `${tokenOutStacksAddress.deployerAddress}.${tokenOutStacksAddress.contractName}`,
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
          from: info.fromAddressBuffer,
          to: info.toAddressBuffer,
          "chain-id": targetChainId,
          routing: swapInfo.swapPools.map(n => n.poolId),
          "min-amount-out": numberToStacksContractNumber(
            swapInfo.minimumAmountsToReceive,
          ),
          "token-out": `${tokenOutStacksAddress.deployerAddress}.${tokenOutStacksAddress.contractName}`,
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
    const swapToTokenStacksAddress =
      (await getTerminatingStacksTokenContractAddress(sdkContext, {
        stacksChain: transitStacksChain,
        evmChain: swapInfo.evmChain,
        evmToken: swapInfo.toEVMToken,
      })) ?? bridgedToStacksTokenAddress

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
          from: info.fromAddressBuffer,
          to: info.toAddressBuffer,
          "chain-id": targetChainId,
          "dest-chain-id": swapOnChainId,
          "min-amount-out": numberToStacksContractNumber(
            swapInfo.minimumAmountsToReceive,
          ),
          "swap-token-in": `${swapFromTokenStacksAddress.deployerAddress}.${swapFromTokenStacksAddress.contractName}`,
          "swap-token-out": `${swapToTokenStacksAddress.deployerAddress}.${swapToTokenStacksAddress.contractName}`,
          "token-out": `${tokenOutStacksAddress.deployerAddress}.${tokenOutStacksAddress.contractName}`,
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
    tokenOutTrait: {
      deployerAddress: bridgedToStacksTokenAddress.deployerAddress,
      contractName: bridgedToStacksTokenAddress.contractName,
    },
    data: data!,
  }
}
