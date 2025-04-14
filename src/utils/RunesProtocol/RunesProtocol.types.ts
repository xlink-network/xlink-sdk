/**
 * > Rune protocol messages are termed "runestones".
 */
export interface Runestone {
  edicts: Edict[]
  etching?: Etching
  mint?: RuneId
  pointer?: bigint
}

/**
 * > Runes are transferred by edict
 */
export interface Edict {
  id: RuneId
  amount: bigint
  output: bigint
}

/**
 * > Runes are created by etchings
 */
export interface Etching {
  divisibility?: bigint
  premine?: bigint
  rune?: string
  spacers?: bigint
  symbol?: string
  terms?: Terms
  turbo: boolean
}

export const MAX_SUPPLY = 340282366920938463463374607431768211455n // 2^128 - 1 (u128::MAX)
export const getSupplyFromEtching = (etching: Etching): undefined | bigint => {
  /**
   * https://github.com/ordinals/ord/blob/c80a2d31bc4ef4c5aabfdc865704c56fc7fbfa13/crates/ordinals/src/etching.rs#L17-L25
   */

  const premine = etching.premine ?? 0n
  const cap = etching.terms?.cap ?? 0n
  const amount = etching.terms?.amount ?? 0n

  const supply = premine + cap * amount

  if (supply > MAX_SUPPLY) return undefined

  return supply
}

/**
 * https://github.com/ordinals/ord/blob/c80a2d31bc4ef4c5aabfdc865704c56fc7fbfa13/crates/ordinals/src/etching.rs#L14C13-L14C29
 */
export const MAX_DIVISIBILITY = 255n

/**
 * https://github.com/ordinals/ord/blob/c80a2d31bc4ef4c5aabfdc865704c56fc7fbfa13/crates/ordinals/src/etching.rs#L15C13-L15C24
 */
export const MAX_SPACERS = 0b00000111_11111111_11111111_11111111n

/**
 * > Etchings may contain mint terms:
 */
export interface Terms {
  amount?: bigint
  cap?: bigint
  height: [start: undefined | bigint, end: undefined | bigint]
  offset: [start: undefined | bigint, end: undefined | bigint]
}

/**
 * > Rune names are encoded as modified base-26 integers:
 */
export type Rune = bigint

/**
 * > Rune IDs are encoded as the block height and transaction index of the transaction in which the rune was etched:
 */
export interface RuneId {
  blockHeight: bigint
  txIndex: bigint
}
