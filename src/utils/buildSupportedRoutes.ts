import { UnsupportedBridgeRouteError } from "./errors"
import { ChainIdInternal, TokenIdInternal } from "./types.internal"
import { OneOrMore } from "./typeHelpers"

export type SupportedRoute = {
  chainLeft: ChainIdInternal
  chainRight: ChainIdInternal
  tokenLeft: TokenIdInternal
  tokenRight: TokenIdInternal
}

export function defineRoute<
  ChainPair extends [chainLeft: ChainIdInternal, chainRight: ChainIdInternal],
  TokenPairs extends OneOrMore<
    [tokenLeft: TokenIdInternal, tokenRight: TokenIdInternal]
  >,
>(
  chainPair: ChainPair,
  tokenPairs: TokenPairs,
): {
  [K in keyof TokenPairs]: {
    chainLeft: ChainPair[0]
    chainRight: ChainPair[1]
    tokenLeft: TokenPairs[K][0]
    tokenRight: TokenPairs[K][1]
  }
} {
  return tokenPairs.map(tokenPair => ({
    chainLeft: chainPair[0],
    chainRight: chainPair[1],
    tokenLeft: tokenPair[0],
    tokenRight: tokenPair[1],
  })) as any
}

type ExtractRouteLtr<
  Routes extends SupportedRoute,
  FromChain extends ChainIdInternal,
  ToChain extends ChainIdInternal,
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
  FromChain extends ChainIdInternal,
  ToChain extends ChainIdInternal,
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
  fromChain: ChainIdInternal
  toChain: ChainIdInternal
  fromToken: TokenIdInternal
  toToken: TokenIdInternal
}[]
export type GetSupportedTokensFn<Routes extends SupportedRoute> = <
  FromChain extends ChainIdInternal,
  ToChain extends ChainIdInternal,
>(
  fromChain: FromChain,
  toChain: ToChain,
) => Promise<
  (
    | ExtractRouteLtr<Routes, FromChain, ToChain>
    | ExtractRouteRtl<Routes, FromChain, ToChain>
  )[]
>

export type PickLeftToRightRouteOrThrowFn<Routes extends SupportedRoute> = <
  FromChain extends ChainIdInternal,
  ToChain extends ChainIdInternal,
>(
  fromChain: FromChain,
  toChain: ToChain,
  fromToken: TokenIdInternal,
  toToken: TokenIdInternal,
) => Promise<
  // prettier-ignore
  Routes extends { chainLeft: infer FromChain; chainRight: infer ToChain }
      ? { fromChain: FromChain; toChain: ToChain }
      : never
>
export type PickRightToLeftRouteOrThrowFn<Routes extends SupportedRoute> = <
  FromChain extends ChainIdInternal,
  ToChain extends ChainIdInternal,
>(
  fromChain: FromChain,
  toChain: ToChain,
  fromToken: TokenIdInternal,
  toToken: TokenIdInternal,
) => Promise<
  // prettier-ignore
  Routes extends { chainRight: infer FromChain; chainLeft: infer ToChain }
      ? { fromChain: FromChain; toChain: ToChain }
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
    let result:
      | undefined
      | { fromChain: ChainIdInternal; toChain: ChainIdInternal } = undefined

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
    let result:
      | undefined
      | { fromChain: ChainIdInternal; toChain: ChainIdInternal } = undefined

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
          fromChain: ChainIdInternal
          toChain: ChainIdInternal
          fromToken: TokenIdInternal
          toToken: TokenIdInternal
        }[]
      > => {
        let route:
          | undefined
          | {
              fromChain: ChainIdInternal
              toChain: ChainIdInternal
              fromToken: TokenIdInternal
              toToken: TokenIdInternal
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
