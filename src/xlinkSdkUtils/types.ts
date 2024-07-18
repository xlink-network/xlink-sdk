import { BigNumber } from "../utils/BigNumber"

export type TokenId = string & { __brand: "XLink SDK Token Id" }

export type ChainId = string & { __brand: "XLink SDK Chain Id" }

export interface ChainToken {
  chain: ChainId
  token: TokenId
}

export interface SupportedToken {
  fromChain: ChainId
  fromToken: TokenId
  toChain: ChainId
  toToken: TokenId
}

export type SDKNumber = `${number}` & { __brand: "XLink SDK Result Number" }
export function toSDKNumberOrUndefined(n: number | BigNumber): SDKNumber
export function toSDKNumberOrUndefined(
  n: undefined | number | BigNumber,
): undefined | SDKNumber
export function toSDKNumberOrUndefined(
  n: null | number | BigNumber,
): null | SDKNumber
export function toSDKNumberOrUndefined(
  n: null | undefined | number | BigNumber,
): null | undefined | SDKNumber {
  if (n == null) return undefined
  return BigNumber.toString(n) as SDKNumber
}
