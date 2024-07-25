import { ChainId, TokenId } from "../xlinkSdkUtils/types"
import { UnsupportedBridgeRouteError } from "./errors"
import { KnownChainId, KnownTokenId } from "./types/knownIds"

export interface DefinedRoute {
  fromChain: ChainId
  toChain: ChainId
  fromToken: TokenId
  toToken: TokenId
}

export type KnownRoute =
  // from Stacks
  | {
      fromChain: KnownChainId.StacksChain
      toChain: KnownChainId.BitcoinChain
      fromToken: KnownTokenId.StacksToken
      toToken: KnownTokenId.BitcoinToken
    }
  | {
      fromChain: KnownChainId.StacksChain
      toChain: KnownChainId.EVMChain
      fromToken: KnownTokenId.StacksToken
      toToken: KnownTokenId.EVMToken
    }
  // from Bitcoin
  | {
      fromChain: KnownChainId.BitcoinChain
      toChain: KnownChainId.StacksChain
      fromToken: KnownTokenId.BitcoinToken
      toToken: KnownTokenId.StacksToken
    }
  | {
      fromChain: KnownChainId.BitcoinChain
      toChain: KnownChainId.EVMChain
      fromToken: KnownTokenId.BitcoinToken
      toToken: KnownTokenId.EVMToken
    }
  // from EVM
  | {
      fromChain: KnownChainId.EVMChain
      toChain: KnownChainId.BitcoinChain
      fromToken: KnownTokenId.EVMToken
      toToken: KnownTokenId.BitcoinToken
    }
  | {
      fromChain: KnownChainId.EVMChain
      toChain: KnownChainId.StacksChain
      fromToken: KnownTokenId.EVMToken
      toToken: KnownTokenId.StacksToken
    }
  | {
      fromChain: KnownChainId.EVMChain
      toChain: KnownChainId.EVMChain
      fromToken: KnownTokenId.EVMToken
      toToken: KnownTokenId.EVMToken
    }

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

export type IsSupportedFn = (route: DefinedRoute) => Promise<boolean>
const memoizedIsSupportedFactory = (
  isSupported: IsSupportedFn,
): IsSupportedFn => {
  const cache = new Map<string, Promise<boolean>>()

  return async route => {
    const key = `${route.fromChain}-${route.toChain}-${route.fromToken}-${route.toToken}`

    const cachedPromise = cache.get(key)
    if (cachedPromise != null) return cachedPromise

    const promise = isSupported(route).catch(err => {
      const cachedPromise = cache.get(key)

      if (cachedPromise === promise) {
        cache.delete(key)
      }

      throw err
    })
    cache.set(key, promise)
    return promise
  }
}

export type GetSupportedRoutesFn = (conditions?: {
  fromChain?: ChainId
  toChain?: ChainId
  fromToken?: TokenId
  toToken?: TokenId
}) => Promise<KnownRoute[]>

export function buildSupportedRoutes(
  routes: DefinedRoute[],
  options: {
    isSupported?: IsSupportedFn
  } = {},
): {
  getSupportedRoutes: GetSupportedRoutesFn
  checkRouteValid(route: DefinedRoute): Promise<KnownRoute>
} {
  const isSupported = memoizedIsSupportedFactory(
    options.isSupported || (() => Promise.resolve(true)),
  )

  const getSupportedRoutes: GetSupportedRoutesFn = async (conditions = {}) => {
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
        async route => [await isSupported(route), route] as const,
      ),
    )
    return res
      .filter(([isSupported]) => isSupported)
      .map(([, route]) => route as KnownRoute)
  }

  return {
    getSupportedRoutes,
    async checkRouteValid(route): Promise<KnownRoute> {
      const isValid = await isSupported(route)

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
