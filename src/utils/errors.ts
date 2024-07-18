import { TxBroadcastResultRejected } from "@stacks/transactions"
import { ChainId, TokenId } from "../xlinkSdkUtils/types"
import {
  AnyChainIdInternal,
  AnyTokenIdInternal,
  ChainIdInternal,
  TokenIdInternal,
} from "./types.internal"

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
    fromChain: ChainId | AnyChainIdInternal,
    toChain: ChainId | AnyChainIdInternal,
    fromToken: TokenId | AnyTokenIdInternal,
    toToken?: TokenId | AnyTokenIdInternal,
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
export class UnsupportedContractAssignedChainIdError extends XLINKSDKErrorBase {
  constructor(public chainId: bigint) {
    super(`Unsupported smart contract assigned chain id: ${chainId}`)
    this.name = "UnsupportedContractAssignedChainIdError"
  }
}

export class StacksTransactionBroadcastError extends XLINKSDKErrorBase {
  constructor(public cause: TxBroadcastResultRejected) {
    super("Failed to Stacks broadcast transaction")
    this.name = "StacksTransactionBroadcastError"
    this.cause = cause
  }
}
