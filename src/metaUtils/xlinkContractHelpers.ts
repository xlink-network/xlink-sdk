import { getStacksToken } from "../stacksUtils/xlinkContractHelpers"
import { requestAPI } from "../utils/apiHelpers"
import { BigNumber } from "../utils/BigNumber"
import { isNotNull } from "../utils/typeHelpers"
import {
  createBRC20Token,
  createRunesToken,
  KnownChainId,
  KnownTokenId,
} from "../utils/types/knownIds"
import { SDKGlobalContext } from "../xlinkSdkUtils/types.internal"

export interface BRC20SupportedRoute {
  brc20Tick: string
  brc20Token: KnownTokenId.BRC20Token
  stacksToken: KnownTokenId.StacksToken
  pegInPaused: boolean
  pegInFeeRate: BigNumber
  pegInFeeBitcoinAmount: null | BigNumber
  pegOutPaused: boolean
  pegOutFeeRate: BigNumber
  pegOutFeeBitcoinAmount: null | BigNumber
}
export async function getBRC20SupportedRoutes(
  sdkContext: SDKGlobalContext,
  chainId: KnownChainId.BRC20Chain,
): Promise<BRC20SupportedRoute[]> {
  if (
    sdkContext.brc20.routesConfigCache != null &&
    sdkContext.brc20.routesConfigCache.get(chainId) != null
  ) {
    return sdkContext.brc20.routesConfigCache.get(chainId)!
  }

  const promise = _getBRC20SupportedRoutes(chainId).catch(err => {
    const cachedPromise = sdkContext.brc20.routesConfigCache?.get(chainId)
    if (promise === cachedPromise) {
      sdkContext.brc20.routesConfigCache?.delete(chainId)
    }
    throw err
  })
  sdkContext.brc20.routesConfigCache?.set(chainId, promise)
  return promise
}
async function _getBRC20SupportedRoutes(
  chainId: KnownChainId.BRC20Chain,
): Promise<BRC20SupportedRoute[]> {
  const stacksChainId =
    chainId === KnownChainId.BRC20.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet

  const resp = await requestAPI<{ routes: SupportedBRC20BridgeRoute[] }>({
    method: "GET",
    path: "/2024-10-01/brc20/supported-routes",
    query: {
      network: chainId === KnownChainId.BRC20.Mainnet ? "mainnet" : "testnet",
    },
  })

  const routes = await Promise.all(
    resp.routes.map(async (route): Promise<null | BRC20SupportedRoute> => {
      const stacksToken = await getStacksToken(
        stacksChainId,
        route.stacksTokenContractAddress,
      )

      if (stacksToken == null) return null

      return {
        brc20Tick: route.brc20Tick,
        brc20Token: createBRC20Token(route.brc20Tick),
        stacksToken,
        pegInPaused: route.pegInPaused,
        pegInFeeRate: BigNumber.from(route.pegInFeeRate),
        pegInFeeBitcoinAmount:
          route.pegInFeeBitcoinAmount == null
            ? null
            : BigNumber.from(route.pegInFeeBitcoinAmount),
        pegOutPaused: route.pegOutPaused,
        pegOutFeeRate: BigNumber.from(route.pegOutFeeRate),
        pegOutFeeBitcoinAmount:
          route.pegOutFeeBitcoinAmount == null
            ? null
            : BigNumber.from(route.pegOutFeeBitcoinAmount),
      }
    }),
  )

  return routes.filter(isNotNull)
}
interface SupportedBRC20BridgeRoute {
  brc20Tick: string
  stacksTokenContractAddress: {
    deployerAddress: string
    contractName: string
  }
  pegInPaused: boolean
  pegInFeeRate: `${number}`
  pegInFeeBitcoinAmount: null | `${number}`
  pegOutPaused: boolean
  pegOutFeeRate: `${number}`
  pegOutFeeBitcoinAmount: null | `${number}`
}

export interface RunesSupportedRoute {
  runesId: `${number}:${number}`
  runesToken: KnownTokenId.RunesToken
  stacksToken: KnownTokenId.StacksToken
  pegInPaused: boolean
  pegInFeeRate: BigNumber
  pegInFeeBitcoinAmount: null | BigNumber
  pegOutPaused: boolean
  pegOutFeeRate: BigNumber
  pegOutFeeBitcoinAmount: null | BigNumber
}

export async function getRunesSupportedRoutes(
  sdkContext: SDKGlobalContext,
  chainId: KnownChainId.RunesChain,
): Promise<RunesSupportedRoute[]> {
  if (
    sdkContext.runes.routesConfigCache != null &&
    sdkContext.runes.routesConfigCache.get(chainId) != null
  ) {
    return sdkContext.runes.routesConfigCache.get(chainId)!
  }

  const promise = _getRunesSupportedRoutes(chainId).catch(err => {
    const cachedPromise = sdkContext.runes.routesConfigCache?.get(chainId)
    if (promise === cachedPromise) {
      sdkContext.runes.routesConfigCache?.delete(chainId)
    }
    throw err
  })
  sdkContext.runes.routesConfigCache?.set(chainId, promise)
  return promise
}
async function _getRunesSupportedRoutes(
  chainId: KnownChainId.RunesChain,
): Promise<RunesSupportedRoute[]> {
  const stacksChainId =
    chainId === KnownChainId.Runes.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet

  const resp = await requestAPI<{ routes: SupportedRunesBridgeRoute[] }>({
    method: "GET",
    path: "/2024-10-01/runes/supported-routes",
    query: {
      network: chainId === KnownChainId.Runes.Mainnet ? "mainnet" : "testnet",
    },
  })

  const routes = await Promise.all(
    resp.routes.map(async (route): Promise<null | RunesSupportedRoute> => {
      const stacksToken = await getStacksToken(
        stacksChainId,
        route.stacksTokenContractAddress,
      )

      if (stacksToken == null) return null

      return {
        runesId: route.runesId,
        runesToken: createRunesToken(route.runesId),
        stacksToken,
        pegInPaused: route.pegInPaused,
        pegInFeeRate: BigNumber.from(route.pegInFeeRate),
        pegInFeeBitcoinAmount:
          route.pegInFeeBitcoinAmount == null
            ? null
            : BigNumber.from(route.pegInFeeBitcoinAmount),
        pegOutPaused: route.pegOutPaused,
        pegOutFeeRate: BigNumber.from(route.pegOutFeeRate),
        pegOutFeeBitcoinAmount:
          route.pegOutFeeBitcoinAmount == null
            ? null
            : BigNumber.from(route.pegOutFeeBitcoinAmount),
      }
    }),
  )

  return routes.filter(isNotNull)
}
interface SupportedRunesBridgeRoute {
  runesId: `${number}:${number}`
  stacksTokenContractAddress: {
    deployerAddress: string
    contractName: string
  }
  pegInPaused: boolean
  pegInFeeRate: `${number}`
  pegInFeeBitcoinAmount: null | `${number}`
  pegOutPaused: boolean
  pegOutFeeRate: `${number}`
  pegOutFeeBitcoinAmount: null | `${number}`
}
