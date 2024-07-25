import { EVMEndpointContract } from "../evmUtils/evmContractAddresses"
import { BigNumber } from "../utils/BigNumber"

type SDKBrandedLiteral<
  Type extends string,
  T extends string | number,
> = `${T} (XLinkSDK ${Type})`

export type ChainId<T extends string = string> = SDKBrandedLiteral<"ChainId", T>
export type TokenId<T extends string = string> = SDKBrandedLiteral<"TokenId", T>

export type SDKNumber = SDKBrandedLiteral<"number", string>
export type SDKNumberifyNestly<T> =
  {
  // prettier-ignore
  [K in keyof T]:
    number extends T[K] ? SDKNumber | Exclude<T[K], number> :
    BigNumber extends T[K] ? SDKNumber | Exclude<T[K], BigNumber> :
    undefined extends T[K] ? undefined | SDKNumberifyNestly<Exclude<T[K], undefined>> :
    null extends T[K] ? null | SDKNumberifyNestly<Exclude<T[K], null>> :
    T[K] extends object ? SDKNumberifyNestly<T[K]> :
    T[K]
}
export function toSDKNumberOrUndefined<
  T extends null | undefined | SDKNumber | number | BigNumber,
>(n: T): Exclude<T, number | BigNumber> | SDKNumber {
  if (n == null) return undefined as any
  return BigNumber.toString(n) as SDKNumber
}

export type EVMAddress = `0x${string}`

export interface StacksContractAddress {
  deployerAddress: string
  contractName: string
}

export type PublicEVMContractType = typeof PublicEVMContractType.BridgeEndpoint
export namespace PublicEVMContractType {
  export const BridgeEndpoint = EVMEndpointContract.BridgeEndpoint
}
