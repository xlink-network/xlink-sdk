import { getStacks2BtcFeeInfo } from "../bitcoinUtils/peggingHelpers"
import { getStacks2EvmFeeInfo } from "../evmUtils/peggingHelpers"
import {
  getMeta2StacksFeeInfo,
  getStacks2MetaFeeInfo,
} from "../metaUtils/peggingHelpers"
import { BigNumber } from "../utils/BigNumber"
import {
  getAndCheckTransitStacksTokens,
  SwapRoute_WithExchangeRate_Public,
} from "../utils/SwapRouteHelpers"
import {
  KnownRoute,
  KnownRoute_FromBRC20_ToBitcoin,
  KnownRoute_FromBRC20_ToBRC20,
  KnownRoute_FromBRC20_ToEVM,
  KnownRoute_FromBRC20_ToRunes,
  KnownRoute_FromBRC20_ToStacks,
  KnownRoute_FromRunes_ToBitcoin,
  KnownRoute_FromRunes_ToBRC20,
  KnownRoute_FromRunes_ToEVM,
  KnownRoute_FromRunes_ToRunes,
  KnownRoute_FromRunes_ToStacks,
  KnownRoute_FromStacks_ToBRC20,
  KnownRoute_FromStacks_ToRunes,
  KnownRoute_WithMetaProtocol,
} from "../utils/buildSupportedRoutes"
import { UnsupportedBridgeRouteError } from "../utils/errors"
import { assertExclude, checkNever } from "../utils/typeHelpers"
import {
  PublicTransferProphetAggregated,
  transformToPublicTransferProphet,
  transformToPublicTransferProphetAggregated2,
} from "../utils/types/TransferProphet"
import { KnownChainId, KnownTokenId } from "../utils/types/knownIds"
import { ChainId, SDKNumber, TokenId } from "./types"
import { SDKGlobalContext } from "./types.internal"

export interface BridgeInfoFromMetaInput {
  fromChain: ChainId
  toChain: ChainId
  fromToken: TokenId
  toToken: TokenId
  amount: SDKNumber
  swapRoute?: SwapRoute_WithExchangeRate_Public
}

export interface BridgeInfoFromMetaOutput
  extends PublicTransferProphetAggregated {}

export const bridgeInfoFromMeta = async (
  ctx: SDKGlobalContext,
  info: BridgeInfoFromMetaInput,
): Promise<BridgeInfoFromMetaOutput> => {
  const isMetaProtocolChain = (
    chain: ChainId,
  ): chain is KnownChainId.BRC20Chain | KnownChainId.RunesChain =>
    KnownChainId.isBRC20Chain(chain) || KnownChainId.isRunesChain(chain)
  const isMetaProtocolToken = (
    token: TokenId,
  ): token is KnownTokenId.BRC20Token | KnownTokenId.RunesToken =>
    KnownTokenId.isBRC20Token(token) || KnownTokenId.isRunesToken(token)

  const route = info as any as KnownRoute_WithMetaProtocol

  if (isMetaProtocolChain(route.fromChain)) {
    if (KnownChainId.isStacksChain(route.toChain)) {
      if (
        isMetaProtocolToken(route.fromToken) &&
        KnownTokenId.isStacksToken(route.toToken)
      ) {
        return bridgeInfoFromMeta_toStacks(ctx, {
          ...info,
          fromChain: route.fromChain as KnownChainId.BRC20Chain,
          fromToken: route.fromToken as KnownTokenId.BRC20Token,
          toChain: route.toChain,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isEVMChain(route.toChain)) {
      if (
        isMetaProtocolToken(route.fromToken) &&
        KnownTokenId.isEVMToken(route.toToken)
      ) {
        return bridgeInfoFromMeta_toEVM(ctx, {
          ...info,
          fromChain: route.fromChain as KnownChainId.BRC20Chain,
          fromToken: route.fromToken as KnownTokenId.BRC20Token,
          toChain: route.toChain,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isBitcoinChain(route.toChain)) {
      if (
        isMetaProtocolToken(route.fromToken) &&
        KnownTokenId.isBitcoinToken(route.toToken)
      ) {
        return bridgeInfoFromMeta_toBitcoin(ctx, {
          ...info,
          fromChain: route.fromChain as KnownChainId.BRC20Chain,
          fromToken: route.fromToken as KnownTokenId.BRC20Token,
          toChain: route.toChain,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isBRC20Chain(route.toChain)) {
      if (
        isMetaProtocolToken(route.fromToken) &&
        KnownTokenId.isBRC20Token(route.toToken)
      ) {
        return bridgeInfoFromMeta_toMeta(ctx, {
          ...info,
          fromChain: route.fromChain as KnownChainId.BRC20Chain,
          fromToken: route.fromToken as KnownTokenId.BRC20Token,
          toChain: route.toChain,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isRunesChain(route.toChain)) {
      if (
        isMetaProtocolToken(route.fromToken) &&
        KnownTokenId.isRunesToken(route.toToken)
      ) {
        return bridgeInfoFromMeta_toMeta(ctx, {
          ...info,
          fromChain: route.fromChain as KnownChainId.BRC20Chain,
          fromToken: route.fromToken as KnownTokenId.BRC20Token,
          toChain: route.toChain,
          toToken: route.toToken,
        })
      }
    } else {
      checkNever(route.toChain)
    }
  } else {
    assertExclude(route.fromChain, assertExclude.i<KnownChainId.StacksChain>())
    assertExclude(route.fromChain, assertExclude.i<KnownChainId.EVMChain>())
    assertExclude(route.fromChain, assertExclude.i<KnownChainId.BitcoinChain>())
    checkNever(route)
  }

  throw new UnsupportedBridgeRouteError(
    info.fromChain,
    info.toChain,
    info.fromToken,
    info.toToken,
  )
}

async function bridgeInfoFromMeta_toStacks(
  ctx: SDKGlobalContext,
  info: Omit<
    BridgeInfoFromMetaInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    (KnownRoute_FromBRC20_ToStacks | KnownRoute_FromRunes_ToStacks),
): Promise<BridgeInfoFromMetaOutput> {
  const step1 = await getMeta2StacksFeeInfo(ctx, info, {
    swapRoute: info.swapRoute ?? null,
  })
  if (step1 == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  return {
    ...transformToPublicTransferProphet(info, info.amount, step1),
    transferProphets: [],
  }
}

async function bridgeInfoFromMeta_toEVM(
  ctx: SDKGlobalContext,
  info: Omit<
    BridgeInfoFromMetaInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    (KnownRoute_FromBRC20_ToEVM | KnownRoute_FromRunes_ToEVM),
): Promise<BridgeInfoFromMetaOutput> {
  const transitStacksChainId =
    info.fromChain === KnownChainId.BRC20.Mainnet ||
    info.fromChain === KnownChainId.Runes.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet

  const {
    firstStepToStacksToken: step1ToStacksToken,
    lastStepFromStacksToken: step2FromStacksToken,
  } = await getAndCheckTransitStacksTokens(ctx, info)

  const step1Route = {
    fromChain: info.fromChain as KnownChainId.BRC20Chain,
    fromToken: info.fromToken as KnownTokenId.BRC20Token,
    toChain: transitStacksChainId,
    toToken: step1ToStacksToken,
  } satisfies KnownRoute_WithMetaProtocol
  const step2Route: KnownRoute = {
    fromChain: transitStacksChainId,
    fromToken: step2FromStacksToken,
    toChain: info.toChain,
    toToken: info.toToken,
  } satisfies KnownRoute_WithMetaProtocol

  // TODO: add support for Meta -> EVM with swap
  if (info.swapRoute != null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const [step1, step2] = await Promise.all([
    getMeta2StacksFeeInfo(ctx, step1Route, {
      swapRoute: info.swapRoute ?? null,
    }),
    getStacks2EvmFeeInfo(ctx, step2Route),
  ])
  if (step1 == null || step2 == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  return transformToPublicTransferProphetAggregated2(
    [step1Route, step2Route],
    [step1, step2],
    BigNumber.from(info.amount),
    BigNumber.ONE,
  )
}

async function bridgeInfoFromMeta_toBitcoin(
  ctx: SDKGlobalContext,
  info: Omit<
    BridgeInfoFromMetaInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    (KnownRoute_FromBRC20_ToBitcoin | KnownRoute_FromRunes_ToBitcoin),
): Promise<BridgeInfoFromMetaOutput> {
  const transitStacksChainId =
    info.fromChain === KnownChainId.BRC20.Mainnet ||
    info.fromChain === KnownChainId.Runes.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet

  const {
    firstStepToStacksToken: step1ToStacksToken,
    lastStepFromStacksToken: step2FromStacksToken,
  } = await getAndCheckTransitStacksTokens(ctx, info)

  const step1Route = {
    fromChain: info.fromChain as KnownChainId.BRC20Chain,
    fromToken: info.fromToken as KnownTokenId.BRC20Token,
    toChain: transitStacksChainId,
    toToken: step1ToStacksToken,
  } satisfies KnownRoute_WithMetaProtocol
  const step2Route: KnownRoute = {
    fromChain: transitStacksChainId,
    fromToken: step2FromStacksToken,
    toChain: info.toChain,
    toToken: info.toToken,
  } satisfies KnownRoute_WithMetaProtocol

  const [step1, step2] = await Promise.all([
    getMeta2StacksFeeInfo(ctx, step1Route, {
      swapRoute: info.swapRoute ?? null,
    }),
    getStacks2BtcFeeInfo(ctx, step2Route, {
      initialRoute: step1Route,
      swapRoute: info.swapRoute ?? null,
    }),
  ])
  if (step1 == null || step2 == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  return transformToPublicTransferProphetAggregated2(
    [step1Route, step2Route],
    [step1, step2],
    BigNumber.from(info.amount),
    BigNumber.from(info.swapRoute?.composedExchangeRate ?? BigNumber.ONE),
  )
}

async function bridgeInfoFromMeta_toMeta(
  ctx: SDKGlobalContext,
  info: Omit<
    BridgeInfoFromMetaInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    (
      | KnownRoute_FromBRC20_ToBRC20
      | KnownRoute_FromBRC20_ToRunes
      | KnownRoute_FromRunes_ToBRC20
      | KnownRoute_FromRunes_ToRunes
    ),
): Promise<BridgeInfoFromMetaOutput> {
  const transitStacksChain =
    info.fromChain === KnownChainId.BRC20.Mainnet ||
    info.fromChain === KnownChainId.Runes.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet

  const {
    firstStepToStacksToken: step1ToStacksToken,
    lastStepFromStacksToken: step2FromStacksToken,
  } = await getAndCheckTransitStacksTokens(ctx, info)

  const step1Route:
    | KnownRoute_FromBRC20_ToStacks
    | KnownRoute_FromRunes_ToStacks = {
    fromChain: info.fromChain as any,
    fromToken: info.fromToken as any,
    toChain: transitStacksChain,
    toToken: step1ToStacksToken,
  } satisfies KnownRoute_WithMetaProtocol
  const step2Route:
    | KnownRoute_FromStacks_ToBRC20
    | KnownRoute_FromStacks_ToRunes = {
    fromChain: transitStacksChain,
    fromToken: step2FromStacksToken,
    toChain: info.toChain as any,
    toToken: info.toToken as any,
  }

  const [step1, step2] = await Promise.all([
    getMeta2StacksFeeInfo(ctx, step1Route, {
      swapRoute: info.swapRoute ?? null,
    }),
    getStacks2MetaFeeInfo(ctx, step2Route, {
      initialRoute: step1Route,
      swapRoute: info.swapRoute ?? null,
    }),
  ])
  if (step1 == null || step2 == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  return transformToPublicTransferProphetAggregated2(
    [step1Route, step2Route],
    [step1, step2],
    BigNumber.from(info.amount),
    BigNumber.from(info.swapRoute?.composedExchangeRate ?? BigNumber.ONE),
  )
}
