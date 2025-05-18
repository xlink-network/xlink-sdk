import { getStacksToken } from "../../stacksUtils/contractHelpers"
import { requestAPI } from "../../utils/apiHelpers"
import { BigNumber } from "../../utils/BigNumber"
import { isNotNull } from "../../utils/typeHelpers"
import { KnownChainId, KnownTokenId } from "../../utils/types/knownIds"
import { StacksContractAddress } from "../../sdkUtils/types"
import { SDKGlobalContext } from "../../sdkUtils/types.internal"

export interface SolanaSupportedRoute {
  evmToken: KnownTokenId.EVMToken
  stacksChain: KnownChainId.StacksChain
  stacksToken: KnownTokenId.StacksToken
  proxyStacksTokenContractAddress: null | StacksContractAddress
  pegOutFeeRate: BigNumber
  pegOutMinFeeAmount: null | BigNumber
  pegOutMinAmount: null | BigNumber
  pegOutMaxAmount: null | BigNumber
}

type NetworkType = "mainnet" | "testnet"

export async function getSolanaSupportedRoutes(
  sdkContext: SDKGlobalContext,
): Promise<SolanaSupportedRoute[]> {
  return getSolanaSupportedRoutesByNetwork(sdkContext, "mainnet" as NetworkType)
}

async function getSolanaSupportedRoutesByNetwork(
  sdkContext: SDKGlobalContext,
  network: NetworkType,
): Promise<SolanaSupportedRoute[]> {
  const cacheKey = `solana-${network}`
  if (
    sdkContext.evm.routesConfigCache != null &&
    sdkContext.evm.routesConfigCache.get(cacheKey) != null
  ) {
    return sdkContext.evm.routesConfigCache.get(cacheKey)!
  }

  const promise = _getSolanaSupportedRoutes(sdkContext, network).catch(err => {
    const cachedPromise = sdkContext.evm.routesConfigCache?.get(cacheKey)
    if (promise === cachedPromise) {
      sdkContext.evm.routesConfigCache?.delete(cacheKey)
    }
    throw err
  })
  sdkContext.evm.routesConfigCache?.set(cacheKey, promise)
  return promise
}

async function _getSolanaSupportedRoutes(
  sdkContext: SDKGlobalContext,
  network: NetworkType,
): Promise<SolanaSupportedRoute[]> {
  const stacksChain =
    network === "mainnet"
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet

  const resp = await requestAPI<{ routes: SupportedSolanaBridgeRoute[] }>(
    sdkContext,
    {
      method: "GET",
      path: "/2024-10-01/solana/supported-routes",
      query: {
        network,
      },
    },
  )

  const routes = await Promise.all(
    resp.routes.map(async (route): Promise<null | SolanaSupportedRoute> => {
      const evmToken = route.evmToken as KnownTokenId.KnownToken
      const stacksToken = await getStacksToken(
        sdkContext,
        stacksChain,
        route.stacksTokenContractAddress,
      )

      if (stacksToken == null) return null
      if (!KnownTokenId.isEVMToken(evmToken)) return null

      return {
        evmToken,
        stacksChain,
        stacksToken,
        proxyStacksTokenContractAddress: route.proxyStacksTokenContractAddress,
        pegOutFeeRate: BigNumber.from(route.pegOutFeeRate),
        pegOutMinFeeAmount:
          route.pegOutMinFeeAmount == null
            ? null
            : BigNumber.from(route.pegOutMinFeeAmount),
        pegOutMinAmount:
          route.pegOutMinAmount == null
            ? null
            : BigNumber.from(route.pegOutMinAmount),
        pegOutMaxAmount:
          route.pegOutMaxAmount == null
            ? null
            : BigNumber.from(route.pegOutMaxAmount),
      }
    }),
  )

  return routes.filter(isNotNull)
}

interface SupportedSolanaBridgeRoute {
  evmToken: string
  stacksTokenContractAddress: StacksContractAddress
  proxyStacksTokenContractAddress: null | StacksContractAddress
  pegOutFeeRate: `${number}`
  pegOutMinFeeAmount: null | `${number}`
  pegOutMinAmount: null | `${number}`
  pegOutMaxAmount: null | `${number}`
} 