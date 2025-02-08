import { requestAPI } from "../../utils/apiHelpers"
import { BigNumber } from "../../utils/BigNumber"
import { isNotNull } from "../../utils/typeHelpers"
import { KnownChainId, KnownTokenId } from "../../utils/types/knownIds"
import { SDKGlobalContext } from "../../xlinkSdkUtils/types.internal"

export interface DexAggregatorRoute {
  provider: "icecreamswap"
  toAmount: BigNumber
}
export async function getDexAggregatorRoutes(
  sdkContext: SDKGlobalContext,
  info: {
    fromChain: KnownChainId.EVMChain
    fromToken: KnownTokenId.EVMToken
    toToken: KnownTokenId.EVMToken
    amount: BigNumber
    slippage: BigNumber
  },
): Promise<DexAggregatorRoute[]> {
  const resp = await requestAPI<{ routes: API_DexAggregatorRoute[] }>(
    sdkContext,
    {
      method: "GET",
      path: "/xlink/evm/dex-aggregator-routes",
      query: {
        fromChain: info.fromChain,
        fromToken: info.fromToken,
        toToken: info.toToken,
        amount: BigNumber.toString(info.amount),
        slippage: BigNumber.toString(info.slippage),
      },
    },
  )

  const routes = await Promise.all(
    resp.routes.map(
      async (route): Promise<null | DexAggregatorRoute> => ({
        ...route,
        toAmount: BigNumber.from(route.toAmount),
      }),
    ),
  )

  return routes.filter(isNotNull)
}
interface API_DexAggregatorRoute {
  provider: "icecreamswap"
  toAmount: `${number}`
}
