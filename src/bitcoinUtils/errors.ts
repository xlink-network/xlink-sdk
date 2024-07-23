import { XLinkSDKErrorBase } from "../utils/errors"

export class InsufficientBitcoinBalanceError extends XLinkSDKErrorBase {
  constructor(...args: ConstructorParameters<typeof Error>) {
    super(...args)

    this.message =
      this.message || "Insufficient Bitcoin balance with network fees"
  }
}

export class UnsupportedBitcoinInput extends XLinkSDKErrorBase {
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
