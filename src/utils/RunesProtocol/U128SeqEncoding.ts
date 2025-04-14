export namespace U128SeqEncoding {
  const bytesPerU128 =
    128 /* 1 u128 can store 128 bit */ / 8 /* 1 byte can store 8 bit */

  export type Encoded = [intCount: bigint, ...bigint[]]

  /**
   * Encode Uint8Array to an u128 integer sequence
   */
  export const encode = (data: Uint8Array): Encoded => {
    const result: bigint[] = []

    const integerCount = Math.ceil(data.length / bytesPerU128)

    for (let i = 0; i < integerCount; i++) {
      let block = 0n
      // convert each byte to bigint and shift it by the corresponding number of bits
      for (let j = 0; j < bytesPerU128; j++) {
        const idx = i * bytesPerU128 + j
        if (idx < data.length) {
          const byte = BigInt(data[idx])
          block |= byte << (BigInt(j) * 8n)
        }
      }
      result[i] = block
    }

    return [BigInt(data.length), ...result]
  }

  /**
   * Decode u128 integer sequence to a Uint8Array
   */
  export const decode = (encoded: Encoded): Uint8Array => {
    const [byteCount, ...intSeq] = encoded
    const res = new Uint8Array(Number(byteCount))

    let bytePos = 0
    intSeq.forEach(int => {
      for (let i = 0; i < bytesPerU128; i++) {
        res[bytePos + i] = Number((int >> (BigInt(i) * 8n)) & 0xffn)
      }
      bytePos += bytesPerU128
    })

    return res
  }
}
