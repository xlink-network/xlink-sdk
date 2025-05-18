import { getTronSupportedRoutes } from "./getTronSupportedRoutes"
import { SDKGlobalContext } from "../sdkUtils/types.internal"
import { KnownChainId, KnownTokenId } from "../utils/types/knownIds"

export async function tronTokenToCorrespondingStacksToken(
  sdkContext: SDKGlobalContext,
  fromChain: KnownChainId.TronChain,
  fromTronToken: KnownTokenId.TronToken,
): Promise<undefined | KnownTokenId.StacksToken> {
  const supportedRoutes = await getTronSupportedRoutes(sdkContext, fromChain)
  return supportedRoutes.find(route => route.tronToken === fromTronToken)?.stacksToken
}

export async function tronTokenFromCorrespondingStacksToken(
  sdkContext: SDKGlobalContext,
  toChain: KnownChainId.TronChain,
  fromStacksToken: KnownTokenId.StacksToken,
): Promise<KnownTokenId.TronToken[]> {
  const supportedRoutes = await getTronSupportedRoutes(sdkContext, toChain)
  return supportedRoutes.reduce(
    (acc, route) =>
      route.stacksToken === fromStacksToken ? [...acc, route.tronToken] : acc,
    [] as KnownTokenId.TronToken[],
  )
} 