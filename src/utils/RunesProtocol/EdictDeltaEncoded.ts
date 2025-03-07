import { Edict } from "./RunesProtocol.types"
import { sortBy } from "../arrayHelpers"

export namespace EdictDeltaEncoded {
  export const encode = (rawEdicts: Edict[]): Edict[] => {
    /**
     * https://github.com/ordinals/ord/blob/bb4b47aefa7317e56cf995e438116e8158c91b25/docs/src/runes/specification.md?plain=1#L159-L195
     */
    const result: Edict[] = []

    let prevBlockHeight = 0n
    let prevTxIndex = 0n
    for (const edict of sortBy(
      [edict => edict.id.blockHeight, edict => edict.id.txIndex],
      rawEdicts,
    )) {
      const blockHeightDelta = edict.id.blockHeight - prevBlockHeight
      const txIndexDelta =
        blockHeightDelta === 0n
          ? edict.id.txIndex - prevTxIndex
          : edict.id.txIndex

      result.push({
        id: {
          blockHeight: blockHeightDelta,
          txIndex: txIndexDelta,
        },
        amount: edict.amount,
        output: edict.output,
      })

      prevBlockHeight = edict.id.blockHeight
      prevTxIndex = edict.id.txIndex
    }

    return result
  }

  export const decode = (encodedEdicts: Edict[]): Edict[] => {
    const result: Edict[] = []

    let prevBlockHeight = 0n
    let prevTxIndex = 0n
    for (const edict of encodedEdicts) {
      const blockHeight = prevBlockHeight + edict.id.blockHeight
      const txIndex =
        edict.id.blockHeight === 0n
          ? prevTxIndex + edict.id.txIndex
          : edict.id.txIndex

      result.push({
        id: {
          blockHeight,
          txIndex,
        },
        amount: edict.amount,
        output: edict.output,
      })

      prevBlockHeight = blockHeight
      prevTxIndex = txIndex
    }

    return result
  }
}
