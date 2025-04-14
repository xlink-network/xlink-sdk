import { KnownChainId, KnownTokenId } from "../utils/types/knownIds"
import { SDKGlobalContext } from "../xlinkSdkUtils/types.internal"
import { getRunesSupportedRoutes } from "./apiHelpers/getRunesSupportedRoutes"
import { getBRC20SupportedRoutes } from "./apiHelpers/getBRC20SupportedRoutes"

export const brc20TokenFromTick = async (
  sdkContext: SDKGlobalContext,
  chain: KnownChainId.BRC20Chain,
  tick: string,
): Promise<undefined | { token: KnownTokenId.BRC20Token }> => {
  const routes = await getBRC20SupportedRoutes(sdkContext, chain)

  const token = routes.find(
    route => route.brc20Tick.toLowerCase() === tick.toLowerCase(),
  )?.brc20Token

  if (token == null) return undefined
  return { token }
}
export const brc20TokenToTick = async (
  sdkContext: SDKGlobalContext,
  chain: KnownChainId.BRC20Chain,
  token: KnownTokenId.BRC20Token,
): Promise<undefined | { tick: string }> => {
  const routes = await getBRC20SupportedRoutes(sdkContext, chain)
  const route = routes.find(route => route.brc20Token === token)
  if (route == null) return undefined
  return { tick: route.brc20Tick }
}

export const runesTokenFromId = async (
  sdkContext: SDKGlobalContext,
  chain: KnownChainId.RunesChain,
  id: { blockHeight: bigint; txIndex: bigint },
): Promise<undefined | { token: KnownTokenId.RunesToken }> => {
  const routes = await getRunesSupportedRoutes(sdkContext, chain)

  const idString = `${id.blockHeight}:${id.txIndex}`
  const token = routes.find(route => route.runesId === idString)?.runesToken

  if (token == null) return undefined
  return { token }
}
export const runesTokenToId = async (
  sdkContext: SDKGlobalContext,
  chain: KnownChainId.RunesChain,
  token: KnownTokenId.RunesToken,
): Promise<undefined | { id: { blockHeight: bigint; txIndex: bigint } }> => {
  const routes = await getRunesSupportedRoutes(sdkContext, chain)
  const route = routes.find(route => route.runesToken === token)
  if (route == null) return undefined

  const id = route.runesId.split(":") as [`${number}`, `${number}`]
  return {
    id: { blockHeight: BigInt(id[0]), txIndex: BigInt(id[1]) },
  }
}
