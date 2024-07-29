import { ChainId, TokenId } from "../xlinkSdkUtils/types"

export class XLinkSDKErrorBase extends Error {
  constructor(...args: ConstructorParameters<typeof Error>) {
    super(...args)
    this.name = "XLinkSDKErrorBase"
  }
}

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
  constructor(public chain: ChainId) {
    super(`Unsupported chain: ${chain}`)
    this.name = "UnsupportedChainError"
  }
}
export class UnsupportedContractAssignedChainIdError extends XLinkSDKErrorBase {
  constructor(public chainId: bigint) {
    super(`Unsupported smart contract assigned chain id: ${chainId}`)
    this.name = "UnsupportedContractAssignedChainIdError"
  }
}
