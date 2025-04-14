import { OP, Transaction } from "@scure/btc-signer"
import { Result } from "../Result"
import { OneOrMore } from "../typeHelpers"
import {
  integerSequenceFromBitcoinOpReturnScript,
  integerSequenceToBitcoinOpReturnScript,
  RunestoneParseFromBitcoinTransactionError,
} from "./RunesIntegerSequence"
import {
  messageFromIntegerSequence,
  messageToIntegerSequence,
} from "./RunesMessage"
import { Runestone } from "./RunesProtocol.types"
import { runestoneFromMessage, runestoneToMessage } from "./Runestone"
import { range } from "../arrayHelpers"

export const RUNES_MAGIC_NUMBER = OP.OP_13

export const isRunestoneOpReturnScript = (
  opReturnScript: Uint8Array,
): boolean => {
  return (
    opReturnScript[0] === OP.RETURN && opReturnScript[1] === RUNES_MAGIC_NUMBER
  )
}

export const fromBitcoinTransaction = (
  tx: Transaction,
):
  | undefined
  | Result<
      Runestone,
      Readonly<OneOrMore<RunestoneParseFromBitcoinTransactionError>>
    > => {
  /**
   * Referring the original implementation:
   *
   * https://github.com/ordinals/ord/blob/744a3d6bec4422b2b1d599f0fa98bf69df04e4ad/crates/ordinals/src/runestone.rs#L25-L126
   */

  const outputIndex = range(0, tx.outputsLength).find(index => {
    const output = tx.getOutput(index)
    if (output.script == null) return false
    return isRunestoneOpReturnScript(output.script)
  })

  if (outputIndex == null) return undefined

  return fromBitcoinOpReturnScript(tx.getOutput(outputIndex).script!)
}

export const fromBitcoinOpReturnScript = (
  opReturnScript: Uint8Array,
): Result<
  Runestone,
  Readonly<OneOrMore<RunestoneParseFromBitcoinTransactionError>>
> => {
  const intSeq = integerSequenceFromBitcoinOpReturnScript(opReturnScript)
  const parsedMessage = Result.chainOk(messageFromIntegerSequence, intSeq)
  return Result.chainOk(runestoneFromMessage, parsedMessage)
}

export const toBitcoinOpReturnScript = (runestone: Runestone): Uint8Array => {
  return integerSequenceToBitcoinOpReturnScript(
    messageToIntegerSequence(runestoneToMessage(runestone)),
  )
}
