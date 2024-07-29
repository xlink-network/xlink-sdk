import { EVMEndpointContract } from "../evmUtils/evmContractAddresses"
import { BigNumber } from "../utils/BigNumber"
import { InvalidMethodParametersError } from "../utils/errors"

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
    bigint extends T[K] ? SDKNumber | Exclude<T[K], bigint> :
    BigNumber extends T[K] ? SDKNumber | Exclude<T[K], BigNumber> :
    undefined extends T[K] ? undefined | SDKNumberifyNestly<Exclude<T[K], undefined>> :
    null extends T[K] ? null | SDKNumberifyNestly<Exclude<T[K], null>> :
    T[K] extends object ? SDKNumberifyNestly<T[K]> :
    T[K]
}
/**
 * https://github.com/MikeMcl/big.js/blob/9c6c959c92dc9044a0f98c31f60322fd91243468/big.js#L74
 */
const NUMERIC = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i
export function toSDKNumberOrUndefined<
  T extends null | undefined | SDKNumber | number | bigint | BigNumber,
>(n: T): Exclude<T, number | bigint | BigNumber> | SDKNumber {
  if (n == null) return undefined as any

  const str = BigNumber.toString(n)
  if (!NUMERIC.test(str)) {
    throw new InvalidMethodParametersError(
      ["toSDKNumberOrUndefined"],
      [
        {
          name: "n",
          expected:
            "a number, bigint, or a string that can be converted to a number",
          received: str,
        },
      ],
    )
  }

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
