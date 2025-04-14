/**
 * https://github.com/ordinals/ord/blob/cb4de8dedf8485d265e6cd0edab7c2c894685190/crates/ordinals/src/runestone/message.rs#L3
 */
import type { Edict } from "./RunesProtocol.types"
import { arraySplit, hasLength } from "../arrayHelpers"
import { Result } from "../Result"
import { OneOrMore } from "../typeHelpers"

export enum Tag {
  Body = 0,
  Flags = 2,
  Rune = 4,
  Premine = 6,
  Cap = 8,
  Amount = 10,
  HeightStart = 12,
  HeightEnd = 14,
  OffsetStart = 16,
  OffsetEnd = 18,
  Mint = 20,
  Pointer = 22,
  Cenotaph = 126,

  Divisibility = 1,
  Spacers = 3,
  Symbol = 5,
  Nop = 127,
}
const _knownTags = Object.values(Tag).filter(
  (tag): tag is Tag => typeof tag !== "string",
)

export enum Flag {
  Etching = 0,
  Terms = 1,
  Turbo = 2,
  Cenotaph = 127,
}
export const FLAG_ETCHING_MASK = 1n << BigInt(Flag.Etching)
export const FLAG_TERMS_MASK = 1n << BigInt(Flag.Terms)
export const FLAG_TURBO_MASK = 1n << BigInt(Flag.Turbo)

export enum MessageParseErrorType {
  /**
   * > "trailing integers in body"
   */
  TrailingIntegers = "TrailingIntegers",

  /**
   * > "field with missing value"
   */
  TruncatedField = "TruncatedField",

  /**
   * > "unrecognized even tag"
   */
  UnrecognizedEvenTag = "UnrecognizedEvenTag",
}
export interface MessageParseError {
  type: MessageParseErrorType
}

export interface Message {
  edicts: Edict[]
  fields: Map<Tag, OneOrMore<bigint>>
}

export const messageFromIntegerSequence = (
  intSeq: bigint[],
): Result<Message, Readonly<OneOrMore<MessageParseError>>> => {
  /**
   * Referred to the following implementation:
   *
   * https://github.com/ordinals/ord/blob/cb4de8dedf8485d265e6cd0edab7c2c894685190/crates/ordinals/src/runestone/message.rs#L10-L55
   */

  const fields = new Map<Tag, OneOrMore<bigint>>()
  const edicts: Edict[] = []

  if (
    Array.from(fields.keys()).some(
      tag => tag % 2 === 0 && !_knownTags.includes(tag),
    )
  ) {
    return Result.error([{ type: MessageParseErrorType.UnrecognizedEvenTag }])
  }

  let offset = 0
  while (offset < intSeq.length) {
    const tag = Number(intSeq[offset]) as Tag

    if (tag === Tag.Body) {
      // the rest are all edicts
      const rest = Array.from(intSeq.slice(offset + 1))
      const chunks = arraySplit((n, idx) => Math.floor(idx / 4), rest)

      for (const chunk of chunks) {
        if (!hasLength(chunk, 4)) {
          return Result.error([
            { type: MessageParseErrorType.TrailingIntegers },
          ])
        }

        const [blockHeightDelta, txIndexDelta, amount, output] = chunk
        edicts.push({
          id: {
            blockHeight: blockHeightDelta,
            txIndex: txIndexDelta,
          },
          amount,
          output,
        })
      }

      break
    }

    const value = intSeq[offset + 1]
    if (value == null) {
      return Result.error([{ type: MessageParseErrorType.TruncatedField }])
    }

    fields.set(tag, [...(fields.get(tag) ?? []), value])

    offset += 2
  }

  return Result.ok({ edicts, fields })
}

export const messageToIntegerSequence = (message: Message): bigint[] => {
  const intSeq: bigint[] = []

  _knownTags.forEach(tag => {
    if (tag === Tag.Body) return

    const values = message.fields.get(tag) ?? []
    /**
     * https://github.com/ordinals/ord/blob/bb4b47aefa7317e56cf995e438116e8158c91b25/docs/src/runes/specification.md?plain=1#L144-L145
     */
    values.forEach(value => {
      intSeq.push(BigInt(tag), value)
    })
  })

  if (message.edicts.length > 0) {
    intSeq.push(
      BigInt(Tag.Body),
      ...message.edicts.flatMap(edict => [
        edict.id.blockHeight,
        edict.id.txIndex,
        edict.amount,
        edict.output,
      ]),
    )
  }

  return intSeq
}
