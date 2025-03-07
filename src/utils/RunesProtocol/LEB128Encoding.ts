/**
 * https://github.com/bitcoin/bips/blob/9dc3f74b384f143b7f1bdad30dc0fe2529c8e63f/bip-annex.mediawiki#compressedint-integer-encoding
 */
export namespace LEB128Encoding {
  /**
   * https://github.com/ordinals/ord/blob/f07db7121807a8d0e4c1eb05ba9efd3fac27cbc7/crates/ordinals/src/varint.rs#L3-L9
   */
  export const encode = (input: bigint): Uint8Array => {
    const result: number[] = []

    let _input = input
    while (_input >> 7n > 0n) {
      result.push(toLeBytes(_input)[0] | 0b1000_0000)
      _input >>= 7n
    }
    result.push(toLeBytes(_input)[0])

    return Uint8Array.from(result)
  }
  function toLeBytes(input: bigint): number[] {
    const res = toBeBytes(input)
    res.reverse()
    return res
  }
  function toBeBytes(input: bigint): number[] {
    let hex = input.toString(16)
    if (hex.length % 2 !== 0) hex = "0" + hex

    const result: number[] = []

    let offset = 0
    while (offset < hex.length) {
      result.push(parseInt(hex.slice(offset, offset + 2), 16))
      offset += 2
    }
    return result
  }

  export class LEB128DecodingError extends Error {
    constructor(message: string) {
      super(message)
      this.name = "LEB128DecodingError"
    }
  }

  export class LEB128DecodingOverlongError extends LEB128DecodingError {
    constructor(bytesLimit: number) {
      super(
        `LEB128DecodingError: too long, expected at most ${bytesLimit} bytes`,
      )
      this.name = "LEB128DecodingOverlongError"
    }
  }

  export class LEB128DecodingUnterminatedError extends LEB128DecodingError {
    constructor() {
      super("LEB128DecodingError: LEB128 encoded number is unterminated")
      this.name = "LEB128DecodingUnterminatedError"
    }
  }

  /**
   * https://github.com/ordinals/ord/blob/f07db7121807a8d0e4c1eb05ba9efd3fac27cbc7/crates/ordinals/src/varint.rs#L15-L37
   */
  export const decode = (
    input: Uint8Array,
    options: {
      bytesLimit?: number
    } = {},
  ): [number: bigint, byteLength: number] => {
    let result = 0n

    let offset = 0
    while (input[offset] != null) {
      if (options.bytesLimit != null && offset > options.bytesLimit) {
        throw new LEB128DecodingOverlongError(options.bytesLimit)
      }

      const value = BigInt(input[offset]) & 0b0111_1111n

      result |= value << BigInt(7 * offset)

      if ((BigInt(input[offset]) & 0b1000_0000n) === 0n) {
        return [result, offset + 1]
      }

      offset += 1
    }

    throw new LEB128DecodingUnterminatedError()
  }
}
