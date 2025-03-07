export namespace RuneName {
  export const MAX_NUMBER = 340282366920938463463374607431768211455n // 2^128 - 1 (u128::MAX)

  /**
   * encode to base-26 integer
   *
   * https://github.com/ordinals/ord/blob/744a3d6bec4422b2b1d599f0fa98bf69df04e4ad/docs/src/runes/specification.md#L85
   * https://github.com/ordinals/ord/blob/744a3d6bec4422b2b1d599f0fa98bf69df04e4ad/crates/ordinals/src/rune.rs#L142-L157
   */
  export const encode = (name: string): bigint => {
    const minCharCode = "A".charCodeAt(0)
    const maxCharCode = "Z".charCodeAt(0)

    const result = name.split("").reduce((acc, char, idx) => {
      if (idx > 0) acc += 1n

      const charCode = char.charCodeAt(0)

      if (charCode < minCharCode || charCode > maxCharCode) {
        throw new Error(`Invalid character in name: ${char}`)
      }

      return acc * 26n + BigInt(charCode - minCharCode)
    }, 0n)

    if (result > MAX_NUMBER) {
      throw new Error(`Encoded name overflow u128: ${name}`)
    }

    return result
  }

  /**
   * decode from base-26 integer
   *
   * https://github.com/ordinals/ord/blob/744a3d6bec4422b2b1d599f0fa98bf69df04e4ad/crates/ordinals/src/rune.rs#L113-L136
   */
  export const decode = (rune: bigint): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

    let n = rune + 1n
    const symbol: string[] = []
    while (n > 0n) {
      symbol.push(chars[Number((n - 1n) % 26n)])
      n = (n - 1n) / 26n
    }
    return symbol.reverse().join("")
  }
}
