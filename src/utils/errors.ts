import { TxBroadcastResultRejected } from "@stacks/transactions"
import { ChainId, TokenId } from "../xlinkSdkUtils/types"

export class XLinkSDKErrorBase extends Error {
  constructor(message: string) {
    super(message)
    this.name = "XLinkSDKErrorBase"
  }
}

export class UnsupportedBridgeRouteError extends XLinkSDKErrorBase {
  constructor(
    public fromChain: ChainId,
    public toChain: ChainId,
    public fromToken: TokenId,
    public toToken?: TokenId,
  ) {
    super(
      `Unsupported chain combination: ${fromToken}(${fromChain}) -> ${toToken ?? "Unknown Token"}(${toChain})`,
    )
    this.name = "UnsupportedBridgeRouteError"
  }
}

export class UnsupportedChainError extends XLinkSDKErrorBase {
  constructor(public chainId: ChainId) {
    super(`Unsupported chain: ${chainId}`)
    this.name = "UnsupportedChainError"
  }
}
export class UnsupportedContractAssignedChainIdError extends XLinkSDKErrorBase {
  constructor(public chainId: bigint) {
    super(`Unsupported smart contract assigned chain id: ${chainId}`)
    this.name = "UnsupportedContractAssignedChainIdError"
  }
}

export class StacksTransactionBroadcastError extends XLinkSDKErrorBase {
  constructor(public cause: TxBroadcastResultRejected) {
    super("Failed to Stacks broadcast transaction")
    this.name = "StacksTransactionBroadcastError"
    this.cause = cause
  }
}
