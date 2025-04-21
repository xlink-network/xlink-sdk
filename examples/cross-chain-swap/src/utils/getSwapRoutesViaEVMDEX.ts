import {
  KnownRoute,
  SDKNumber,
  SwapRouteViaEVMDexAggregator_WithExchangeRate,
  SwapRouteViaEVMDexAggregator_WithMinimumAmountsOut,
  toSDKNumberOrUndefined,
  BroSDK,
} from "@brotocol-xyz/bro-sdk"
import {
  fetchKyberSwapPossibleRoutesFactory,
  getDexAggregatorRoutes,
  getPossibleEVMDexAggregatorSwapParameters,
} from "@brotocol-xyz/bro-sdk/swapHelpers"

export async function getSwapRoutesViaEVMDEX(
  context: {
    sdk: BroSDK
  },
  swapRequest: KnownRoute & {
    amount: SDKNumber
    slippage: SDKNumber
  },
): Promise<
  | { type: "failed"; reason: "unsupported-route" }
  | {
      type: "success"
      swapRoutes: (SwapRouteViaEVMDexAggregator_WithExchangeRate &
        SwapRouteViaEVMDexAggregator_WithMinimumAmountsOut)[]
    }
> {
  const { sdk } = context

  const possibleSwapParameters =
    await getPossibleEVMDexAggregatorSwapParameters(sdk, swapRequest)
  if (possibleSwapParameters.length === 0) {
    return { type: "failed", reason: "unsupported-route" }
  }

  const routes = await getDexAggregatorRoutes(sdk, {
    routeFetcher: fetchKyberSwapPossibleRoutesFactory({}),
    routes: possibleSwapParameters.map(p => ({
      evmChain: p.evmChain,
      fromToken: p.fromToken,
      toToken: p.toToken,
      amount: p.fromAmount,
      slippage: swapRequest.slippage,
    })),
  })
  if (routes == null) {
    return { type: "failed", reason: "unsupported-route" }
  }

  return {
    type: "success",
    swapRoutes: routes.map(r => ({
      via: "evmDexAggregator",
      evmChain: r.evmChain,
      fromEVMToken: r.fromToken,
      toEVMToken: r.toToken,
      composedExchangeRate: toSDKNumberOrUndefined(
        Number(r.toAmount) / Number(r.fromAmount),
      ),
      minimumAmountsToReceive: toSDKNumberOrUndefined(
        Number(r.toAmount) * (1 - Number(swapRequest.slippage)),
      ),
    })),
  }
}
