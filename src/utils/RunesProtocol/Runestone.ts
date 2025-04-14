import { Result } from "../Result"
import { OneOrMore } from "../typeHelpers"
import { EdictDeltaEncoded } from "./EdictDeltaEncoded"
import { RuneName } from "./RuneName"
import {
  FLAG_ETCHING_MASK,
  FLAG_TERMS_MASK,
  FLAG_TURBO_MASK,
  Message,
  Tag,
} from "./RunesMessage"
import {
  getSupplyFromEtching,
  MAX_DIVISIBILITY,
  MAX_SPACERS,
  Runestone,
} from "./RunesProtocol.types"

export enum RunestoneParseErrorType {
  SupplyOverflow = "SupplyOverflow",
  UnrecognizedFlag = "UnrecognizedFlag",
}

export type RunestoneParseError = {
  type: RunestoneParseErrorType
}

export const runestoneFromMessage = (
  message: Message,
): Result<Runestone, Readonly<OneOrMore<RunestoneParseError>>> => {
  const runestone: Runestone = {
    edicts: EdictDeltaEncoded.decode(message.edicts),
  }

  const flags = message.fields.get(Tag.Flags) ?? [0n]

  let remainingFlag = flags[0]
  const hasEtching = (remainingFlag & FLAG_ETCHING_MASK) > 0n
  remainingFlag &= ~FLAG_ETCHING_MASK
  const hasTerms = (remainingFlag & FLAG_TERMS_MASK) > 0n
  remainingFlag &= ~FLAG_TERMS_MASK
  const hasTurbo = (remainingFlag & FLAG_TURBO_MASK) > 0n
  remainingFlag &= ~FLAG_TURBO_MASK
  if (remainingFlag !== 0n) {
    return Result.error([{ type: RunestoneParseErrorType.UnrecognizedFlag }])
  }

  if (hasEtching) {
    runestone.etching = {
      turbo: hasTurbo,
    }

    if (hasTerms) {
      runestone.etching.terms = {
        amount: message.fields.get(Tag.Amount)?.[0],
        cap: message.fields.get(Tag.Cap)?.[0],
        height: [
          message.fields.get(Tag.HeightStart)?.[0],
          message.fields.get(Tag.HeightEnd)?.[0],
        ],
        offset: [
          message.fields.get(Tag.OffsetStart)?.[0],
          message.fields.get(Tag.OffsetEnd)?.[0],
        ],
      }
    }

    if (message.fields.has(Tag.Divisibility)) {
      const divisibility = message.fields.get(Tag.Divisibility)![0]
      if (divisibility <= MAX_DIVISIBILITY) {
        runestone.etching.divisibility = divisibility
      }
    }

    if (message.fields.has(Tag.Premine)) {
      runestone.etching.premine = message.fields.get(Tag.Premine)![0]
    }

    if (message.fields.has(Tag.Rune)) {
      const rune = message.fields.get(Tag.Rune)![0]
      if (rune <= RuneName.MAX_NUMBER) {
        runestone.etching.rune = RuneName.decode(rune)
      }
    }

    if (message.fields.has(Tag.Spacers)) {
      const spacers = message.fields.get(Tag.Spacers)![0]
      if (spacers <= MAX_SPACERS) {
        runestone.etching.spacers = spacers
      }
    }

    if (message.fields.has(Tag.Symbol)) {
      runestone.etching.symbol = String.fromCodePoint(
        Number(message.fields.get(Tag.Symbol)![0]),
      )
    }
  }

  if (message.fields.has(Tag.Mint)) {
    const mint = message.fields.get(Tag.Mint)!
    runestone.mint = { blockHeight: mint[0], txIndex: mint[1] }
  }

  if (message.fields.has(Tag.Pointer)) {
    runestone.pointer = message.fields.get(Tag.Pointer)![0]
  }

  if (runestone.etching) {
    const supply = getSupplyFromEtching(runestone.etching)
    if (supply == undefined) {
      return Result.error([{ type: RunestoneParseErrorType.SupplyOverflow }])
    }
  }

  return Result.ok(runestone)
}

export const runestoneToMessage = (runestone: Runestone): Message => {
  const fields: Message["fields"] = new Map()

  let flag = 0n
  if (runestone.etching) {
    flag |= FLAG_ETCHING_MASK
    if (runestone.etching.terms) {
      flag |= FLAG_TERMS_MASK
    }
    if (runestone.etching.turbo) {
      flag |= FLAG_TURBO_MASK
    }
  }
  fields.set(Tag.Flags, [flag])

  if (runestone.etching) {
    if (runestone.etching.divisibility != null) {
      fields.set(Tag.Divisibility, [runestone.etching.divisibility])
    }

    if (runestone.etching.premine != null) {
      fields.set(Tag.Premine, [runestone.etching.premine])
    }

    if (runestone.etching.rune != null) {
      fields.set(Tag.Rune, [RuneName.encode(runestone.etching.rune)])
    }

    if (runestone.etching.spacers != null) {
      fields.set(Tag.Spacers, [runestone.etching.spacers])
    }

    const symbolCodePoint = runestone.etching.symbol?.codePointAt(0)
    if (runestone.etching.symbol != null && symbolCodePoint != null) {
      fields.set(Tag.Symbol, [BigInt(symbolCodePoint)])
    }

    if (runestone.etching.terms) {
      const terms = runestone.etching.terms
      if (terms.amount) {
        fields.set(Tag.Amount, [terms.amount])
      }
      if (terms.cap) {
        fields.set(Tag.Cap, [terms.cap])
      }
      if (terms.height[0] != null) {
        fields.set(Tag.HeightStart, [terms.height[0]])
      }
      if (terms.height[1] != null) {
        fields.set(Tag.HeightEnd, [terms.height[1]])
      }
      if (terms.offset[0] != null) {
        fields.set(Tag.OffsetStart, [terms.offset[0]])
      }
      if (terms.offset[1] != null) {
        fields.set(Tag.OffsetEnd, [terms.offset[1]])
      }
    }
  }

  if (runestone.mint != null) {
    fields.set(Tag.Mint, [runestone.mint.blockHeight, runestone.mint.txIndex])
  }

  if (runestone.pointer != null) {
    fields.set(Tag.Pointer, [runestone.pointer])
  }

  return { edicts: EdictDeltaEncoded.encode(runestone.edicts), fields }
}
