import {
  getBitcoinHardLinkageAddress,
  getBTCPegInAddress,
} from "../bitcoinUtils/btcAddresses"
import { ReselectSpendableUTXOsFn } from "../bitcoinUtils/prepareTransaction"
import {
  createBridgeOrder_BitcoinToEVM,
  createBridgeOrder_BitcoinToMeta,
  createBridgeOrder_BitcoinToStacks,
} from "../stacksUtils/createBridgeOrderFromBitcoin"
import { BigNumber } from "../utils/BigNumber"
import {
  KnownRoute_FromBitcoin_ToBRC20,
  KnownRoute_FromBitcoin_ToEVM,
  KnownRoute_FromBitcoin_ToRunes,
  KnownRoute_FromBitcoin_ToStacks,
} from "../utils/buildSupportedRoutes"
import {
  InvalidMethodParametersError,
  UnsupportedBridgeRouteError,
} from "../utils/errors"
import { assertExclude, checkNever } from "../utils/typeHelpers"
import {
  _knownChainIdToErrorMessagePart,
  KnownChainId,
  KnownTokenId,
} from "../utils/types/knownIds"
import {
  prepareBitcoinTransaction,
  PrepareBitcoinTransactionInput,
  supportedRoutes,
} from "./bridgeFromBitcoin"
import { ChainId, SDKNumber, TokenId, toSDKNumberOrUndefined } from "./types"
import { SwapRoute_WithMinimumAmountsToReceive_Public } from "../utils/SwapRouteHelpers"
import { SDKGlobalContext } from "./types.internal"

export interface EstimateBridgeTransactionFromBitcoinInput {
  fromChain: ChainId
  toChain: ChainId
  fromToken: TokenId
  toToken: TokenId
  fromAddress: string
  fromAddressScriptPubKey: Uint8Array
  toAddress: string
  /**
   * **Required** when `toChain` is one of bitcoin chains
   */
  toAddressScriptPubKey?: Uint8Array
  amount: SDKNumber
  swapRoute?: SwapRoute_WithMinimumAmountsToReceive_Public
  networkFeeRate: bigint
  reselectSpendableUTXOs: ReselectSpendableUTXOsFn
}

export interface EstimateBridgeTransactionFromBitcoinOutput {
  fee: SDKNumber
  estimatedVSize: SDKNumber
}

export async function estimateBridgeTransactionFromBitcoin(
  ctx: SDKGlobalContext,
  info: EstimateBridgeTransactionFromBitcoinInput,
): Promise<EstimateBridgeTransactionFromBitcoinOutput> {
  const route = await supportedRoutes.checkRouteValid(ctx, info)

  if (KnownChainId.isBitcoinChain(route.fromChain)) {
    if (KnownChainId.isStacksChain(route.toChain)) {
      if (
        KnownTokenId.isBitcoinToken(route.fromToken) &&
        KnownTokenId.isStacksToken(route.toToken)
      ) {
        return estimateFromBitcoin_toStacks(ctx, {
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isEVMChain(route.toChain)) {
      if (
        KnownTokenId.isBitcoinToken(route.fromToken) &&
        KnownTokenId.isEVMToken(route.toToken)
      ) {
        return estimateFromBitcoin_toEVM(ctx, {
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isBRC20Chain(route.toChain)) {
      if (
        KnownTokenId.isBitcoinToken(route.fromToken) &&
        KnownTokenId.isBRC20Token(route.toToken)
      ) {
        return estimateFromBitcoin_toMeta(ctx, {
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isRunesChain(route.toChain)) {
      if (
        KnownTokenId.isBitcoinToken(route.fromToken) &&
        KnownTokenId.isRunesToken(route.toToken)
      ) {
        return estimateFromBitcoin_toMeta(ctx, {
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
    checkNever(route)
  }

  throw new UnsupportedBridgeRouteError(
    info.fromChain,
    info.toChain,
    info.fromToken,
    info.toToken,
  )
}

async function estimateFromBitcoin_toStacks(
  sdkContext: SDKGlobalContext,
  info: Omit<
    EstimateBridgeTransactionFromBitcoinInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    KnownRoute_FromBitcoin_ToStacks,
): Promise<EstimateBridgeTransactionFromBitcoinOutput> {
  const createdOrder = await createBridgeOrder_BitcoinToStacks(sdkContext, {
    fromChain: info.fromChain,
    fromBitcoinScriptPubKey: info.fromAddressScriptPubKey,
    toChain: info.toChain,
    toToken: info.toToken,
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
      KnownTokenId.Bitcoin.BTC,
    )
  }

  return estimateBitcoinTransaction(sdkContext, {
    ...info,
    orderData: createdOrder.data,
    withHardLinkageOutput: true,
  })
}

async function estimateFromBitcoin_toEVM(
  sdkContext: SDKGlobalContext,
  info: Omit<
    EstimateBridgeTransactionFromBitcoinInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    KnownRoute_FromBitcoin_ToEVM,
): Promise<EstimateBridgeTransactionFromBitcoinOutput> {
  const createdOrder = await createBridgeOrder_BitcoinToEVM(sdkContext, {
    fromChain: info.fromChain,
    toChain: info.toChain,
    toToken: info.toToken,
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
      KnownTokenId.Bitcoin.BTC,
    )
  }

  return estimateBitcoinTransaction(sdkContext, {
    ...info,
    orderData: createdOrder.data,
    withHardLinkageOutput: true,
  })
}

async function estimateFromBitcoin_toMeta(
  sdkContext: SDKGlobalContext,
  info: Omit<
    EstimateBridgeTransactionFromBitcoinInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    (KnownRoute_FromBitcoin_ToBRC20 | KnownRoute_FromBitcoin_ToRunes),
): Promise<EstimateBridgeTransactionFromBitcoinOutput> {
  if (info.toAddressScriptPubKey == null) {
    throw new InvalidMethodParametersError(
      [
        "XLinkSDK",
        `estimateBridgeTransactionFromBitcoin (to ${_knownChainIdToErrorMessagePart(info.toChain)})`,
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

  const createdOrder = await createBridgeOrder_BitcoinToMeta(sdkContext, {
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
      KnownTokenId.Bitcoin.BTC,
    )
  }

  return estimateBitcoinTransaction(sdkContext, {
    ...info,
    orderData: createdOrder.data,
    withHardLinkageOutput: true,
  })
}

type EstimateBitcoinTransactionInput = Omit<
  PrepareBitcoinTransactionInput,
  "hardLinkageOutput" | "pegInAddress"
> & {
  withHardLinkageOutput: boolean
  orderData: Uint8Array
}
async function estimateBitcoinTransaction(
  sdkContext: SDKGlobalContext,
  info: EstimateBitcoinTransactionInput,
): Promise<EstimateBridgeTransactionFromBitcoinOutput> {
  const pegInAddress = getBTCPegInAddress(info.fromChain, info.toChain)
  if (pegInAddress == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
    )
  }

  const resp = await prepareBitcoinTransaction(sdkContext, {
    ...(info as any),
    pegInAddress,
    hardLinkageOutput: await getBitcoinHardLinkageAddress(
      info.fromChain,
      info.toChain,
    ),
  })

  return {
    fee: toSDKNumberOrUndefined(resp.fee),
    estimatedVSize: toSDKNumberOrUndefined(resp.estimatedVSize),
  }
}
