import { evmTokenToCorrespondingStacksToken } from "../evmUtils/peggingHelpers"
import { metaTokenToCorrespondingStacksToken } from "../metaUtils/peggingHelpers"
import { getStacksToken } from "../stacksUtils/xlinkContractHelpers"
import { SDKNumber, StacksContractAddress } from "../xlinkSdkUtils/types"
import { SDKGlobalContext } from "../xlinkSdkUtils/types.internal"
import { last } from "./arrayHelpers"
import { BigNumber } from "./BigNumber"
import { KnownRoute_WithMetaProtocol } from "./buildSupportedRoutes"
import { UnsupportedBridgeRouteError } from "./errors"
import { checkNever, OneOrMore } from "./typeHelpers"
import { KnownChainId, KnownTokenId } from "./types/knownIds"

export interface SwapRoute {
  fromTokenAddress: StacksContractAddress
  swapPools: OneOrMore<{
    poolId: bigint
    toTokenAddress: StacksContractAddress
  }>
}

export interface SwapRoute_WithExchangeRate extends SwapRoute {
  composedExchangeRate: BigNumber
}
export interface SwapRoute_WithExchangeRate_Public extends SwapRoute {
  composedExchangeRate: SDKNumber
}

export interface SwapRoute_WithMinimumAmountsToReceive extends SwapRoute {
  minimumAmountsToReceive: BigNumber
}
export interface SwapRoute_WithMinimumAmountsToReceive_Public
  extends SwapRoute {
  minimumAmountsToReceive: SDKNumber
}

export async function getFirstStepStacksTokenAddress(
  sdkContext: SDKGlobalContext,
  info: {
    swap: SwapRoute
    stacksChain: KnownChainId.StacksChain
  },
): Promise<undefined | KnownTokenId.StacksToken> {
  return getStacksToken(
    sdkContext,
    info.stacksChain,
    info.swap.fromTokenAddress,
  )
}

export async function getFinalStepStacksTokenAddress(
  sdkContext: SDKGlobalContext,
  info: {
    swap: SwapRoute
    stacksChain: KnownChainId.StacksChain
  },
): Promise<undefined | KnownTokenId.StacksToken> {
  const finalStepStacksTokenAddress = last(info.swap.swapPools).toTokenAddress

  return getStacksToken(
    sdkContext,
    info.stacksChain,
    finalStepStacksTokenAddress,
  )
}

export async function getTransitStacksChainTransitStepInfos(
  ctx: SDKGlobalContext,
  info: KnownRoute_WithMetaProtocol & {
    swapRoute?: SwapRoute_WithExchangeRate_Public
  },
): Promise<{
  step1ToStacksToken: KnownTokenId.StacksToken
  step2FromStacksToken: KnownTokenId.StacksToken
}> {
  const transitStacksChainId =
    info.fromChain === KnownChainId.Bitcoin.Mainnet ||
    info.fromChain === KnownChainId.BRC20.Mainnet ||
    info.fromChain === KnownChainId.Runes.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet

  const [
    step1ToStacksToken,
    step2FromStacksToken,
    swapStartToken,
    swapEndToken,
  ] = await Promise.all([
    toCorrespondingStacksToken(info.fromChain, info.fromToken),
    toCorrespondingStacksToken(info.toChain, info.toToken),
    info.swapRoute == null
      ? null
      : getFirstStepStacksTokenAddress(ctx, {
          swap: info.swapRoute,
          stacksChain: transitStacksChainId,
        }),
    info.swapRoute == null
      ? null
      : getFinalStepStacksTokenAddress(ctx, {
          swap: info.swapRoute,
          stacksChain: transitStacksChainId,
        }),
  ])

  if (
    step1ToStacksToken == null ||
    step2FromStacksToken == null ||
    (info.swapRoute != null &&
      (swapStartToken !== step1ToStacksToken ||
        swapEndToken !== step2FromStacksToken))
  ) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  return {
    step1ToStacksToken,
    step2FromStacksToken,
  }

  async function toCorrespondingStacksToken(
    chain: KnownChainId.KnownChain,
    token: KnownTokenId.KnownToken,
  ): Promise<undefined | KnownTokenId.StacksToken> {
    let toStacksTokenPromise:
      | undefined
      | Promise<undefined | KnownTokenId.StacksToken>

    if (KnownChainId.isBitcoinChain(chain)) {
      if (token === KnownTokenId.Bitcoin.BTC) {
        toStacksTokenPromise = Promise.resolve(KnownTokenId.Stacks.aBTC)
      }
    } else if (KnownChainId.isBRC20Chain(chain)) {
      if (KnownTokenId.isBRC20Token(token)) {
        toStacksTokenPromise = metaTokenToCorrespondingStacksToken(ctx, {
          chain: chain as KnownChainId.BRC20Chain,
          token: token as KnownTokenId.BRC20Token,
        })
      }
    } else if (KnownChainId.isRunesChain(chain)) {
      if (KnownTokenId.isRunesToken(token)) {
        toStacksTokenPromise = metaTokenToCorrespondingStacksToken(ctx, {
          chain: chain as KnownChainId.RunesChain,
          token: token as KnownTokenId.RunesToken,
        })
      }
    } else if (KnownChainId.isEVMChain(chain)) {
      if (KnownTokenId.isEVMToken(token)) {
        toStacksTokenPromise = evmTokenToCorrespondingStacksToken(token)
      }
    } else if (KnownChainId.isStacksChain(chain)) {
      if (KnownTokenId.isStacksToken(token)) {
        toStacksTokenPromise = Promise.resolve(token)
      }
    } else {
      checkNever(chain)
    }

    return toStacksTokenPromise
  }
}
