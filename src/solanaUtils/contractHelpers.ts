import { Connection, PublicKey } from "@solana/web3.js"
import { SDKGlobalContext } from "../sdkUtils/types.internal"
import { KnownChainId } from "../utils/types/knownIds"
import { getSolanaSupportedRoutes } from "./getSolanaSupportedRoutes"
import { SolanaSupportedRoute } from "./types"

export async function getSolanaTokenContractInfo(
  sdkContext: SDKGlobalContext,
  chainId: KnownChainId.SolanaChain,
  tokenId: string
) {
  const client = sdkContext.solana.connection
  if (!client) {
    throw new Error("Solana client not available")
  }

  const supportedRoutes = await getSolanaSupportedRoutes(sdkContext, chainId)
  const route = supportedRoutes.find((r: SolanaSupportedRoute) => r.solanaToken === tokenId)

  if (!route) {
    throw new Error(`Token ${tokenId} not supported on Solana`)
  }

  return {
    client,
    tokenContractAddress: route.solanaTokenAddress,
  }
}