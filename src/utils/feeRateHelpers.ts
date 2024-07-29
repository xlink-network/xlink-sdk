import { BigNumber } from "./BigNumber"
import { concat, last, reduce } from "./arrayHelpers"
import { OneOrMore } from "./typeHelpers"
import { TransferProphet } from "./types/TransferProphet"
import { TransferProphetAggregated } from "./types/TransferProphet"

export interface TransferProphetAppliedResult {
  feeAmount: BigNumber
  netAmount: BigNumber
}

export const applyTransferProphets = (
  transferProphets: OneOrMore<TransferProphet>,
  amount: BigNumber,
): OneOrMore<TransferProphetAppliedResult> => {
  return reduce(
    (acc, transferProphet) =>
      concat(acc, [applyTransferProphet(transferProphet, last(acc).netAmount)]),
    [{ feeAmount: BigNumber.ZERO, netAmount: amount }],
    transferProphets,
  )
}

export const applyTransferProphet = (
  transferProphet: TransferProphet,
  amount: BigNumber,
): TransferProphetAppliedResult => {
  const feeAmount = BigNumber.max([
    transferProphet.minFeeAmount,
    BigNumber.mul(transferProphet.feeRate, amount),
  ])
  const netAmount = BigNumber.max([
    BigNumber.ZERO,
    BigNumber.minus(amount, feeAmount),
  ])
  return { feeAmount, netAmount }
}

export const composeTransferProphets = (
  transferProphets: readonly TransferProphet[],
): TransferProphetAggregated<TransferProphet[]> => {
  return reduce(
    (res, transferProphet) => ({
      ...composeTransferProphet2(res, transferProphet),
      transferProphets: [...res.transferProphets, transferProphet],
    }),
    composeTransferProphet2(
      transferProphets[0],
      transferProphets[1],
    ) as TransferProphetAggregated<TransferProphet[]>,
    transferProphets.slice(2),
  )
}

export const composeTransferProphet2 = (
  transferProphet1: TransferProphet,
  transferProphet2: TransferProphet,
): TransferProphetAggregated<[TransferProphet, TransferProphet]> => {
  const minFeeAmount = BigNumber.sum([
    transferProphet1.minFeeAmount,
    transferProphet2.minFeeAmount,
  ])

  const secondStepFeeAmountScaleRatio = getAmountBeforeFirstStepRate(
    transferProphet1.feeRate,
  )

  let minBridgeAmount: BigNumber | null = null
  if (
    BigNumber.isZero(minFeeAmount) /* min fee amount not set */ &&
    transferProphet1.minBridgeAmount == null &&
    transferProphet2.minBridgeAmount == null
  ) {
    minBridgeAmount = null
  } else {
    minBridgeAmount = BigNumber.max([
      minFeeAmount,
      transferProphet1.minBridgeAmount ?? 0,
      transferProphet2.minBridgeAmount == null
        ? 0
        : BigNumber.mul(
            transferProphet2.minBridgeAmount,
            secondStepFeeAmountScaleRatio,
          ),
    ])
  }

  let maxBridgeAmount: BigNumber | null = null
  if (
    transferProphet1.maxBridgeAmount == null &&
    transferProphet2.maxBridgeAmount == null
  ) {
    maxBridgeAmount = null
  } else if (
    transferProphet1.maxBridgeAmount != null &&
    transferProphet2.maxBridgeAmount != null
  ) {
    maxBridgeAmount = BigNumber.min([
      transferProphet1.maxBridgeAmount,
      BigNumber.mul(
        transferProphet2.maxBridgeAmount,
        secondStepFeeAmountScaleRatio,
      ),
    ])
  } else {
    maxBridgeAmount =
      transferProphet1.maxBridgeAmount ?? transferProphet2.maxBridgeAmount
  }

  return {
    isPaused: transferProphet1.isPaused || transferProphet2.isPaused,
    feeToken: transferProphet1.feeToken,
    feeRate: composeRates2(transferProphet1.feeRate, transferProphet2.feeRate),
    minFeeAmount,
    minBridgeAmount,
    maxBridgeAmount,
    transferProphets: [transferProphet1, transferProphet2],
  }
}

export const composeRates2 = (
  rate1: BigNumber,
  rate2: BigNumber,
): BigNumber => {
  /**
   * n = bridge amount
   * rate = ((n * r1) +
   *         (n * (1 - r1)) * r2)
   *        / n
   *      |
   *      V
   *      = (n * r1 / n) +
   *        (n * (1 - r1) * r2 / n)
   *      |
   *      V
   *      = r1 + (1 - r1) * r2
   */
  // prettier-ignore
  return BigNumber.sum([
    rate1,
    BigNumber.mul(
      BigNumber.minus(1, rate1),
      rate2,
    ),
  ])
}

export const getAmountBeforeFirstStepRate = (
  firstStepRate: BigNumber,
): BigNumber => {
  /**
   * amount before first step = n
   *
   * amount = n - n * firstStepFeeRate
   *        = n * (1 - firstStepFeeRate)
   *        |
   *        V
   *      n = amount / (1 - firstStepFeeRate)
   *        +
   *      n = amount * scale // the `scale` is what we want to find
   *        |
   *        V
   * amount * scale = amount / (1 - firstStepFeeRate)
   *          scale = (amount / (1 - firstStepFeeRate)) / amount
   *          scale = 1 / (1 - firstStepFeeRate)
   */
  return BigNumber.div(1, BigNumber.minus(1, firstStepRate))
}
