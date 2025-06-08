import { ChainId, TokenId } from "../sdkUtils/types"
import { SDKGlobalContext } from "../sdkUtils/types.internal"
import { UnsupportedBridgeRouteError } from "./errors"
import { pMemoize } from "./pMemoize"
import { SwapRoute } from "./SwapRouteHelpers"
import { checkNever } from "./typeHelpers"
import { KnownChainId, KnownTokenId } from "./types/knownIds"

export interface DefinedRoute {
  fromChain: ChainId
  fromToken: TokenId
  toChain: ChainId
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
export type KnownRoute_FromBitcoin_ToBRC20 = {
  fromChain: KnownChainId.BitcoinChain
  fromToken: KnownTokenId.BitcoinToken
  toChain: KnownChainId.BRC20Chain
  toToken: KnownTokenId.BRC20Token
}
export type KnownRoute_FromBitcoin_ToRunes = {
  fromChain: KnownChainId.BitcoinChain
  fromToken: KnownTokenId.BitcoinToken
  toChain: KnownChainId.RunesChain
  toToken: KnownTokenId.RunesToken
}
export type KnownRoute_FromBitcoin =
  | KnownRoute_FromBitcoin_ToStacks
  | KnownRoute_FromBitcoin_ToEVM
  | KnownRoute_FromBitcoin_ToBRC20
  | KnownRoute_FromBitcoin_ToRunes

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

export type KnownRoute_FromBRC20_ToStacks = {
  fromChain: KnownChainId.BRC20Chain
  fromToken: KnownTokenId.BRC20Token
  toChain: KnownChainId.StacksChain
  toToken: KnownTokenId.StacksToken
}
export type KnownRoute_FromBRC20_ToEVM = {
  fromChain: KnownChainId.BRC20Chain
  fromToken: KnownTokenId.BRC20Token
  toChain: KnownChainId.EVMChain
  toToken: KnownTokenId.EVMToken
}
export type KnownRoute_FromBRC20_ToBitcoin = {
  fromChain: KnownChainId.BRC20Chain
  fromToken: KnownTokenId.BRC20Token
  toChain: KnownChainId.BitcoinChain
  toToken: KnownTokenId.BitcoinToken
}
export type KnownRoute_FromBRC20_ToBRC20 = {
  fromChain: KnownChainId.BRC20Chain
  fromToken: KnownTokenId.BRC20Token
  toChain: KnownChainId.BRC20Chain
  toToken: KnownTokenId.BRC20Token
}
export type KnownRoute_FromBRC20_ToRunes = {
  fromChain: KnownChainId.BRC20Chain
  fromToken: KnownTokenId.BRC20Token
  toChain: KnownChainId.RunesChain
  toToken: KnownTokenId.RunesToken
}
export type KnownRoute_FromBRC20 =
  | KnownRoute_FromBRC20_ToStacks
  | KnownRoute_FromBRC20_ToEVM
  | KnownRoute_FromBRC20_ToBitcoin
  | KnownRoute_FromBRC20_ToBRC20
  | KnownRoute_FromBRC20_ToRunes

export type KnownRoute_FromRunes_ToStacks = {
  fromChain: KnownChainId.RunesChain
  fromToken: KnownTokenId.RunesToken
  toChain: KnownChainId.StacksChain
  toToken: KnownTokenId.StacksToken
}
export type KnownRoute_FromRunes_ToEVM = {
  fromChain: KnownChainId.RunesChain
  fromToken: KnownTokenId.RunesToken
  toChain: KnownChainId.EVMChain
  toToken: KnownTokenId.EVMToken
}
export type KnownRoute_FromRunes_ToBitcoin = {
  fromChain: KnownChainId.RunesChain
  fromToken: KnownTokenId.RunesToken
  toChain: KnownChainId.BitcoinChain
  toToken: KnownTokenId.BitcoinToken
}
export type KnownRoute_FromRunes_ToBRC20 = {
  fromChain: KnownChainId.RunesChain
  fromToken: KnownTokenId.RunesToken
  toChain: KnownChainId.BRC20Chain
  toToken: KnownTokenId.BRC20Token
}
export type KnownRoute_FromRunes_ToRunes = {
  fromChain: KnownChainId.RunesChain
  fromToken: KnownTokenId.RunesToken
  toChain: KnownChainId.RunesChain
  toToken: KnownTokenId.RunesToken
}
export type KnownRoute_FromRunes =
  | KnownRoute_FromRunes_ToStacks
  | KnownRoute_FromRunes_ToEVM
  | KnownRoute_FromRunes_ToBitcoin
  | KnownRoute_FromRunes_ToBRC20
  | KnownRoute_FromRunes_ToRunes

export type KnownRoute_FromMeta_ToStacks =
  | KnownRoute_FromBRC20_ToStacks
  | KnownRoute_FromRunes_ToStacks
export type KnownRoute_FromMeta_ToEVM =
  | KnownRoute_FromBRC20_ToEVM
  | KnownRoute_FromRunes_ToEVM
export type KnownRoute_FromMeta_ToBitcoin =
  | KnownRoute_FromBRC20_ToBitcoin
  | KnownRoute_FromRunes_ToBitcoin
export type KnownRoute_FromMeta_ToBRC20 =
  | KnownRoute_FromBRC20_ToBRC20
  | KnownRoute_FromRunes_ToBRC20
export type KnownRoute_FromMeta_ToRunes =
  | KnownRoute_FromBRC20_ToRunes
  | KnownRoute_FromRunes_ToRunes
export type KnownRoute_FromMeta_ToMeta =
  | KnownRoute_FromMeta_ToBRC20
  | KnownRoute_FromMeta_ToRunes
export type KnownRoute_FromMeta = KnownRoute_FromBRC20 | KnownRoute_FromRunes

export type KnownRoute =
  | KnownRoute_FromStacks
  | KnownRoute_FromEVM
  | KnownRoute_FromBitcoin
  | KnownRoute_FromBRC20
  | KnownRoute_FromRunes

export type KnownRoute_ToStacks =
  | KnownRoute_FromBitcoin_ToStacks
  | KnownRoute_FromEVM_ToStacks
  | KnownRoute_FromBRC20_ToStacks
  | KnownRoute_FromRunes_ToStacks

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
  route: DefinedRoute & {
    swapRoute?: SwapRoute
  },
) => Promise<boolean>
export const memoizedIsSupportedFactory = (
  isSupported: IsSupportedFn,
): IsSupportedFn => {
  return pMemoize(
    {
      cacheKey([, route]) {
        const from = `${route.fromChain}:${route.fromToken}`
        const to = `${route.toChain}:${route.toToken}`
        if (route.swapRoute == null) return `${from}->${to}`

        let swap: string
        if (route.swapRoute.via === "ALEX") {
          swap = route.swapRoute.swapPools.map(p => p.poolId).join("->")
        } else if (route.swapRoute.via === "evmDexAggregator") {
          swap = `${route.swapRoute.fromEVMToken}->${route.swapRoute.toEVMToken}`
        } else if (route.swapRoute.via === "instantSwap") {
          swap = `instantSwap`
        } else {
          checkNever(route.swapRoute)
          swap = JSON.stringify(route.swapRoute)
        }
        return `${from}->(${swap})->${to}`
      },
      skipCache: true,
    },
    isSupported,
  )
}

export type CheckRouteValidFn = (
  ctx: SDKGlobalContext,
  isSupported: IsSupportedFn,
  route: DefinedRoute & {
    swapRoute?: SwapRoute
  },
) => Promise<KnownRoute>
export const checkRouteValid: CheckRouteValidFn = async (
  ctx,
  isSupported,
  route,
) => {
  const isValid = await isSupported(ctx, route)

  if (!isValid) {
    throw new UnsupportedBridgeRouteError(
      route.fromChain,
      route.toChain,
      route.fromToken,
      route.toToken,
      route.swapRoute,
    )
  }

  return route as any
}

export interface GetSupportedRoutesFn_Conditions {
  fromChain?: ChainId
  fromToken?: TokenId
  toChain?: ChainId
  toToken?: TokenId
  includeUnpredictableSwapPossibilities?: boolean
}

export type GetSupportedRoutesFn = (
  ctx: SDKGlobalContext,
  conditions?: GetSupportedRoutesFn_Conditions,
) => Promise<KnownRoute[]>
