import { BigNumber } from "./BigNumber"
import { concat, last, reduce } from "./arrayHelpers"
import { OneOrMore } from "./typeHelpers"

export type TransferProphetGroup<
  T extends Readonly<TransferProphet[]> = OneOrMore<TransferProphet>,
> = Omit<TransferProphet, "waitBlocks"> & {
  transferProphets: T
}

export interface TransferProphet {
  isPaused: boolean
  feeRate: BigNumber
  minFee: BigNumber
  minAmount: null | BigNumber
  maxAmount: null | BigNumber
}

export interface TransferProphetAppliedResult {
  fee: BigNumber
  netAmount: BigNumber
}

export const applyTransferProphets = (
  transferProphets: OneOrMore<TransferProphet>,
  amount: BigNumber,
): OneOrMore<TransferProphetAppliedResult> => {
  return reduce(
    (acc, transferProphet) =>
      concat(acc, [applyTransferProphet(transferProphet, last(acc).netAmount)]),
    [{ fee: BigNumber.ZERO, netAmount: amount }],
    transferProphets,
  )
}

export const applyTransferProphet = (
  transferProphet: TransferProphet,
  amount: BigNumber,
): TransferProphetAppliedResult => {
  const fee = BigNumber.max([
    transferProphet.minFee,
    BigNumber.mul(transferProphet.feeRate, amount),
  ])
  const netAmount = BigNumber.max([
    BigNumber.ZERO,
    BigNumber.minus(amount, fee),
  ])
  return { fee, netAmount }
}

export const composeTransferProphet2 = (
  transferProphet1: TransferProphet,
  transferProphet2: TransferProphet,
): TransferProphetGroup<[TransferProphet, TransferProphet]> => {
  const minFeeAmount = BigNumber.sum([
    transferProphet1.minFee,
    transferProphet2.minFee,
  ])

  const secondStepFeeAmountScaleRatio = getAmountBeforeFirstStepRate(
    transferProphet1.feeRate,
  )

  return {
    isPaused: transferProphet1.isPaused || transferProphet2.isPaused,
    feeRate: composeRates2(transferProphet1.feeRate, transferProphet2.feeRate),
    minFee: minFeeAmount,
    minAmount:
      transferProphet1.minAmount == null && transferProphet2.minAmount == null
        ? null
        : BigNumber.max([
            minFeeAmount,
            transferProphet1.minAmount ?? 0,
            transferProphet2.minAmount == null
              ? 0
              : BigNumber.mul(
                  transferProphet2.minAmount,
                  secondStepFeeAmountScaleRatio,
                ),
          ]),
    maxAmount:
      transferProphet1.maxAmount == null && transferProphet2.maxAmount == null
        ? null
        : BigNumber.min([
            transferProphet1.maxAmount ?? Infinity,
            transferProphet2.maxAmount == null
              ? Infinity
              : BigNumber.mul(
                  transferProphet2.maxAmount,
                  secondStepFeeAmountScaleRatio,
                ),
          ]),
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
