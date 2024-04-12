export type TokenId = string & { __brand: "XLINK SDK Token Id" }

export type ChainId = string & { __brand: "XLINK SDK Chain Id" }

export interface SupportedToken {
  fromChain: ChainId
  fromToken: TokenId
  toChain: ChainId
  toToken: TokenId
}

export type TokenAmount = string & { __brand: "XLINK SDK Token Amount" }
