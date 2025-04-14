import { describe, it, expect } from "vitest"
import { U128SeqEncoding } from "./U128SeqEncoding"

const { encode, decode } = U128SeqEncoding

describe("U128SeqEncoding", () => {
  it("should encode an empty Uint8Array to an empty array", () => {
    const input = new Uint8Array()
    expect(encode(input)).toEqual([0n])
    expect(decode([0n])).toEqual(input)
  })

  it("should encode a Uint8Array with a single byte", () => {
    const raw = new Uint8Array([0b01000010])
    const res: U128SeqEncoding.Encoded = [
      1n,
      0b00000000_00000000_00000000_00000000_00000000_00000000_00000000_00000000_00000000_00000000_00000000_00000000_00000000_00000000_00000000_01000010n,
    ]

    expect(encode(raw)).toEqual(res)
    expect(decode(res)).toEqual(raw)
  })

  it("should encode a Uint8Array with multiple bytes", () => {
    const raw = new Uint8Array([
      0b00000001, 0b00000010, 0b00000100, 0b00001000, 0b00010000, 0b00100000,
      0b01000000, 0b10000000, 0b10000001, 0b10000010, 0b10000100, 0b10001000,
      0b10010000, 0b10100000, 0b11000000, 0b11000001,
    ])
    const res: U128SeqEncoding.Encoded = [
      16n,
      0b11000001_11000000_10100000_10010000_10001000_10000100_10000010_10000001_10000000_01000000_00100000_00010000_00001000_00000100_00000010_00000001n,
    ]

    expect(encode(raw)).toEqual(res)
    expect(decode(res)).toEqual(raw)
  })

  it("should encode a Uint8Array with a length not divisible by 16", () => {
    const raw = new Uint8Array([
      0b00000001, 0b00000010, 0b00000100, 0b00001000, 0b00010000, 0b00100000,
      0b01000000, 0b10000000, 0b10000001, 0b10000010, 0b10000100, 0b10001000,
      0b10010000, 0b10100000, 0b11000000, 0b11000001,

      0b00100101, 0b01001010, 0b10010100, 0b10101000, 0b11010000, 0b11100000,
    ])
    const res: U128SeqEncoding.Encoded = [
      BigInt(raw.length),
      0b11000001_11000000_10100000_10010000_10001000_10000100_10000010_10000001_10000000_01000000_00100000_00010000_00001000_00000100_00000010_00000001n,
      0b00000000_00000000_00000000_00000000_00000000_00000000_00000000_00000000_00000000_00000000_11100000_11010000_10101000_10010100_01001010_00100101n,
    ]

    expect(encode(raw)).toEqual(res)
    expect(decode(res)).toEqual(raw)
  })
})
