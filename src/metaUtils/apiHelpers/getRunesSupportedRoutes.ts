import { getStacksToken } from "../../stacksUtils/xlinkContractHelpers"
import { requestAPI } from "../../utils/apiHelpers"
import { BigNumber } from "../../utils/BigNumber"
import { isNotNull } from "../../utils/typeHelpers"
import {
  createRunesToken,
  KnownChainId,
  KnownTokenId,
} from "../../utils/types/knownIds"
import { RuneIdCombined } from "../../xlinkSdkUtils/types"
import { SDKGlobalContext } from "../../xlinkSdkUtils/types.internal"

export interface RunesSupportedRoute {
  runesId: RuneIdCombined
  runesChain: KnownChainId.RunesChain
  runesToken: KnownTokenId.RunesToken
  stacksChain: KnownChainId.StacksChain
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

  const promise = _getRunesSupportedRoutes(sdkContext, chainId).catch(err => {
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
  sdkContext: SDKGlobalContext,
  runesChain: KnownChainId.RunesChain,
): Promise<RunesSupportedRoute[]> {
  const stacksChain =
    runesChain === KnownChainId.Runes.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet

  const resp = await requestAPI<{ routes: SupportedRunesBridgeRoute[] }>(
    sdkContext,
    {
      method: "GET",
      path: "/2024-10-01/runes/supported-routes",
      query: {
        network:
          runesChain === KnownChainId.Runes.Mainnet ? "mainnet" : "testnet",
      },
    },
  )

  const routes = await Promise.all(
    resp.routes.map(async (route): Promise<null | RunesSupportedRoute> => {
      const stacksToken = await getStacksToken(
        sdkContext,
        stacksChain,
        route.stacksTokenContractAddress,
      )

      if (stacksToken == null) return null

      return {
        runesId: route.runesId,
        runesChain,
        runesToken: createRunesToken(route.runesId),
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
interface SupportedRunesBridgeRoute {
  runesId: RuneIdCombined
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
