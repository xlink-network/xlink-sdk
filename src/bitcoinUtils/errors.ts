import { BroSDKErrorBase } from "../utils/errors"

export class InsufficientBitcoinBalanceError extends BroSDKErrorBase {
  constructor(...args: ConstructorParameters<typeof Error>) {
    super(...args)

    this.message =
      this.message || "Insufficient Bitcoin balance with network fees"
  }
}

export class UnsupportedBitcoinInput extends BroSDKErrorBase {
  constructor(
    public txid: string,
    public index: number,
    ...args: ConstructorParameters<typeof Error>
  ) {
    super(...args)

    this.message =
      this.message || `Not supported bitcoin input: ${txid}:${index}`
  }
}
