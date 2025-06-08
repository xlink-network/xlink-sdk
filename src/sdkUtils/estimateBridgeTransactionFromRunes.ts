import { BitcoinAddress } from "../bitcoinUtils/btcAddresses"
import { SDK_NAME } from "../constants"
import { estimateRunesInstantSwapTransaction } from "../metaUtils/broadcastRunesInstantSwapTransaction"
import {
  estimateRunesTransaction,
  EstimateRunesTransactionOutput,
} from "../metaUtils/broadcastRunesTransaction"
import { isSupportedRunesRoute } from "../metaUtils/peggingHelpers"
import {
  BridgeFromRunesInput_reselectSpendableNetworkFeeUTXOs,
  RunesUTXOSpendable,
} from "../metaUtils/types"
import {
  createBridgeOrder_MetaToBitcoin,
  createBridgeOrder_MetaToEVM,
  createBridgeOrder_MetaToMeta,
  createBridgeOrder_MetaToStacks,
} from "../stacksUtils/createBridgeOrderFromMeta"
import { BigNumber } from "../utils/BigNumber"
import {
  checkRouteValid,
  KnownRoute_FromRunes_ToBitcoin,
  KnownRoute_FromRunes_ToBRC20,
  KnownRoute_FromRunes_ToEVM,
  KnownRoute_FromRunes_ToRunes,
  KnownRoute_FromRunes_ToStacks,
} from "../utils/buildSupportedRoutes"
import {
  InvalidMethodParametersError,
  UnsupportedBridgeRouteError,
} from "../utils/errors"
import { SwapRoute_WithMinimumAmountsToReceive_Public } from "../utils/SwapRouteHelpers"
import { assertExclude, checkNever } from "../utils/typeHelpers"
import {
  _knownChainIdToErrorMessagePart,
  KnownChainId,
  KnownTokenId,
} from "../utils/types/knownIds"
import { getBridgeFeeOutput } from "./bridgeFromBRC20"
import { ChainId, isEVMAddress, SDKNumber, TokenId } from "./types"
import { SDKGlobalContext } from "./types.internal"

export interface EstimateBridgeTransactionFromRunesInput {
  fromChain: ChainId
  fromToken: TokenId
  toChain: ChainId
  toToken: TokenId

  fromAddress: string
  fromAddressScriptPubKey: Uint8Array
  toAddress: string
  /**
   * **Required** when `toChain` is one of bitcoin chains
   */
  toAddressScriptPubKey?: Uint8Array

  amount: SDKNumber
  inputRuneUTXOs: RunesUTXOSpendable[]
  swapRoute?: SwapRoute_WithMinimumAmountsToReceive_Public

  networkFeeRate: bigint
  networkFeeChangeAddress: string
  networkFeeChangeAddressScriptPubKey: Uint8Array
  reselectSpendableNetworkFeeUTXOs: BridgeFromRunesInput_reselectSpendableNetworkFeeUTXOs

  extraOutputs?: {
    address: BitcoinAddress
    satsAmount: bigint
  }[]
}

export interface EstimateBridgeTransactionFromRunesOutput
  extends EstimateRunesTransactionOutput {}

export async function estimateBridgeTransactionFromRunes(
  ctx: SDKGlobalContext,
  info: EstimateBridgeTransactionFromRunesInput,
): Promise<EstimateBridgeTransactionFromRunesOutput> {
  const route = await checkRouteValid(ctx, isSupportedRunesRoute, info)

  if (KnownChainId.isRunesChain(route.fromChain)) {
    if (KnownChainId.isStacksChain(route.toChain)) {
      if (
        KnownTokenId.isStacksToken(route.toToken) &&
        KnownTokenId.isRunesToken(route.fromToken)
      ) {
        return estimateFromRunes_toStacks(ctx, {
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isEVMChain(route.toChain)) {
      if (
        KnownTokenId.isEVMToken(route.toToken) &&
        KnownTokenId.isRunesToken(route.fromToken)
      ) {
        return estimateFromRunes_toEVM(ctx, {
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isBitcoinChain(route.toChain)) {
      if (
        KnownTokenId.isBitcoinToken(route.toToken) &&
        KnownTokenId.isRunesToken(route.fromToken)
      ) {
        return estimateFromRunes_toBitcoin(ctx, {
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isBRC20Chain(route.toChain)) {
      if (
        KnownTokenId.isBRC20Token(route.toToken) &&
        KnownTokenId.isRunesToken(route.fromToken)
      ) {
        return estimateFromRunes_toMeta(ctx, {
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isRunesChain(route.toChain)) {
      if (
        KnownTokenId.isRunesToken(route.toToken) &&
        KnownTokenId.isRunesToken(route.fromToken)
      ) {
        return estimateFromRunes_toMeta(ctx, {
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else {
      assertExclude(route.toChain, assertExclude.i<KnownChainId.BitcoinChain>())
      checkNever(route)
    }
  } else {
    assertExclude(route.fromChain, assertExclude.i<KnownChainId.EVMChain>())
    assertExclude(route.fromChain, assertExclude.i<KnownChainId.StacksChain>())
    assertExclude(route.fromChain, assertExclude.i<KnownChainId.BitcoinChain>())
    assertExclude(route.fromChain, assertExclude.i<KnownChainId.BRC20Chain>())
    checkNever(route)
  }

  throw new UnsupportedBridgeRouteError(
    info.fromChain,
    info.toChain,
    info.fromToken,
    info.toToken,
  )
}

async function estimateFromRunes_toStacks(
  sdkContext: SDKGlobalContext,
  info: Omit<
    EstimateBridgeTransactionFromRunesInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    KnownRoute_FromRunes_ToStacks,
): Promise<EstimateBridgeTransactionFromRunesOutput> {
  if (info.swapRoute?.via === "instantSwap") {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
      info.swapRoute,
    )
  }

  const createdOrder = await createBridgeOrder_MetaToStacks(sdkContext, {
    ...info,
    fromBitcoinScriptPubKey: info.fromAddressScriptPubKey,
    toStacksAddress: info.toAddress,
    swap:
      info.swapRoute == null
        ? undefined
        : {
            ...info.swapRoute,
            minimumAmountsToReceive: BigNumber.from(
              info.swapRoute.minimumAmountsToReceive,
            ),
          },
  })
  if (createdOrder == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const bridgeFeeOutput = await getBridgeFeeOutput(sdkContext, info)

  return estimateRunesTransaction(sdkContext, {
    ...info,
    toAddressScriptPubKey: undefined,
    orderData: createdOrder.data,
    withHardLinkageOutput: true,
    bridgeFeeOutput,
    extraOutputs: info.extraOutputs ?? [],
    swapRoute: info.swapRoute ?? undefined,
  })
}

async function estimateFromRunes_toEVM(
  sdkContext: SDKGlobalContext,
  info: Omit<
    EstimateBridgeTransactionFromRunesInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    KnownRoute_FromRunes_ToEVM,
): Promise<EstimateBridgeTransactionFromRunesOutput> {
  if (info.swapRoute?.via === "instantSwap") {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
      info.swapRoute,
    )
  }

  const createdOrder = !isEVMAddress(info.toAddress)
    ? null
    : await createBridgeOrder_MetaToEVM(sdkContext, {
        ...info,
        fromBitcoinScriptPubKey: info.fromAddressScriptPubKey,
        toEVMAddress: info.toAddress,
        swap:
          info.swapRoute == null
            ? undefined
            : {
                ...info.swapRoute,
                minimumAmountsToReceive: BigNumber.from(
                  info.swapRoute.minimumAmountsToReceive,
                ),
              },
      })
  if (createdOrder == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const bridgeFeeOutput = await getBridgeFeeOutput(sdkContext, info)

  return estimateRunesTransaction(sdkContext, {
    ...info,
    toAddressScriptPubKey: undefined,
    orderData: createdOrder.data,
    withHardLinkageOutput: true,
    bridgeFeeOutput,
    extraOutputs: info.extraOutputs ?? [],
    swapRoute: info.swapRoute ?? undefined,
  })
}

async function estimateFromRunes_toBitcoin(
  sdkContext: SDKGlobalContext,
  info: Omit<
    EstimateBridgeTransactionFromRunesInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    KnownRoute_FromRunes_ToBitcoin,
): Promise<EstimateBridgeTransactionFromRunesOutput> {
  if (info.toAddressScriptPubKey == null) {
    throw new InvalidMethodParametersError(
      [
        SDK_NAME,
        `estimateBridgeTransactionFromRunes (to ${_knownChainIdToErrorMessagePart(info.toChain)})`,
      ],
      [
        {
          name: "toAddressScriptPubKey",
          expected: "Uint8Array",
          received: "undefined",
        },
      ],
    )
  }

  const createdOrder = await createBridgeOrder_MetaToBitcoin(sdkContext, {
    ...info,
    fromBitcoinScriptPubKey: info.fromAddressScriptPubKey,
    toBitcoinScriptPubKey: info.toAddressScriptPubKey,
    swap:
      info.swapRoute == null
        ? undefined
        : {
            ...info.swapRoute,
            minimumAmountsToReceive: BigNumber.from(
              info.swapRoute.minimumAmountsToReceive,
            ),
          },
  })
  if (createdOrder == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const bridgeFeeOutput = await getBridgeFeeOutput(sdkContext, info)

  if (info.swapRoute?.via === "instantSwap") {
    return estimateRunesInstantSwapTransaction(sdkContext, {
      ...info,
      toAddressScriptPubKey: info.toAddressScriptPubKey,
      orderData: createdOrder.data,
      bridgeFeeOutput,
      extraOutputs: info.extraOutputs ?? [],
      swapRoute: info.swapRoute,
    })
  }

  return estimateRunesTransaction(sdkContext, {
    ...info,
    toAddressScriptPubKey: info.toAddressScriptPubKey,
    orderData: createdOrder.data,
    withHardLinkageOutput: true,
    bridgeFeeOutput,
    extraOutputs: info.extraOutputs ?? [],
    swapRoute: info.swapRoute ?? undefined,
  })
}

async function estimateFromRunes_toMeta(
  sdkContext: SDKGlobalContext,
  info: Omit<
    EstimateBridgeTransactionFromRunesInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    (KnownRoute_FromRunes_ToBRC20 | KnownRoute_FromRunes_ToRunes),
): Promise<EstimateBridgeTransactionFromRunesOutput> {
  if (info.toAddressScriptPubKey == null) {
    throw new InvalidMethodParametersError(
      [
        SDK_NAME,
        `estimateBridgeTransactionFromRunes (to ${_knownChainIdToErrorMessagePart(info.toChain)})`,
      ],
      [
        {
          name: "toAddressScriptPubKey",
          expected: "Uint8Array",
          received: "undefined",
        },
      ],
    )
  }

  const createdOrder = await createBridgeOrder_MetaToMeta(sdkContext, {
    ...info,
    fromBitcoinScriptPubKey: info.fromAddressScriptPubKey,
    toBitcoinScriptPubKey: info.toAddressScriptPubKey,
    swap:
      info.swapRoute == null
        ? undefined
        : {
            ...info.swapRoute,
            minimumAmountsToReceive: BigNumber.from(
              info.swapRoute.minimumAmountsToReceive,
            ),
          },
  })
  if (createdOrder == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const bridgeFeeOutput = await getBridgeFeeOutput(sdkContext, info)

  if (info.swapRoute?.via === "instantSwap") {
    if (
      KnownChainId.isBitcoinChain(info.toChain) &&
      KnownTokenId.isBitcoinToken(info.toToken)
    ) {
      return estimateRunesInstantSwapTransaction(sdkContext, {
        ...info,
        toChain: info.toChain,
        toToken: info.toToken,
        toAddressScriptPubKey: info.toAddressScriptPubKey,
        orderData: createdOrder.data,
        bridgeFeeOutput,
        extraOutputs: info.extraOutputs ?? [],
        swapRoute: info.swapRoute,
      })
    }

    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
      info.swapRoute,
    )
  }

  return estimateRunesTransaction(sdkContext, {
    ...info,
    toAddressScriptPubKey: info.toAddressScriptPubKey,
    orderData: createdOrder.data,
    withHardLinkageOutput: true,
    bridgeFeeOutput,
    extraOutputs: info.extraOutputs ?? [],
    swapRoute: info.swapRoute ?? undefined,
  })
}
