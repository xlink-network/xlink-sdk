import { ChainId, TokenId } from "../xlinkSdkUtils/types"
import { SDKGlobalContext } from "../xlinkSdkUtils/types.internal"
import { UnsupportedBridgeRouteError } from "./errors"
import { pMemoize } from "./pMemoize"
import { KnownChainId, KnownTokenId } from "./types/knownIds"

export interface DefinedRoute {
  fromChain: ChainId
  toChain: ChainId
  fromToken: TokenId
  toToken: TokenId
}

export type KnownRoute_FromStacks_ToBitcoin = {
  fromChain: KnownChainId.StacksChain
  fromToken: KnownTokenId.StacksToken
  toChain: KnownChainId.BitcoinChain
  toToken: KnownTokenId.BitcoinToken
}
export type KnownRoute_FromStacks_ToEVM = {
  fromChain: KnownChainId.StacksChain
  fromToken: KnownTokenId.StacksToken
  toChain: KnownChainId.EVMChain
  toToken: KnownTokenId.EVMToken
}
export type KnownRoute_FromStacks_ToBRC20 = {
  fromChain: KnownChainId.StacksChain
  fromToken: KnownTokenId.StacksToken
  toChain: KnownChainId.BRC20Chain
  toToken: KnownTokenId.BRC20Token
}
export type KnownRoute_FromStacks_ToRunes = {
  fromChain: KnownChainId.StacksChain
  fromToken: KnownTokenId.StacksToken
  toChain: KnownChainId.RunesChain
  toToken: KnownTokenId.RunesToken
}
export type KnownRoute_FromStacks =
  | KnownRoute_FromStacks_ToBitcoin
  | KnownRoute_FromStacks_ToEVM
  | KnownRoute_FromStacks_ToBRC20
  | KnownRoute_FromStacks_ToRunes

export type KnownRoute_FromBitcoin_ToStacks = {
  fromChain: KnownChainId.BitcoinChain
  fromToken: KnownTokenId.BitcoinToken
  toChain: KnownChainId.StacksChain
  toToken: KnownTokenId.StacksToken
}
export type KnownRoute_FromBitcoin_ToEVM = {
  fromChain: KnownChainId.BitcoinChain
  fromToken: KnownTokenId.BitcoinToken
  toChain: KnownChainId.EVMChain
  toToken: KnownTokenId.EVMToken
}
// export type KnownRoute_FromBitcoin_ToBRC20 = {
//   fromChain: KnownChainId.BitcoinChain
//   fromToken: KnownTokenId.BitcoinToken
//   toChain: KnownChainId.BRC20Chain
//   toToken: KnownTokenId.BRC20Token
// }
// export type KnownRoute_FromBitcoin_ToRunes = {
//   fromChain: KnownChainId.BitcoinChain
//   fromToken: KnownTokenId.BitcoinToken
//   toChain: KnownChainId.RunesChain
//   toToken: KnownTokenId.RunesToken
// }
export type KnownRoute_FromBitcoin =
  | KnownRoute_FromBitcoin_ToStacks
  | KnownRoute_FromBitcoin_ToEVM
// | KnownRoute_FromBitcoin_ToBRC20
// | KnownRoute_FromBitcoin_ToRunes

export type KnownRoute_FromEVM_ToStacks = {
  fromChain: KnownChainId.EVMChain
  fromToken: KnownTokenId.EVMToken
  toChain: KnownChainId.StacksChain
  toToken: KnownTokenId.StacksToken
}
export type KnownRoute_FromEVM_ToBitcoin = {
  fromChain: KnownChainId.EVMChain
  fromToken: KnownTokenId.EVMToken
  toChain: KnownChainId.BitcoinChain
  toToken: KnownTokenId.BitcoinToken
}
export type KnownRoute_FromEVM_ToBRC20 = {
  fromChain: KnownChainId.EVMChain
  fromToken: KnownTokenId.EVMToken
  toChain: KnownChainId.BRC20Chain
  toToken: KnownTokenId.BRC20Token
}
export type KnownRoute_FromEVM_ToRunes = {
  fromChain: KnownChainId.EVMChain
  fromToken: KnownTokenId.EVMToken
  toChain: KnownChainId.RunesChain
  toToken: KnownTokenId.RunesToken
}
export type KnownRoute_FromEVM_ToEVM = {
  fromChain: KnownChainId.EVMChain
  fromToken: KnownTokenId.EVMToken
  toChain: KnownChainId.EVMChain
  toToken: KnownTokenId.EVMToken
}
export type KnownRoute_FromEVM =
  | KnownRoute_FromEVM_ToStacks
  | KnownRoute_FromEVM_ToBitcoin
  | KnownRoute_FromEVM_ToBRC20
  | KnownRoute_FromEVM_ToRunes
  | KnownRoute_FromEVM_ToEVM

export type _KnownRoute_FromBRC20_ToStacks = {
  fromChain: KnownChainId.BRC20Chain
  fromToken: KnownTokenId.BRC20Token
  toChain: KnownChainId.StacksChain
  toToken: KnownTokenId.StacksToken
}
export type _KnownRoute_FromRunes_ToStacks = {
  fromChain: KnownChainId.RunesChain
  fromToken: KnownTokenId.RunesToken
  toChain: KnownChainId.StacksChain
  toToken: KnownTokenId.StacksToken
}

export type KnownRoute =
  | KnownRoute_FromStacks
  | KnownRoute_FromBitcoin
  | KnownRoute_FromEVM

export function defineRoute(
  chainPairs: [fromChains: ChainId[], toChains: ChainId[]],
  tokenPairs: [fromToken: TokenId, toToken: TokenId][],
): DefinedRoute[] {
  const result: DefinedRoute[] = []

  for (const fromChain of chainPairs[0]) {
    for (const toChain of chainPairs[1]) {
      tokenPairs.forEach(tokenPair => {
        result.push({
          fromChain,
          toChain,
          fromToken: tokenPair[0],
          toToken: tokenPair[1],
        })
      })
    }
  }

  return result
}

export type IsSupportedFn = (
  ctx: SDKGlobalContext,
  route: DefinedRoute,
) => Promise<boolean>
const memoizedIsSupportedFactory = (
  isSupported: IsSupportedFn,
): IsSupportedFn => {
  return pMemoize(
    {
      cacheKey([, route]) {
        return `${route.fromChain}:${route.fromToken}->${route.toChain}:${route.toToken}`
      },
      skipCache: true,
    },
    isSupported,
  )
}

export interface GetSupportedRoutesFn_Conditions {
  fromChain?: ChainId
  toChain?: ChainId
  fromToken?: TokenId
  toToken?: TokenId
}
export type GetSupportedRoutesFn = (
  ctx: SDKGlobalContext,
  conditions?: GetSupportedRoutesFn_Conditions,
) => Promise<KnownRoute[]>

export type CheckRouteValidFn = (
  ctx: SDKGlobalContext,
  route: DefinedRoute,
) => Promise<KnownRoute>

export function buildSupportedRoutes(
  routes: DefinedRoute[],
  options: {
    isSupported?: IsSupportedFn
  } = {},
): {
  getSupportedRoutes: GetSupportedRoutesFn
  checkRouteValid: CheckRouteValidFn
} {
  const isSupported = memoizedIsSupportedFactory(
    options.isSupported || (() => Promise.resolve(true)),
  )

  const getSupportedRoutes: GetSupportedRoutesFn = async (
    ctx,
    conditions = {},
  ) => {
    const filteredDefinitions = routes.filter(r => {
      if (
        conditions.fromChain != null &&
        conditions.fromChain !== r.fromChain
      ) {
        return false
      }
      if (conditions.toChain != null && conditions.toChain !== r.toChain) {
        return false
      }
      if (
        conditions.fromToken != null &&
        conditions.fromToken !== r.fromToken
      ) {
        return false
      }
      if (conditions.toToken != null && conditions.toToken !== r.toToken) {
        return false
      }

      return true
    })

    const res = await Promise.all(
      filteredDefinitions.map(
        async route => [await isSupported(ctx, route), route] as const,
      ),
    )
    return res
      .filter(([isSupported]) => isSupported)
      .map(([, route]) => route as KnownRoute)
  }

  return {
    getSupportedRoutes,
    async checkRouteValid(ctx, route) {
      const isValid = await isSupported(ctx, route)

      if (!isValid) {
        throw new UnsupportedBridgeRouteError(
          route.fromChain,
          route.toChain,
          route.fromToken,
          route.toToken,
        )
      }

      return route as any
    },
  }
}
