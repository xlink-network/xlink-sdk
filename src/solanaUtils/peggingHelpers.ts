import { getSolanaSupportedRoutes } from "./getSolanaSupportedRoutes"
import { SDKGlobalContext } from "../sdkUtils/types.internal"
import { KnownChainId, KnownTokenId } from "../utils/types/knownIds"

export async function solanaTokenToCorrespondingStacksToken(
  sdkContext: SDKGlobalContext,
  fromChain: KnownChainId.SolanaChain,
  fromSolanaToken: KnownTokenId.SolanaToken,
): Promise<undefined | KnownTokenId.StacksToken> {
  const supportedRoutes = await getSolanaSupportedRoutes(sdkContext, fromChain)
  return supportedRoutes.find(route => route.solanaToken === fromSolanaToken)?.stacksToken
}

export async function solanaTokenFromCorrespondingStacksToken(
  sdkContext: SDKGlobalContext,
  toChain: KnownChainId.SolanaChain,
  fromStacksToken: KnownTokenId.StacksToken,
): Promise<KnownTokenId.SolanaToken[]> {
  const supportedRoutes = await getSolanaSupportedRoutes(sdkContext, toChain)
  return supportedRoutes.reduce(
    (acc, route) =>
      route.stacksToken === fromStacksToken ? [...acc, route.solanaToken] : acc,
    [] as KnownTokenId.SolanaToken[],
  )
} 