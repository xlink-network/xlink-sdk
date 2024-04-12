export class InsufficientBalanceError extends Error {
  constructor(...args: ConstructorParameters<typeof Error>) {
    super(...args)

    this.message =
      this.message || "Insufficient Bitcoin balance with network fees"
  }
}

export class UnsupportedBitcoinInput extends Error {
  constructor(
    txid: string,
    index: number,
    ...args: ConstructorParameters<typeof Error>
  ) {
    super(...args)

    this.message =
      this.message || `Not supported bitcoin input: ${txid}:${index}`
  }
}
