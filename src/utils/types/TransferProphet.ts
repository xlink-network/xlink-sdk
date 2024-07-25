import {
  SDKNumber,
  SDKNumberifyNestly,
  toSDKNumberOrUndefined,
} from "../../xlinkSdkUtils/types"
import { BigNumber } from "../BigNumber"
import { KnownRoute } from "../buildSupportedRoutes"
import { applyTransferProphet } from "../feeRateHelpers"
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
  T extends PublicTransferProphet[] = PublicTransferProphet[],
> extends SDKNumberifyNestly<PublicTransferProphet> {
  transferProphets: T
}

export function transformToPublicTransferProphet(
  route: KnownRoute,
  transferProphet: TransferProphet,
  fromAmount: SDKNumber | BigNumber,
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
