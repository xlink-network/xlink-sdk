import { BigNumber } from "../utils/BigNumber"

type SDKBrandedLiteral<
  Type extends string,
  T extends string | number,
> = `${T} (XLinkSDK ${Type})`

export type ChainId<T extends string = string> = SDKBrandedLiteral<"ChainId", T>
export type TokenId<T extends string = string> = SDKBrandedLiteral<"TokenId", T>

export type SDKNumber = SDKBrandedLiteral<"number", string>

export function toSDKNumberOrUndefined<
  T extends null | undefined | number | BigNumber,
>(n: T): Exclude<T, number | BigNumber> | SDKNumber {
  if (n == null) return undefined as any
  return BigNumber.toString(n) as SDKNumber
}

export type EVMAddress = `0x${string}`

export interface StacksContractAddress {
  deployerAddress: string
  contractName: string
}
