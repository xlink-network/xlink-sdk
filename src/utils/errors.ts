import { TxBroadcastResultRejected } from "@stacks/transactions"
import { ChainId, TokenId } from "../xlinkSdkUtils/types"
import { ChainIdInternal, TokenIdInternal } from "./types.internal"

export class XLINKSDKErrorBase extends Error {
  constructor(message: string) {
    super(message)
    this.name = "XLINKSDKErrorBase"
  }
}

export class UnsupportedBridgeRouteError extends XLINKSDKErrorBase {
  fromChain: ChainId
  toChain: ChainId
  fromToken: TokenId
  toToken?: TokenId

  constructor(
    fromChain: ChainId | ChainIdInternal,
    toChain: ChainId | ChainIdInternal,
    fromToken: TokenId | TokenIdInternal,
    toToken?: TokenId | TokenIdInternal,
  ) {
    super(
      `Unsupported chain combination: ${fromToken}(${fromChain}) -> ${toToken ?? "Unknown Token"}(${toChain})`,
    )
    this.name = "UnsupportedBridgeRouteError"

    this.fromChain = ChainIdInternal.toChainId(fromChain)
    this.toChain = ChainIdInternal.toChainId(toChain)
    this.fromToken = TokenIdInternal.toTokenId(fromToken)
    this.toToken = toToken ? TokenIdInternal.toTokenId(toToken) : undefined
  }
}

export class UnsupportedChainError extends XLINKSDKErrorBase {
  constructor(public chainId: ChainId) {
    super(`Unsupported chain: ${chainId}`)
    this.name = "UnsupportedChainError"
  }
}

export class StacksTransactionBroadcastError extends XLINKSDKErrorBase {
  constructor(public cause: TxBroadcastResultRejected) {
    super("Failed to Stacks broadcast transaction")
    this.name = "StacksTransactionBroadcastError"
    this.cause = cause
  }
}
