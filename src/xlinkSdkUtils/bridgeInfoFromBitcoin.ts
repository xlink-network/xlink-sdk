import { getBtc2StacksFeeInfo } from "../bitcoinUtils/peggingHelpers"
import { getStacks2EvmFeeInfo } from "../evmUtils/peggingHelpers"
import { getStacks2MetaFeeInfo } from "../metaUtils/peggingHelpers"
import { StacksContractName } from "../stacksUtils/stxContractAddresses"
import {
  executeReadonlyCallXLINK,
  getStacksContractCallInfo,
  numberFromStacksContractNumber,
} from "../stacksUtils/xlinkContractHelpers"
import { BigNumber } from "../utils/BigNumber"
import {
  getAndCheckTransitStacksTokens,
  SwapRoute_WithExchangeRate_Public,
} from "../utils/SwapRouteHelpers"
import {
  KnownRoute,
  KnownRoute_FromBitcoin_ToBRC20,
  KnownRoute_FromBitcoin_ToEVM,
  KnownRoute_FromBitcoin_ToRunes,
  KnownRoute_FromBitcoin_ToStacks,
  KnownRoute_FromStacks_ToBRC20,
  KnownRoute_FromStacks_ToRunes,
} from "../utils/buildSupportedRoutes"
import { UnsupportedBridgeRouteError } from "../utils/errors"
import { props } from "../utils/promiseHelpers"
import { assertExclude, checkNever } from "../utils/typeHelpers"
import {
  PublicTransferProphetAggregated,
  TransferProphet,
  transformToPublicTransferProphet,
  transformToPublicTransferProphetAggregated2,
} from "../utils/types/TransferProphet"
import { KnownChainId, KnownTokenId } from "../utils/types/knownIds"
import { supportedRoutes } from "./bridgeFromBitcoin"
import { ChainId, SDKNumber, TokenId } from "./types"
import { SDKGlobalContext } from "./types.internal"

export interface BridgeInfoFromBitcoinInput {
  fromChain: ChainId
  toChain: ChainId
  fromToken: TokenId
  toToken: TokenId
  amount: SDKNumber
  swapRoute?: SwapRoute_WithExchangeRate_Public
}

export interface BridgeInfoFromBitcoinOutput
  extends PublicTransferProphetAggregated {}

export const bridgeInfoFromBitcoin = async (
  ctx: SDKGlobalContext,
  info: BridgeInfoFromBitcoinInput,
): Promise<BridgeInfoFromBitcoinOutput> => {
  const route = await supportedRoutes.checkRouteValid(ctx, info)

  if (KnownChainId.isBitcoinChain(route.fromChain)) {
    if (KnownChainId.isStacksChain(route.toChain)) {
      if (
        KnownTokenId.isBitcoinToken(route.fromToken) &&
        KnownTokenId.isStacksToken(route.toToken)
      ) {
        return bridgeInfoFromBitcoin_toStacks({
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isEVMChain(route.toChain)) {
      if (
        KnownTokenId.isBitcoinToken(route.fromToken) &&
        KnownTokenId.isEVMToken(route.toToken)
      ) {
        return bridgeInfoFromBitcoin_toEVM(ctx, {
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isBRC20Chain(route.toChain)) {
      if (
        KnownTokenId.isBitcoinToken(route.fromToken) &&
        KnownTokenId.isBRC20Token(route.toToken)
      ) {
        return bridgeInfoFromBitcoin_toMeta(ctx, {
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isRunesChain(route.toChain)) {
      if (
        KnownTokenId.isBitcoinToken(route.fromToken) &&
        KnownTokenId.isRunesToken(route.toToken)
      ) {
        return bridgeInfoFromBitcoin_toMeta(ctx, {
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else {
      assertExclude(route.toChain, assertExclude.i<KnownChainId.BitcoinChain>())
      checkNever(route)
    }
  } else {
    assertExclude(route.fromChain, assertExclude.i<KnownChainId.StacksChain>())
    assertExclude(route.fromChain, assertExclude.i<KnownChainId.EVMChain>())
    checkNever(route)
  }

  throw new UnsupportedBridgeRouteError(
    info.fromChain,
    info.toChain,
    info.fromToken,
    info.toToken,
  )
}

async function bridgeInfoFromBitcoin_toStacks(
  info: Omit<
    BridgeInfoFromBitcoinInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    KnownRoute_FromBitcoin_ToStacks,
): Promise<BridgeInfoFromBitcoinOutput> {
  const step1 = await getBtc2StacksFeeInfo(info, {
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

async function bridgeInfoFromBitcoin_toEVM(
  ctx: SDKGlobalContext,
  info: Omit<
    BridgeInfoFromBitcoinInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    KnownRoute_FromBitcoin_ToEVM,
): Promise<BridgeInfoFromBitcoinOutput> {
  const transitStacksChainId =
    info.fromChain === KnownChainId.Bitcoin.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet

  const step1Route: KnownRoute = {
    fromChain: info.fromChain,
    fromToken: KnownTokenId.Bitcoin.BTC,
    toChain: transitStacksChainId,
    toToken: KnownTokenId.Stacks.aBTC,
  }
  const step2Route: KnownRoute = {
    fromChain: transitStacksChainId,
    fromToken: KnownTokenId.Stacks.aBTC,
    toChain: info.toChain,
    toToken: info.toToken,
  }

  // TODO: add support for Bitcoin -> EVM with swap
  if (info.swapRoute != null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const [step1, step2] = await Promise.all([
    getBtc2StacksFeeInfo(step1Route, {
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

async function bridgeInfoFromBitcoin_toMeta(
  ctx: SDKGlobalContext,
  info: Omit<
    BridgeInfoFromBitcoinInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    (KnownRoute_FromBitcoin_ToBRC20 | KnownRoute_FromBitcoin_ToRunes),
): Promise<BridgeInfoFromBitcoinOutput> {
  const transitStacksChain =
    info.fromChain === KnownChainId.Bitcoin.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet

  const {
    firstStepToStacksToken: step1ToStacksToken,
    lastStepFromStacksToken: step2FromStacksToken,
  } = await getAndCheckTransitStacksTokens(ctx, info)

  const step1Route: KnownRoute = {
    fromChain: info.fromChain,
    fromToken: info.fromToken,
    toChain: transitStacksChain,
    toToken: step1ToStacksToken,
  }
  const step2Route:
    | KnownRoute_FromStacks_ToBRC20
    | KnownRoute_FromStacks_ToRunes = {
    fromChain: transitStacksChain,
    fromToken: step2FromStacksToken,
    toChain: info.toChain as any,
    toToken: info.toToken as any,
  }

  const [step1, step2] = await Promise.all([
    getBtc2StacksFeeInfo(step1Route, {
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

export async function bridgeInfoFromBitcoin_toLaunchpad(
  ctx: SDKGlobalContext,
  info: {
    fromChain: KnownChainId.BitcoinChain
    fromToken: KnownTokenId.BitcoinToken
    launchId: SDKNumber
    amount: SDKNumber
  },
): Promise<BridgeInfoFromBitcoinOutput> {
  const toChain =
    info.fromChain === KnownChainId.Bitcoin.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet
  const toToken = KnownTokenId.Stacks.aBTC

  const contractCallInfo = getStacksContractCallInfo(
    toChain,
    StacksContractName.BTCPegInEndpointLaunchpad,
  )
  if (contractCallInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      toChain,
      info.fromToken,
      toToken,
    )
  }

  const route: KnownRoute = {
    fromChain: info.fromChain,
    fromToken: info.fromToken,
    toChain,
    toToken,
  }

  const resp = await props({
    isPaused: executeReadonlyCallXLINK(
      contractCallInfo.contractName,
      "is-peg-in-paused",
      {},
      contractCallInfo.executeOptions,
    ),
    feeRate: executeReadonlyCallXLINK(
      contractCallInfo.contractName,
      "get-peg-in-fee",
      {},
      contractCallInfo.executeOptions,
    ).then(numberFromStacksContractNumber),
    minFeeAmount: executeReadonlyCallXLINK(
      contractCallInfo.contractName,
      "get-peg-in-min-fee",
      {},
      contractCallInfo.executeOptions,
    ).then(numberFromStacksContractNumber),
  })

  const transferProphet: TransferProphet = {
    isPaused: resp.isPaused,
    bridgeToken: info.fromToken,
    fees: [
      {
        type: "rate",
        token: info.fromToken,
        rate: resp.feeRate,
        minimumAmount: resp.minFeeAmount,
      },
    ],
    minBridgeAmount: BigNumber.isZero(resp.minFeeAmount)
      ? null
      : resp.minFeeAmount,
    maxBridgeAmount: null,
  }

  return {
    ...transformToPublicTransferProphet(route, info.amount, transferProphet),
    transferProphets: [],
  }
}
