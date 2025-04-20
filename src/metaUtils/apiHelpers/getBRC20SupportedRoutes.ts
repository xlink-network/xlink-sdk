import { getStacksToken } from "../../stacksUtils/contractHelpers"
import { requestAPI } from "../../utils/apiHelpers"
import { BigNumber } from "../../utils/BigNumber"
import { isNotNull } from "../../utils/typeHelpers"
import {
  KnownTokenId,
  KnownChainId,
  createBRC20Token,
} from "../../utils/types/knownIds"
import { SDKGlobalContext } from "../../sdkUtils/types.internal"

export interface BRC20SupportedRoute {
  brc20Tick: string
  brc20Chain: KnownChainId.BRC20Chain
  brc20Token: KnownTokenId.BRC20Token
  stacksChain: KnownChainId.StacksChain
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

  const promise = _getBRC20SupportedRoutes(sdkContext, chainId).catch(err => {
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
  sdkContext: SDKGlobalContext,
  brc20Chain: KnownChainId.BRC20Chain,
): Promise<BRC20SupportedRoute[]> {
  const stacksChain =
    brc20Chain === KnownChainId.BRC20.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet

  const resp = await requestAPI<{ routes: SupportedBRC20BridgeRoute[] }>(
    sdkContext,
    {
      method: "GET",
      path: "/2024-10-01/brc20/supported-routes",
      query: {
        network:
          brc20Chain === KnownChainId.BRC20.Mainnet ? "mainnet" : "testnet",
      },
    },
  )

  const routes = await Promise.all(
    resp.routes.map(async (route): Promise<null | BRC20SupportedRoute> => {
      const stacksToken = await getStacksToken(
        sdkContext,
        stacksChain,
        route.stacksTokenContractAddress,
      )

      if (stacksToken == null) return null

      return {
        brc20Tick: route.brc20Tick,
        brc20Chain,
        brc20Token: createBRC20Token(route.brc20Tick),
        stacksChain,
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
