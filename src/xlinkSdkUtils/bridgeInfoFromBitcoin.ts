import { getBtc2StacksFeeInfo } from "../bitcoinUtils/peggingHelpers"
import { getStacks2EvmFeeInfo } from "../evmUtils/peggingHelpers"
import { KnownRoute } from "../utils/buildSupportedRoutes"
import { UnsupportedBridgeRouteError } from "../utils/errors"
import { composeTransferProphet2 } from "../utils/feeRateHelpers"
import { assertExclude, checkNever } from "../utils/typeHelpers"
import {
  PublicTransferProphetAggregated,
  transformToPublicTransferProphet,
} from "../utils/types/TransferProphet"
import { KnownChainId, KnownTokenId } from "../utils/types/knownIds"
import { ChainId, SDKNumber } from "./types"

export interface BridgeInfoFromBitcoinInput {
  fromChain: ChainId
  toChain: ChainId
  amount: SDKNumber
}

export interface BridgeInfoFromBitcoinOutput
  extends PublicTransferProphetAggregated {}

export const bridgeInfoFromBitcoin = async (
  info: BridgeInfoFromBitcoinInput,
): Promise<BridgeInfoFromBitcoinOutput> => {
  const fromChain = info.fromChain
  const toChain = info.toChain

  if (
    !KnownChainId.isKnownChain(fromChain) ||
    !KnownChainId.isKnownChain(toChain)
  ) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
    )
  }

  if (KnownChainId.isBitcoinChain(fromChain)) {
    if (KnownChainId.isStacksChain(toChain)) {
      return bridgeInfoFromBitcoin_toStacks({
        ...info,
        fromChain: fromChain,
        toChain: toChain,
      })
    }

    if (KnownChainId.isEVMChain(toChain)) {
      return bridgeInfoFromBitcoin_toEVM({
        ...info,
        fromChain: fromChain,
        toChain: toChain,
      })
    }

    assertExclude(toChain, assertExclude.i<KnownChainId.BitcoinChain>())
    checkNever(toChain)
  } else {
    assertExclude(fromChain, assertExclude.i<KnownChainId.StacksChain>())
    assertExclude(fromChain, assertExclude.i<KnownChainId.EVMChain>())
    checkNever(fromChain)
  }

  throw new UnsupportedBridgeRouteError(
    info.fromChain,
    info.toChain,
    KnownTokenId.Bitcoin.BTC,
  )
}

async function bridgeInfoFromBitcoin_toStacks(
  info: Omit<BridgeInfoFromBitcoinInput, "fromChain" | "toChain"> & {
    fromChain: KnownChainId.BitcoinChain
    toChain: KnownChainId.StacksChain
  },
): Promise<BridgeInfoFromBitcoinOutput> {
  const route: KnownRoute = {
    fromChain: info.fromChain,
    fromToken: KnownTokenId.Bitcoin.BTC,
    toChain: info.toChain,
    toToken: KnownTokenId.Stacks.aBTC,
  }

  const step1FeeInfo = await getBtc2StacksFeeInfo(route)
  if (step1FeeInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
    )
  }

  return {
    ...transformToPublicTransferProphet(route, step1FeeInfo, info.amount),
    transferProphets: [],
  }
}

async function bridgeInfoFromBitcoin_toEVM(
  info: Omit<BridgeInfoFromBitcoinInput, "fromChain" | "toChain"> & {
    fromChain: KnownChainId.BitcoinChain
    toChain: KnownChainId.EVMChain
  },
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
    toToken: KnownTokenId.EVM.WBTC,
  }

  const [step1, step2] = await Promise.all([
    getBtc2StacksFeeInfo(step1Route),
    getStacks2EvmFeeInfo(step2Route),
  ])
  if (step1 == null || step2 == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
    )
  }

  const composed = composeTransferProphet2(step1, step2)

  const step1TransferProphet = transformToPublicTransferProphet(
    step1Route,
    step1,
    info.amount,
  )
  const step2TransferProphet = transformToPublicTransferProphet(
    step2Route,
    step2,
    step1TransferProphet.toAmount,
  )
  const finalTransferProphet = transformToPublicTransferProphet(
    {
      fromChain: step1Route.fromChain,
      fromToken: step1Route.fromToken,
      toChain: step2Route.toChain,
      toToken: step2Route.toToken,
    },
    composed,
    info.amount,
  )

  return {
    ...finalTransferProphet,
    transferProphets: [step1TransferProphet, step2TransferProphet],
  }
}
