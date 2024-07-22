import { ChainId, TokenId } from "../xlinkSdkUtils/types"
import { UnsupportedBridgeRouteError } from "./errors"

export type SupportedRoute = {
  chainLeft: ChainId
  chainRight: ChainId
  tokenLeft: TokenId
  tokenRight: TokenId
}

export function defineRoute<
  const ChainPairs extends [chainLeft: ChainId, chainRight: ChainId][],
  const TokenPairs extends [tokenLeft: TokenId, tokenRight: TokenId][],
>(
  chainPairs: ChainPairs,
  tokenPairs: TokenPairs,
): {
  [K1 in keyof ChainPairs]: {
    [K2 in keyof TokenPairs]: {
      chainLeft: ChainPairs[K1][0]
      chainRight: ChainPairs[K1][1]
      tokenLeft: TokenPairs[K2][0]
      tokenRight: TokenPairs[K2][1]
    }
  }[number]
}[number][] {
  return chainPairs.flatMap(chainPair =>
    tokenPairs.map(tokenPair => ({
      chainLeft: chainPair[0],
      chainRight: chainPair[1],
      tokenLeft: tokenPair[0],
      tokenRight: tokenPair[1],
    })),
  ) as any
}

type ExtractRouteLtr<
  Routes extends SupportedRoute,
  FromChain extends ChainId,
  ToChain extends ChainId,
> = Routes extends {
  chainLeft: FromChain
  chainRight: ToChain
  tokenLeft: infer _FromToken
  tokenRight: infer _ToToken
}
  ? {
      fromChain: FromChain
      toChain: ToChain
      fromToken: _FromToken
      toToken: _ToToken
    }
  : never
type ExtractRouteRtl<
  Routes extends SupportedRoute,
  FromChain extends ChainId,
  ToChain extends ChainId,
> = Routes extends {
  chainRight: FromChain
  chainLeft: ToChain
  tokenRight: infer _FromToken
  tokenLeft: infer _ToToken
}
  ? {
      fromChain: FromChain
      toChain: ToChain
      fromToken: _FromToken
      toToken: _ToToken
    }
  : never

export type GetSupportedRoutesFnAnyResult = {
  fromChain: ChainId
  toChain: ChainId
  fromToken: TokenId
  toToken: TokenId
}[]
export type GetSupportedTokensFn<Routes extends SupportedRoute> = <
  FromChain extends ChainId,
  ToChain extends ChainId,
>(
  fromChain: FromChain,
  toChain: ToChain,
) => Promise<
  (
    | ExtractRouteLtr<Routes, FromChain, ToChain>
    | ExtractRouteRtl<Routes, FromChain, ToChain>
  )[]
>

export type PickLeftToRightRouteOrThrowFn<Routes extends SupportedRoute> = (
  fromChain: ChainId,
  toChain: ChainId,
  fromToken: TokenId,
  toToken: TokenId,
) => Promise<
  Routes extends any
    ? {
        fromChain: Routes["chainLeft"]
        toChain: Routes["chainRight"]
        fromToken: Routes["tokenLeft"]
        toToken: Routes["tokenRight"]
      }
    : never
>
export type PickRightToLeftRouteOrThrowFn<Routes extends SupportedRoute> = (
  fromChain: ChainId,
  toChain: ChainId,
  fromToken: TokenId,
  toToken: TokenId,
) => Promise<
  Routes extends {
    chainRight: infer FromChain
    chainLeft: infer ToChain
    tokenRight: infer FromToken
    tokenLeft: infer ToToken
  }
    ? {
        fromChain: FromChain
        toChain: ToChain
        fromToken: FromToken
        toToken: ToToken
      }
    : never
>

export interface BuiltSupportedRoutes<SR extends SupportedRoute> {
  supportedRoutes: SR[]
  getSupportedTokens: GetSupportedTokensFn<SR>
  pickLeftToRightRouteOrThrow: PickLeftToRightRouteOrThrowFn<SR>
  pickRightToLeftRouteOrThrow: PickRightToLeftRouteOrThrowFn<SR>
}

export type SupportedRoutesOf<T extends BuiltSupportedRoutes<any>> =
  T["supportedRoutes"][number]

export type IsAvailableFn<SR extends SupportedRoute> = (
  route: SR extends {
    chainLeft: infer ChainLeft
    chainRight: infer ChainRight
    tokenLeft: infer TokenLeft
    tokenRight: infer TokenRight
  }
    ?
        | {
            fromChain: ChainLeft
            toChain: ChainRight
            fromToken: TokenLeft
            toToken: TokenRight
          }
        | {
            fromChain: ChainRight
            toChain: ChainLeft
            fromToken: TokenRight
            toToken: TokenLeft
          }
    : never,
) => Promise<boolean>

export function buildSupportedRoutes<SRs extends SupportedRoute[]>(
  routes: SRs[],
  options: {
    isAvailable?: IsAvailableFn<SRs[number]>
  } = {},
): BuiltSupportedRoutes<SRs[number]> {
  const _routes = routes.flat()

  const isAvailable = options.isAvailable || (() => Promise.resolve(true))

  const getSupportedTokens = getSupportedTokensFactory(_routes, isAvailable)

  const pickLeftToRightRouteOrThrow = pickLeftToRightRouteOrThrowFactory(
    _routes,
    isAvailable,
  )

  const pickRightToLeftRouteOrThrow = pickRightToLeftRouteOrThrowFactory(
    _routes,
    isAvailable,
  )

  return {
    supportedRoutes: _routes,
    getSupportedTokens,
    pickLeftToRightRouteOrThrow,
    pickRightToLeftRouteOrThrow,
  }
}

const pickRightToLeftRouteOrThrowFactory =
  <SR extends SupportedRoute>(
    routes: SR[],
    isAvailable: IsAvailableFn<SR>,
  ): PickRightToLeftRouteOrThrowFn<SR> =>
  async (fromChain, toChain, fromToken, toToken) => {
    let result: undefined | { fromChain: ChainId; toChain: ChainId } = undefined

    for (const r of routes) {
      if (
        r.chainRight === fromChain &&
        r.chainLeft === toChain &&
        r.tokenRight === fromToken &&
        r.tokenLeft === toToken &&
        (await isAvailable({
          fromChain,
          toChain,
          fromToken,
          toToken,
        } as any))
      ) {
        result = { fromChain, toChain }
        break
      }

      if (result) return result as any
    }

    throw new UnsupportedBridgeRouteError(
      fromChain,
      toChain,
      fromToken,
      toToken,
    )
  }

const pickLeftToRightRouteOrThrowFactory =
  <SR extends SupportedRoute>(
    routes: SR[],
    isAvailable: IsAvailableFn<SR>,
  ): PickLeftToRightRouteOrThrowFn<SR> =>
  async (fromChain, toChain, fromToken, toToken) => {
    let result: undefined | { fromChain: ChainId; toChain: ChainId } = undefined

    for (const r of routes) {
      if (
        r.chainLeft === fromChain &&
        r.chainRight === toChain &&
        r.tokenLeft === fromToken &&
        r.tokenRight === toToken &&
        (await isAvailable({
          fromChain,
          toChain,
          fromToken,
          toToken,
        } as any))
      ) {
        result = { fromChain, toChain }
        break
      }

      if (result) return result as any
    }

    throw new UnsupportedBridgeRouteError(
      fromChain,
      toChain,
      fromToken,
      toToken,
    )
  }

const getSupportedTokensFactory =
  <SR extends SupportedRoute>(
    routes: SR[],
    isAvailable: IsAvailableFn<SR>,
  ): GetSupportedTokensFn<SR> =>
  async (fromChain, toChain) => {
    const promises = routes.map(
      async (
        r,
      ): Promise<
        {
          fromChain: ChainId
          toChain: ChainId
          fromToken: TokenId
          toToken: TokenId
        }[]
      > => {
        let route:
          | undefined
          | {
              fromChain: ChainId
              toChain: ChainId
              fromToken: TokenId
              toToken: TokenId
            } = undefined

        if (r.chainLeft === fromChain && r.chainRight === toChain) {
          route = {
            fromChain: r.chainLeft,
            toChain: r.chainRight,
            fromToken: r.tokenLeft,
            toToken: r.tokenRight,
          }
        }

        if (r.chainLeft === toChain && r.chainRight === fromChain) {
          route = {
            fromChain: r.chainRight,
            toChain: r.chainLeft,
            fromToken: r.tokenRight,
            toToken: r.tokenLeft,
          }
        }

        return route == null || !(await isAvailable(route as any))
          ? []
          : [route]
      },
    )

    return Promise.all(promises).then(results => results.flat() as any)
  }
