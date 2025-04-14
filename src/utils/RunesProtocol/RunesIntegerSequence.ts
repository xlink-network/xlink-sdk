import { OP, Script } from "@scure/btc-signer"
import { Bytes } from "@scure/btc-signer/utils"
import { Result } from "../Result"
import { OneOrMore } from "../typeHelpers"
import { LEB128Encoding } from "./LEB128Encoding"
import { MessageParseError } from "./RunesMessage"
import { RunestoneParseError } from "./Runestone"
import { sum } from "../numberHelpers"

export enum RunestoneParseFromBitcoinTransactionErrorType {
  InvalidBitcoinScript = "InvalidBitcoinScript",
}

export type RunestoneParseFromBitcoinTransactionError =
  | RunestoneParseError
  | MessageParseError
  | { type: RunestoneParseFromBitcoinTransactionErrorType }

/**
 * https://github.com/bitcoin/bitcoin/blob/e1ed37edaedc85b8c3468bd9a726046344036243/src/script/script.h#L23
 */
const MAX_SCRIPT_ELEMENT_SIZE = 520
/**
 * https://github.com/bitcoin/bitcoin/blob/e1ed37edaedc85b8c3468bd9a726046344036243/src/script/script.h#L32
 */
const MAX_SCRIPT_SIZE = 10000

export const integerSequenceFromBitcoinOpReturnScript = (
  opReturnScript: Uint8Array,
): Result<
  bigint[],
  Readonly<OneOrMore<RunestoneParseFromBitcoinTransactionError>>
> => {
  const _runesScript = Script.decode(opReturnScript).slice(2)
  if (_runesScript.some(op => !(op instanceof Uint8Array))) {
    return Result.error([
      {
        type: RunestoneParseFromBitcoinTransactionErrorType.InvalidBitcoinScript,
      },
    ])
  }
  const runesData = combineUint8Arrays(_runesScript as Uint8Array[])

  const intSeq: bigint[] = []
  let offset = 0
  while (offset < runesData.length) {
    const [value, byteLength] = LEB128Encoding.decode(runesData.slice(offset), {
      /**
       * https://github.com/ordinals/ord/blob/bb4b47aefa7317e56cf995e438116e8158c91b25/docs/src/runes/specification.md?plain=1#L128
       */
      bytesLimit: 18,
    })
    intSeq.push(value)
    offset += byteLength
  }

  return Result.ok(intSeq)
}

export const integerSequenceToBitcoinOpReturnScript = (
  integerSequence: bigint[],
): Uint8Array => {
  /**
   * Referring the original implementation:
   *
   * https://github.com/ordinals/ord/blob/744a3d6bec4422b2b1d599f0fa98bf69df04e4ad/crates/ordinals/src/runestone.rs#L128-L190
   */

  const data = combineUint8Arrays(
    integerSequence.map(value => LEB128Encoding.encode(value)),
  )

  const script: (keyof typeof OP | Bytes | number)[] = ["RETURN", "OP_13"]

  let offset = 0
  while (offset < data.length) {
    const chunk = data.slice(offset, offset + MAX_SCRIPT_ELEMENT_SIZE)
    script.push(chunk)
    offset += chunk.length
  }

  const scriptData = Script.encode(script)
  if (scriptData.length > MAX_SCRIPT_SIZE) {
    throw new Error("Bitcoin Script too large")
  }

  return scriptData
}

const combineUint8Arrays = (arrays: Uint8Array[]): Uint8Array => {
  const totalLength = sum(arrays.map(arr => arr.length))
  const result = new Uint8Array(totalLength)
  let offset = 0
  arrays.forEach(arr => {
    result.set(arr, offset)
    offset += arr.length
  })
  return result
}
