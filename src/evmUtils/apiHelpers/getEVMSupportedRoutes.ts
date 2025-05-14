import {
  EVMAddress,
  StacksContractAddress,
  TokenId,
} from "../../sdkUtils/types"
import { SDKGlobalContext } from "../../sdkUtils/types.internal"
import { getStacksToken } from "../../stacksUtils/contractHelpers"
import { requestAPI } from "../../utils/apiHelpers"
import { BigNumber } from "../../utils/BigNumber"
import { isNotNull } from "../../utils/typeHelpers"
import { createEVMToken, KnownChainId, KnownTokenId } from "../../utils/types/knownIds"
import { evmChainIdToKnownChainId } from "../evmClients"

export interface EVMSupportedRoute {
  evmChain: KnownChainId.EVMChain
  evmToken: KnownTokenId.EVMToken
  evmTokenAddress: EVMAddress
  stacksChain: KnownChainId.StacksChain
  stacksToken: KnownTokenId.StacksToken
  proxyStacksTokenContractAddress: null | StacksContractAddress
  pegOutFeeRate: BigNumber
  pegOutMinFeeAmount: null | BigNumber
  pegOutMinAmount: null | BigNumber
  pegOutMaxAmount: null | BigNumber
}
export async function getEVMSupportedRoutes(
  sdkContext: SDKGlobalContext,
  chainId: KnownChainId.EVMChain,
): Promise<EVMSupportedRoute[]> {
  const routes = await getEVMSupportedRoutesByChainType(
    sdkContext,
    KnownChainId.isEVMMainnetChain(chainId) ? "mainnet" : "testnet",
  )

  return routes.filter(r => r.evmChain === chainId)
}
export async function getEVMSupportedRoutesByChainType(
  sdkContext: SDKGlobalContext,
  network: "mainnet" | "testnet",
): Promise<EVMSupportedRoute[]> {
  if (
    sdkContext.evm.routesConfigCache != null &&
    sdkContext.evm.routesConfigCache.get(network) != null
  ) {
    return sdkContext.evm.routesConfigCache.get(network)!
  }

  const promise = _getEVMSupportedRoutes(sdkContext, network).catch(err => {
    const cachedPromise = sdkContext.evm.routesConfigCache?.get(network)
    if (promise === cachedPromise) {
      sdkContext.evm.routesConfigCache?.delete(network)
    }
    throw err
  })
  sdkContext.evm.routesConfigCache?.set(network, promise)
  return promise
}
async function _getEVMSupportedRoutes(
  sdkContext: SDKGlobalContext,
  network: "mainnet" | "testnet",
): Promise<EVMSupportedRoute[]> {
  const stacksChain =
    network === "mainnet"
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet

  const resp = await requestAPI<{ routes: SupportedEVMBridgeRoute[] }>(
    sdkContext,
    {
      method: "GET",
      path: "/2024-10-01/evm/supported-routes",
      query: {
        network,
      },
    },
  )

  const routes = await Promise.all(
    resp.routes.map(async (route): Promise<null | EVMSupportedRoute> => {
      const evmChain = evmChainIdToKnownChainId(BigInt(route.evmChainId))
      const stacksToken = await getStacksToken(
        sdkContext,
        stacksChain,
        route.stacksTokenContractAddress,
      )

      if (stacksToken == null) return null
      if (route.evmToken != null && !KnownTokenId.isEVMToken(route.evmToken)) {
        return null
      }
      if (evmChain == null || !KnownChainId.isEVMChain(evmChain)) return null

      return {
        evmChain,
        evmToken: route.evmToken ?? createEVMToken(evmChain, route.evmTokenAddress),
        evmTokenAddress: route.evmTokenAddress,
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
interface SupportedEVMBridgeRoute {
  evmChainId: `${number}`
  evmToken?: TokenId
  evmTokenAddress: EVMAddress
  stacksTokenContractAddress: StacksContractAddress
  proxyStacksTokenContractAddress: null | StacksContractAddress
  pegOutFeeRate: `${number}`
  pegOutMinFeeAmount: null | `${number}`
  pegOutMinAmount: null | `${number}`
  pegOutMaxAmount: null | `${number}`
}
