import { describe, it, expect } from "vitest"
import { LEB128Encoding } from "./LEB128Encoding"

const encode = LEB128Encoding.encode
const tryDecode = LEB128Encoding.decode

describe("LEB128Encoding", () => {
  it("zero round trips successfully", () => {
    const n = BigInt(0)
    const encoded = encode(n)
    const [decoded, length] = tryDecode(encoded)
    expect(decoded).toBe(n)
    expect(length).toBe(encoded.length)
  })

  it("u128 max round trips successfully", () => {
    const n = BigInt("340282366920938463463374607431768211455") // u128::MAX
    const encoded = encode(n)
    const [decoded, length] = tryDecode(encoded)
    expect(decoded).toBe(n)
    expect(length).toBe(encoded.length)
  })

  it("powers of two round trip successfully", () => {
    for (let i = 0; i < 128; i++) {
      const n = BigInt(1) << BigInt(i)
      const encoded = encode(n)
      const [decoded, length] = tryDecode(encoded)
      expect(decoded).toBe(n)
      expect(length).toBe(encoded.length)
    }
  })

  it("alternating bit strings round trip successfully", () => {
    let n = BigInt(0)
    for (let i = 0; i < 129; i++) {
      n = (n << BigInt(1)) | BigInt(i % 2)
      const encoded = encode(n)
      const [decoded, length] = tryDecode(encoded)
      expect(decoded).toBe(n)
      expect(length).toBe(encoded.length)
    }
  })

  it("support number length limit", () => {
    const valid = new Uint8Array([...Array(18).fill(128), 0])
    const invalid = new Uint8Array([...Array(19).fill(128), 0])
    expect(
      tryDecode(valid, {
        bytesLimit: 18,
      }),
    ).toEqual([BigInt(0), 19])
    expect(() =>
      tryDecode(invalid, {
        bytesLimit: 18,
      }),
    ).toThrow(LEB128Encoding.LEB128DecodingOverlongError)
  })

  it("throws error when decoding unterminated LEB128", () => {
    expect.assertions(2)
    expect(() => tryDecode(new Uint8Array([128]))).toThrow(
      LEB128Encoding.LEB128DecodingUnterminatedError,
    )
    expect(() =>
      LEB128Encoding.decode(Uint8Array.from([0b10001111, 0b10001111])),
    ).toThrow(LEB128Encoding.LEB128DecodingUnterminatedError)
  })
})
