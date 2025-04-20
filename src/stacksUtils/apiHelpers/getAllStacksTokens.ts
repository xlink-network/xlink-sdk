import { requestAPI } from "../../utils/apiHelpers"
import {
  KnownChainId,
  createStacksToken,
  KnownTokenId,
} from "../../utils/types/knownIds"
import { StacksContractAddress } from "../../sdkUtils/types"
import { SDKGlobalContext } from "../../sdkUtils/types.internal"

export interface StacksTokenInfo {
  stacksTokenId: KnownTokenId.StacksToken
  contractAddress: StacksContractAddress
  decimals: number
  underlyingToken?: {
    contractAddress: StacksContractAddress
    decimals: number
  }
}

export const getAllStacksTokens = (
  ctx: SDKGlobalContext,
  chain: KnownChainId.StacksChain,
): Promise<StacksTokenInfo[]> => {
  const cache = ctx.stacks.tokensCache

  if (cache == null) {
    return getAllStacksTokensImpl(ctx, chain)
  }

  const cached = cache.get(chain)
  if (cached == null) {
    const promise = getAllStacksTokensImpl(ctx, chain).catch(e => {
      if (cache.get(chain) === promise) {
        cache.delete(chain)
      }
      throw e
    })
    cache.set(chain, promise)
  }
  return cache.get(chain)!
}

const getAllStacksTokensImpl = async (
  ctx: SDKGlobalContext,
  chain: KnownChainId.StacksChain,
): Promise<StacksTokenInfo[]> => {
  const res = await requestAPI<{ tokens: StacksTokenFromAPI[] }>(ctx, {
    method: "GET",
    path: "/2024-10-01/stacks/tokens",
    query: {
      network: chain === KnownChainId.Stacks.Mainnet ? "mainnet" : "testnet",
    },
  })
  return res.tokens.map(info => ({
    stacksTokenId: createStacksToken(info.id),
    contractAddress: info.contractAddress,
    decimals: info.decimals,
    underlyingToken: info.underlyingToken,
  }))
}
interface StacksTokenFromAPI {
  id: string
  contractAddress: StacksContractAddress
  decimals: number
  underlyingToken?: {
    contractAddress: StacksContractAddress
    decimals: number
  }
}
