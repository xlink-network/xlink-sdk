import { ChainId, TokenId } from "../xlinkSdkUtils/types"

/** Extends the Error class and serves as the base for all custom errors within the SDK. */
export class XLinkSDKErrorBase extends Error {
  constructor(...args: ConstructorParameters<typeof Error>) {
    super(...args)
    this.name = "XLinkSDKErrorBase"
  }
}

export class TooFrequentlyError extends XLinkSDKErrorBase {
  constructor(
    public methodPath: string[],
    public retryAfter?: number,
    options?: ErrorConstructorOptions,
  ) {
    super(
      `Call method ${methodPath.join(".")} too frequently` + retryAfter == null
        ? ""
        : `, retry after ${retryAfter} seconds`,
      options,
    )
    this.name = "TooFrequentlyError"
  }
}

/** It is thrown when a method in the SDK receives invalid parameters. */
export class InvalidMethodParametersError extends XLinkSDKErrorBase {
  constructor(
    public methodPath: string[],
    public params: {
      name: string
      expected: string
      received: string
    }[],
  ) {
    super(`Invalid method parameters of method ${methodPath.join(".")}`)
    this.name = "InvalidMethodParametersError"
  }
}

/** It is thrown when an attempt is made to bridge tokens between unsupported chains in the SDK. */
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

/** It is thrown when a method in the SDK receives an unknown chain. */
export class UnsupportedChainError extends XLinkSDKErrorBase {
  constructor(public chain: ChainId) {
    super(`Unsupported chain: ${chain}`)
    this.name = "UnsupportedChainError"
  }
}
/** It is thrown when a smart contract is assigned an unknown or unsupported chain ID. */
export class UnsupportedContractAssignedChainIdError extends XLinkSDKErrorBase {
  constructor(public chainId: bigint) {
    super(`Unsupported smart contract assigned chain id: ${chainId}`)
    this.name = "UnsupportedContractAssignedChainIdError"
  }
}
