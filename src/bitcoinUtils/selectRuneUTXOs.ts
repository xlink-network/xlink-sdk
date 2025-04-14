import { BigNumber } from "../utils/BigNumber"
import {
  RuneIdCombined,
  SDKNumber,
  toSDKNumberOrUndefined,
} from "../xlinkSdkUtils/types"
import { UTXOSpendable } from "./bitcoinHelpers"

export class NotEnoughRunesError extends Error {
  remainingAmount: SDKNumber

  constructor(runeId: RuneIdCombined, remainingAmount: BigNumber) {
    super(
      `Not enough UTXOs for rune ${runeId}. Missing ${BigNumber.toString(remainingAmount)}`,
    )
    this.remainingAmount = toSDKNumberOrUndefined(remainingAmount)
  }
}

export interface RuneInfo {
  id: RuneIdCombined
  divisibility: number
}

export type SpendableRuneUTXO = UTXOSpendable & {
  runes: Record<
    RuneIdCombined,
    {
      runeInfo: RuneInfo
      runeAmount: BigNumber
    }
  >
}

export interface RuneRecipient {
  runeId: RuneIdCombined
  amount: BigNumber
}

export type GetAvailableRuneUTXOFn = (
  runeId: RuneIdCombined,
  usedUTXOs: SpendableRuneUTXO[],
) => Promise<null | SpendableRuneUTXO>

export const selectRuneUTXOs = async (
  runeRecipients: RuneRecipient[],
  getAvailableRuneUTXO: GetAvailableRuneUTXOFn,
): Promise<{
  inputRuneUTXOs: SpendableRuneUTXO[]
  changeAmounts: { info: RuneInfo; amount: BigNumber }[]
}> => {
  const usedUTXOs = new Map<`${string}:${number}`, SpendableRuneUTXO>()
  const changeInfos: Partial<
    Record<RuneIdCombined, { info: RuneInfo; amount: BigNumber }>
  > = {}

  for (const recipient of runeRecipients) {
    const changeInfo = changeInfos[recipient.runeId]
    if (
      changeInfo != null &&
      BigNumber.isGte(changeInfo.amount, recipient.amount)
    ) {
      changeInfo.amount = BigNumber.minus(changeInfo.amount, recipient.amount)
      continue
    }

    let utxo = await getAvailableRuneUTXO(
      recipient.runeId,
      Array.from(usedUTXOs.values()),
    )
    while (utxo != null) {
      const utxoPos = `${utxo.txId}:${utxo.index}` as const
      if (usedUTXOs.has(utxoPos)) {
        throw new TypeError(
          `[prepareSendRunesTransaction/selectRuneUTXOs.getAvailableRuneUTXO] UTXO ${utxo.txId}:${utxo.index} already used`,
        )
      }
      usedUTXOs.set(utxoPos, utxo)

      for (const rune of Object.values(utxo.runes)) {
        changeInfos[rune.runeInfo.id] = {
          ...changeInfos[rune.runeInfo.id],
          info: rune.runeInfo,
          amount: BigNumber.sum([
            changeInfos[rune.runeInfo.id]?.amount ?? 0,
            rune.runeAmount,
          ]),
        }
      }

      const changeInfo = changeInfos[recipient.runeId]
      if (changeInfo == null) {
        throw new TypeError(
          "[prepareSendRunesTransaction/selectRuneUTXOs] changeInfo is null, which is not expected",
        )
      }

      const changeAmount = BigNumber.minus(changeInfo.amount, recipient.amount)
      const changeAmountCoveredTransferAmount = BigNumber.isGte(changeAmount, 0)
      if (changeAmountCoveredTransferAmount) {
        changeInfo.amount = changeAmount
        break
      }

      utxo = await getAvailableRuneUTXO(
        recipient.runeId,
        Array.from(usedUTXOs.values()),
      )

      if (utxo == null) {
        throw new NotEnoughRunesError(
          recipient.runeId,
          BigNumber.minus(recipient.amount, changeInfo.amount),
        )
      }
    }
  }

  const changeAmounts = Object.entries(changeInfos).flatMap(
    ([_runeId, info]) =>
      info == null || BigNumber.isZero(info.amount)
        ? []
        : [{ info: info.info, amount: info.amount }],
  )

  return {
    inputRuneUTXOs: Array.from(usedUTXOs.values()),
    changeAmounts,
  }
}
