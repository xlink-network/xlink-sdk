import {
  KnownChainId,
  KnownRoute,
  SDKNumber,
  SwapRouteViaALEX_WithExchangeRate,
  SwapRouteViaALEX_WithMinimumAmountsOut,
  toSDKNumberOrUndefined,
  XLinkSDK,
} from "@brotocol-xyz/bro-sdk"
import { getALEXSwapParameters } from "@brotocol-xyz/bro-sdk/swapHelpers"
import { AlexSDK } from "alex-sdk"
import { sortBy, uniqBy } from "lodash-es"

export async function getSwapRoutesViaALEX(
  context: {
    alexSDK: AlexSDK
    sdk: XLinkSDK
  },
  swapRequest: KnownRoute & {
    amount: SDKNumber
    slippage: SDKNumber
  },
): Promise<
  | { type: "failed"; reason: "unsupported-route" }
  | {
      type: "success"
      swapRoutes: (SwapRouteViaALEX_WithExchangeRate &
        SwapRouteViaALEX_WithMinimumAmountsOut)[]
    }
> {
  const { alexSDK, sdk } = context

  const swapParameters = await getALEXSwapParameters(sdk, swapRequest)
  if (swapParameters == null) {
    return { type: "failed", reason: "unsupported-route" }
  }

  if (
    // ALEX SDK does not support testnet
    swapParameters.stacksChain === KnownChainId.Stacks.Testnet
  ) {
    return { type: "failed", reason: "unsupported-route" }
  }

  const [fromTokenAddress, toTokenAddress] = await Promise.all([
    sdk.stacksAddressFromStacksToken(
      swapParameters.stacksChain,
      swapParameters.fromToken,
    ),
    sdk.stacksAddressFromStacksToken(
      swapParameters.stacksChain,
      swapParameters.toToken,
    ),
  ])
  if (fromTokenAddress == null || toTokenAddress == null) {
    return { type: "failed", reason: "unsupported-route" }
  }

  const [fromCurrency, toCurrency] = await Promise.all([
    alexSDK.fetchTokenInfo(
      `${fromTokenAddress.deployerAddress}.${fromTokenAddress.contractName}`,
    ),
    alexSDK.fetchTokenInfo(
      `${toTokenAddress.deployerAddress}.${toTokenAddress.contractName}`,
    ),
  ])
  if (fromCurrency == null || toCurrency == null) {
    return { type: "failed", reason: "unsupported-route" }
  }

  const routes = await alexSDK.getAllPossibleRoutesWithDetails(
    fromCurrency.id,
    toCurrency.id,
    toBigInt(Number(swapRequest.amount), fromCurrency.wrapTokenDecimals),
  )
  if (routes.length === 0) {
    return { type: "failed", reason: "unsupported-route" }
  }

  return {
    type: "success",
    swapRoutes: uniqBy(
      sortBy(routes, r => r.toAmount),
      r => r.toAmount,
    )
      .slice(0, 5)
      .map(r => ({
        ...r,
        via: "ALEX",
        minimumAmountsToReceive: toSDKNumberOrUndefined(
          toNumber(r.toAmount, toCurrency.wrapTokenDecimals) *
            (1 - Number(swapRequest.slippage)),
        ),
        composedExchangeRate: toSDKNumberOrUndefined(
          toNumber(r.toAmount, toCurrency.wrapTokenDecimals) /
            toNumber(r.fromAmount, fromCurrency.wrapTokenDecimals),
        ),
      })),
  }
}

function toNumber(value: bigint, moveDecimalPlaces: number): number {
  return Number(value) / 10 ** moveDecimalPlaces
}
function toBigInt(value: number, moveDecimalPlaces: number): bigint {
  return BigInt(Math.floor(value * 10 ** moveDecimalPlaces))
}
