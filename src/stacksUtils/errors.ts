import { XLinkSDKErrorBase } from "../utils/errors"
import { TxBroadcastResultRejected } from "@stacks/transactions"

export class StacksTransactionBroadcastError extends XLinkSDKErrorBase {
  constructor(public cause: TxBroadcastResultRejected) {
    super("Failed to Stacks broadcast transaction")
    this.name = "StacksTransactionBroadcastError"
    this.cause = cause
  }
}
