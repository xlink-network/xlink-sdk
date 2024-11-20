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
import { checkNever, isNotNull, OneOrMore } from "../typeHelpers"
import { KnownChainId, KnownTokenId } from "./knownIds"

export type TransferProphetAggregated<
  T extends Readonly<TransferProphet[]> = OneOrMore<TransferProphet>,
> = TransferProphet & {
  transferProphets: T
}

export type TransferProphet_Fee_Rate = {
  type: "rate"
  token: KnownTokenId.KnownToken
  rate: BigNumber
  minimumAmount: BigNumber
}
export type TransferProphet_Fee_Fixed = {
  type: "fixed"
  token: KnownTokenId.KnownToken
  amount: BigNumber
}
export type TransferProphet_Fee =
  | TransferProphet_Fee_Rate
  | TransferProphet_Fee_Fixed

export interface TransferProphet {
  isPaused: boolean
  bridgeToken: KnownTokenId.KnownToken
  minBridgeAmount: null | BigNumber
  maxBridgeAmount: null | BigNumber
  fees: TransferProphet_Fee[]
}

export interface PublicTransferProphet
  extends Omit<SDKNumberifyNestly<TransferProphet>, "bridgeToken" | "fees"> {
  fromChain: KnownChainId.KnownChain
  fromToken: KnownTokenId.KnownToken
  toChain: KnownChainId.KnownChain
  toToken: KnownTokenId.KnownToken
  fromAmount: SDKNumber
  toAmount: SDKNumber
  fees: SDKNumberifyNestly<
    (
      | (TransferProphet_Fee_Rate & { amount: SDKNumber })
      | TransferProphet_Fee_Fixed
    )[]
  >
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
    bridgeToken: transferProphet.fromToken,
    fees: transferProphet.fees
      .flatMap(f =>
        f.type === "rate"
          ? {
              ...f,
              rate: BigNumber.from(f.rate),
              minimumAmount: BigNumber.from(f.minimumAmount),
            }
          : f.type === "fixed"
            ? {
                ...f,
                amount: BigNumber.from(f.amount),
              }
            : checkNever(f),
      )
      .filter(isNotNull),
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

  const fees: PublicTransferProphet["fees"] = result.fees
    .map(f =>
      f.type === "rate"
        ? {
            ...f,
            rate: toSDKNumberOrUndefined(f.rate),
            minimumAmount: toSDKNumberOrUndefined(f.minimumAmount),
            amount: toSDKNumberOrUndefined(f.amount),
          }
        : f.type === "fixed"
          ? {
              ...f,
              amount: toSDKNumberOrUndefined(f.amount),
            }
          : checkNever(f),
    )
    .filter(isNotNull)

  return {
    ...route,
    fromAmount: toSDKNumberOrUndefined(fromAmount),
    toAmount: toSDKNumberOrUndefined(result.netAmount),
    isPaused: transferProphet.isPaused,
    minBridgeAmount: toSDKNumberOrUndefined(transferProphet.minBridgeAmount),
    maxBridgeAmount: toSDKNumberOrUndefined(transferProphet.maxBridgeAmount),
    fees,
  }
}

/**
 * @example
 * transformToPublicTransferProphetAggregated(
 *   [
 *     // tokenA : chain1 -> chain2
 *     transferProphetOf(tokenAChain1, tokenAChain2),
 *     // tokenB : chain2 -> chain3
 *     transferProphetOf(tokenBChain2, tokenBChain3),
 *     // tokenC : chain3 -> chain4
 *     transferProphetOf(tokenCChain3, tokenCChain4),
 *   ],
 *   [
 *     // tokenA -> tokenB : chain2
 *     exchangeRateOf(tokenAChain2, tokenBChain2),
 *     // tokenB -> tokenC : chain3
 *     exchangeRateOf(tokenBChain3, tokenCChain3),
 *   ],
 * )
 */
export const transformToPublicTransferProphetAggregated = (
  transferProphets: OneOrMore<PublicTransferProphet>,
  exchangeRates: readonly BigNumber[],
): PublicTransferProphetAggregated<OneOrMore<PublicTransferProphet>> => {
  const firstTransferProphet = transferProphets[0]
  const lastTransferProphet = last(transferProphets)

  const steps = transferProphets.map(
    transformFromPublicTransferProphet,
  ) as any as OneOrMore<TransferProphet>
  const composed = composeTransferProphets(steps, exchangeRates)

  const fromAmount = BigNumber.from(firstTransferProphet.fromAmount)
  const applyResult = applyTransferProphets(steps, fromAmount)

  const fees: PublicTransferProphet["fees"] = applyResult
    .flatMap(r => r.fees)
    .map(f =>
      f.type === "rate"
        ? {
            ...f,
            rate: toSDKNumberOrUndefined(f.rate),
            minimumAmount: toSDKNumberOrUndefined(f.minimumAmount),
            amount: toSDKNumberOrUndefined(f.amount),
          }
        : f.type === "fixed"
          ? {
              ...f,
              amount: toSDKNumberOrUndefined(f.amount),
            }
          : checkNever(f),
    )
    .filter(isNotNull)

  return {
    fromChain: firstTransferProphet.fromChain,
    fromToken: firstTransferProphet.fromToken,
    toChain: lastTransferProphet.toChain,
    toToken: lastTransferProphet.toToken,
    fromAmount: toSDKNumberOrUndefined(fromAmount),
    toAmount: toSDKNumberOrUndefined(last(applyResult).netAmount),
    isPaused: composed.isPaused,
    fees,
    minBridgeAmount: toSDKNumberOrUndefined(composed.minBridgeAmount),
    maxBridgeAmount: toSDKNumberOrUndefined(composed.maxBridgeAmount),
    transferProphets,
  }
}
