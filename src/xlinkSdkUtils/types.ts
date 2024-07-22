import { BigNumber } from "../utils/BigNumber"

type SDKBrandedLiteral<
  Type extends string,
  T extends string | number,
> = `${T} (XLinkSDK ${Type})`

export type ChainId<T extends string = string> = SDKBrandedLiteral<"ChainId", T>
export type TokenId<T extends string = string> = SDKBrandedLiteral<"TokenId", T>

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

export type SDKNumber = SDKBrandedLiteral<"number", string>
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
