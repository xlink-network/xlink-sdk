import { getStacks2BtcFeeInfo } from "../bitcoinUtils/peggingHelpers"
import { nativeCurrencyAddress } from "../evmUtils/addressHelpers"
import {
  getEvm2StacksFeeInfo,
  getStacks2EvmFeeInfo,
  toCorrespondingStacksToken,
} from "../evmUtils/peggingHelpers"
import { getEVMTokenContractInfo } from "../evmUtils/xlinkContractHelpers"
import { getStacks2MetaFeeInfo } from "../metaUtils/peggingHelpers"
import { BigNumber } from "../utils/BigNumber"
import {
  KnownRoute,
  KnownRoute_FromEVM_ToBitcoin,
  KnownRoute_FromEVM_ToBRC20,
  KnownRoute_FromEVM_ToEVM,
  KnownRoute_FromEVM_ToRunes,
  KnownRoute_FromEVM_ToStacks,
  KnownRoute_FromStacks_ToBRC20,
  KnownRoute_FromStacks_ToRunes,
} from "../utils/buildSupportedRoutes"
import { UnsupportedBridgeRouteError } from "../utils/errors"
import { assertExclude, checkNever } from "../utils/typeHelpers"
import {
  PublicTransferProphetAggregated,
  transformToPublicTransferProphet,
  transformToPublicTransferProphetAggregated,
} from "../utils/types/TransferProphet"
import { KnownChainId, KnownTokenId } from "../utils/types/knownIds"
import { supportedRoutes } from "./bridgeFromEVM"
import { ChainId, SDKNumber, TokenId } from "./types"
import { SDKGlobalContext } from "./types.internal"

export interface BridgeInfoFromEVMInput {
  fromChain: ChainId
  toChain: ChainId
  fromToken: TokenId
  toToken: TokenId
  amount: SDKNumber
}

export interface BridgeInfoFromEVMOutput
  extends PublicTransferProphetAggregated {}

export async function bridgeInfoFromEVM(
  ctx: SDKGlobalContext,
  info: BridgeInfoFromEVMInput,
): Promise<BridgeInfoFromEVMOutput> {
  const route = await supportedRoutes.checkRouteValid(ctx, info)

  if (KnownChainId.isEVMChain(route.fromChain)) {
    if (KnownChainId.isStacksChain(route.toChain)) {
      if (
        KnownTokenId.isEVMToken(route.fromToken) &&
        KnownTokenId.isStacksToken(route.toToken)
      ) {
        return bridgeInfoFromEVM_toStacks(ctx, {
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isBitcoinChain(route.toChain)) {
      if (
        KnownTokenId.isEVMToken(route.fromToken) &&
        KnownTokenId.isBitcoinToken(route.toToken)
      ) {
        return bridgeInfoFromEVM_toBitcoin(ctx, {
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isEVMChain(route.toChain)) {
      if (
        KnownTokenId.isEVMToken(route.fromToken) &&
        KnownTokenId.isEVMToken(route.toToken)
      ) {
        return bridgeInfoFromEVM_toEVM(ctx, {
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isBRC20Chain(route.toChain)) {
      if (
        KnownTokenId.isEVMToken(route.fromToken) &&
        KnownTokenId.isBRC20Token(route.toToken)
      ) {
        return bridgeInfoFromEVM_toMeta(ctx, {
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isRunesChain(route.toChain)) {
      if (
        KnownTokenId.isEVMToken(route.fromToken) &&
        KnownTokenId.isRunesToken(route.toToken)
      ) {
        return bridgeInfoFromEVM_toMeta(ctx, {
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else {
      checkNever(route.toChain)
    }
  } else {
    assertExclude(route.fromChain, assertExclude.i<KnownChainId.StacksChain>())
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

async function bridgeInfoFromEVM_toStacks(
  ctx: SDKGlobalContext,
  info: Omit<
    BridgeInfoFromEVMInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    KnownRoute_FromEVM_ToStacks,
): Promise<BridgeInfoFromEVMOutput> {
  const step1 = await getEvm2StacksFeeInfo(ctx, info)
  const evmTokenContractCallInfo = await getEVMTokenContractInfo(
    ctx,
    info.fromChain,
    info.fromToken,
  )
  if (
    step1 == null ||
    evmTokenContractCallInfo?.tokenContractAddress === nativeCurrencyAddress
  ) {
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

async function bridgeInfoFromEVM_toBitcoin(
  ctx: SDKGlobalContext,
  info: Omit<
    BridgeInfoFromEVMInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    KnownRoute_FromEVM_ToBitcoin,
): Promise<BridgeInfoFromEVMOutput> {
  const transitStacksChain = KnownChainId.isEVMMainnetChain(info.fromChain)
    ? KnownChainId.Stacks.Mainnet
    : KnownChainId.Stacks.Testnet
  const transitStacksToken = await toCorrespondingStacksToken(info.fromToken)
  if (transitStacksToken == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const step1Route: KnownRoute = {
    fromChain: info.fromChain,
    fromToken: info.fromToken,
    toChain: transitStacksChain,
    toToken: transitStacksToken,
  }
  const step2Route: KnownRoute = {
    fromChain: transitStacksChain,
    fromToken: transitStacksToken,
    toChain: info.toChain,
    toToken: info.toToken,
  }

  const [step1, step2] = await Promise.all([
    getEvm2StacksFeeInfo(ctx, step1Route),
    getStacks2BtcFeeInfo(step2Route),
  ])
  if (step1 == null || step2 == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const step1TransferProphet = transformToPublicTransferProphet(
    step1Route,
    info.amount,
    step1,
  )
  const step2TransferProphet = transformToPublicTransferProphet(
    step2Route,
    step1TransferProphet.toAmount,
    step2,
  )

  return {
    ...transformToPublicTransferProphetAggregated(
      [step1TransferProphet, step2TransferProphet],
      [BigNumber.ONE],
    ),
    transferProphets: [step1TransferProphet, step2TransferProphet],
  }
}

async function bridgeInfoFromEVM_toEVM(
  ctx: SDKGlobalContext,
  info: Omit<
    BridgeInfoFromEVMInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    KnownRoute_FromEVM_ToEVM,
): Promise<BridgeInfoFromEVMOutput> {
  const evmTokenContractCallInfo = await getEVMTokenContractInfo(
    ctx,
    info.fromChain,
    info.fromToken,
  )

  const transitStacksChain = KnownChainId.isEVMMainnetChain(info.fromChain)
    ? KnownChainId.Stacks.Mainnet
    : KnownChainId.Stacks.Testnet
  const transitStacksToken = await toCorrespondingStacksToken(info.fromToken)
  if (
    transitStacksToken == null ||
    evmTokenContractCallInfo?.tokenContractAddress === nativeCurrencyAddress
  ) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const step1Route: KnownRoute = {
    fromChain: info.fromChain,
    fromToken: info.fromToken,
    toChain: transitStacksChain,
    toToken: transitStacksToken,
  }
  const step2Route: KnownRoute = {
    fromChain: transitStacksChain,
    fromToken: transitStacksToken,
    toChain: info.toChain,
    toToken: info.toToken,
  }

  const [step1, step2] = await Promise.all([
    getEvm2StacksFeeInfo(ctx, step1Route),
    getStacks2EvmFeeInfo(step2Route),
  ])
  if (step1 == null || step2 == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const step1TransferProphet = transformToPublicTransferProphet(
    step1Route,
    info.amount,
    step1,
  )
  const step2TransferProphet = transformToPublicTransferProphet(
    step2Route,
    step1TransferProphet.toAmount,
    step2,
  )

  return {
    ...transformToPublicTransferProphetAggregated(
      [step1TransferProphet, step2TransferProphet],
      [BigNumber.ONE],
    ),
    transferProphets: [step1TransferProphet, step2TransferProphet],
  }
}

async function bridgeInfoFromEVM_toMeta(
  ctx: SDKGlobalContext,
  info: Omit<
    BridgeInfoFromEVMInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    (KnownRoute_FromEVM_ToBRC20 | KnownRoute_FromEVM_ToRunes),
): Promise<BridgeInfoFromEVMOutput> {
  const evmTokenContractCallInfo = await getEVMTokenContractInfo(
    ctx,
    info.fromChain,
    info.fromToken,
  )

  const transitStacksChain = KnownChainId.isEVMMainnetChain(info.fromChain)
    ? KnownChainId.Stacks.Mainnet
    : KnownChainId.Stacks.Testnet
  const transitStacksToken = await toCorrespondingStacksToken(info.fromToken)
  if (
    transitStacksToken == null ||
    evmTokenContractCallInfo?.tokenContractAddress === nativeCurrencyAddress
  ) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const step1Route: KnownRoute = {
    fromChain: info.fromChain,
    fromToken: info.fromToken,
    toChain: transitStacksChain,
    toToken: transitStacksToken,
  }
  const step2Route:
    | KnownRoute_FromStacks_ToBRC20
    | KnownRoute_FromStacks_ToRunes = {
    fromChain: transitStacksChain,
    fromToken: transitStacksToken,
    toChain: info.toChain as any,
    toToken: info.toToken as any,
  }

  const [step1, step2] = await Promise.all([
    getEvm2StacksFeeInfo(ctx, step1Route),
    getStacks2MetaFeeInfo(ctx, step2Route),
  ])
  if (step1 == null || step2 == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const step1TransferProphet = transformToPublicTransferProphet(
    step1Route,
    info.amount,
    step1,
  )
  const step2TransferProphet = transformToPublicTransferProphet(
    step2Route,
    step1TransferProphet.toAmount,
    step2,
  )

  return {
    ...transformToPublicTransferProphetAggregated(
      [step1TransferProphet, step2TransferProphet],
      [BigNumber.ONE],
    ),
    transferProphets: [step1TransferProphet, step2TransferProphet],
  }
}
