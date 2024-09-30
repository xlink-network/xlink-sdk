import {
  SDKNumber,
  SDKNumberifyNestly,
  toSDKNumberOrUndefined,
} from "../../xlinkSdkUtils/types"
import { BigNumber } from "../BigNumber"
import { last } from "../arrayHelpers"
import { KnownRoute } from "../buildSupportedRoutes"
import {
  applyTransferProphet,
  applyTransferProphets,
  composeTransferProphets,
} from "../feeRateHelpers"
import { OneOrMore } from "../typeHelpers"
import { KnownChainId, KnownTokenId } from "./knownIds"

export type TransferProphetAggregated<
  T extends Readonly<TransferProphet[]> = OneOrMore<TransferProphet>,
> = TransferProphet & {
  transferProphets: T
}

export interface TransferProphet {
  isPaused: boolean
  feeToken: KnownTokenId.KnownToken
  feeRate: BigNumber
  minFeeAmount: BigNumber
  minBridgeAmount: null | BigNumber
  maxBridgeAmount: null | BigNumber
}

export interface PublicTransferProphet
  extends SDKNumberifyNestly<TransferProphet> {
  fromChain: KnownChainId.KnownChain
  fromToken: KnownTokenId.KnownToken
  toChain: KnownChainId.KnownChain
  toToken: KnownTokenId.KnownToken
  fromAmount: SDKNumber
  toAmount: SDKNumber
  feeAmount: SDKNumber
}

export interface PublicTransferProphetAggregated<
  T extends readonly PublicTransferProphet[] = readonly PublicTransferProphet[],
> extends SDKNumberifyNestly<PublicTransferProphet> {
  transferProphets: T
}

export function transformFromPublicTransferProphet(
  transferProphet: PublicTransferProphet,
): TransferProphet {
  return {
    isPaused: transferProphet.isPaused,
    feeToken: transferProphet.feeToken,
    feeRate: BigNumber.from(transferProphet.feeRate),
    minFeeAmount: BigNumber.from(transferProphet.minFeeAmount),
    minBridgeAmount:
      transferProphet.minBridgeAmount == null
        ? null
        : BigNumber.from(transferProphet.minBridgeAmount),
    maxBridgeAmount:
      transferProphet.maxBridgeAmount == null
        ? null
        : BigNumber.from(transferProphet.maxBridgeAmount),
  }
}
export function transformToPublicTransferProphet(
  route: KnownRoute,
  fromAmount: SDKNumber | BigNumber,
  transferProphet: TransferProphet,
): PublicTransferProphet {
  const result = applyTransferProphet(
    transferProphet,
    BigNumber.from(fromAmount),
  )

  return {
    ...route,
    fromAmount: toSDKNumberOrUndefined(fromAmount),
    toAmount: toSDKNumberOrUndefined(result.netAmount),
    isPaused: transferProphet.isPaused,
    feeToken: transferProphet.feeToken,
    feeAmount: toSDKNumberOrUndefined(result.feeAmount),
    feeRate: toSDKNumberOrUndefined(transferProphet.feeRate),
    minFeeAmount: toSDKNumberOrUndefined(transferProphet.minFeeAmount),
    minBridgeAmount: toSDKNumberOrUndefined(transferProphet.minBridgeAmount),
    maxBridgeAmount: toSDKNumberOrUndefined(transferProphet.maxBridgeAmount),
  }
}

export const transformToPublicTransferProphetAggregated2 = (
  transferProphets: OneOrMore<PublicTransferProphet>,
): PublicTransferProphetAggregated<OneOrMore<PublicTransferProphet>> => {
  const firstTransferProphet = transferProphets[0]
  const lastTransferProphet = last(transferProphets)

  const steps = transferProphets.map(
    transformFromPublicTransferProphet,
  ) as any as OneOrMore<TransferProphet>
  const composed = composeTransferProphets(steps)

  const fromAmount = BigNumber.from(firstTransferProphet.fromAmount)
  const applyResult = applyTransferProphets(steps, fromAmount)

  return {
    fromChain: firstTransferProphet.fromChain,
    fromToken: firstTransferProphet.fromToken,
    toChain: lastTransferProphet.toChain,
    toToken: lastTransferProphet.toToken,
    fromAmount: toSDKNumberOrUndefined(fromAmount),
    toAmount: toSDKNumberOrUndefined(last(applyResult).netAmount),
    feeToken: composed.feeToken,
    feeAmount: toSDKNumberOrUndefined(
      BigNumber.sum(applyResult.map(r => r.feeAmount)),
    ),
    isPaused: composed.isPaused,
    feeRate: toSDKNumberOrUndefined(composed.feeRate),
    minFeeAmount: toSDKNumberOrUndefined(composed.minFeeAmount),
    minBridgeAmount: toSDKNumberOrUndefined(composed.minBridgeAmount),
    maxBridgeAmount: toSDKNumberOrUndefined(composed.maxBridgeAmount),
    transferProphets,
  }
}
