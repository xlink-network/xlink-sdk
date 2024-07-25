import { getStacks2BtcFeeInfo } from "../bitcoinUtils/peggingHelpers"
import {
  getEvm2StacksFeeInfo,
  getStacks2EvmFeeInfo,
  toCorrespondingStacksCurrency,
} from "../evmUtils/peggingHelpers"
import { KnownRoute } from "../utils/buildSupportedRoutes"
import { UnsupportedBridgeRouteError } from "../utils/errors"
import { composeTransferProphet2 } from "../utils/feeRateHelpers"
import { assertExclude, checkNever } from "../utils/typeHelpers"
import {
  PublicTransferProphetAggregated,
  transformToPublicTransferProphet,
} from "../utils/types/TransferProphet"
import { KnownChainId, KnownTokenId } from "../utils/types/knownIds"
import { supportedRoutes } from "./bridgeFromEVM"
import { ChainId, SDKNumber, TokenId } from "./types"

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
  info: BridgeInfoFromEVMInput,
): Promise<BridgeInfoFromEVMOutput> {
  const route = await supportedRoutes.checkRouteValid(info)

  if (KnownChainId.isEVMChain(route.fromChain)) {
    if (KnownChainId.isStacksChain(route.toChain)) {
      if (
        KnownTokenId.isEVMToken(route.fromToken) &&
        KnownTokenId.isStacksToken(route.toToken)
      ) {
        return bridgeInfoFromEVM_toStacks({
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
        return bridgeInfoFromEVM_toBitcoin({
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
        return bridgeInfoFromEVM_toEVM({
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
  info: Omit<
    BridgeInfoFromEVMInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > & {
    fromChain: KnownChainId.EVMChain
    toChain: KnownChainId.StacksChain
    fromToken: KnownTokenId.EVMToken
    toToken: KnownTokenId.StacksToken
  },
): Promise<BridgeInfoFromEVMOutput> {
  const step1 = await getEvm2StacksFeeInfo(info)
  if (step1 == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  return {
    ...transformToPublicTransferProphet(info, step1, info.amount),
    transferProphets: [],
  }
}

async function bridgeInfoFromEVM_toBitcoin(
  info: Omit<
    BridgeInfoFromEVMInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > & {
    fromChain: KnownChainId.EVMChain
    toChain: KnownChainId.BitcoinChain
    fromToken: KnownTokenId.EVMToken
    toToken: KnownTokenId.BitcoinToken
  },
): Promise<BridgeInfoFromEVMOutput> {
  const transitStacksChain = KnownChainId.isEVMMainnetChain(info.fromChain)
    ? KnownChainId.Stacks.Mainnet
    : KnownChainId.Stacks.Testnet
  const transitStacksToken = await toCorrespondingStacksCurrency(info.fromToken)
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
    getEvm2StacksFeeInfo(step1Route),
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

async function bridgeInfoFromEVM_toEVM(
  info: Omit<
    BridgeInfoFromEVMInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > & {
    fromChain: KnownChainId.EVMChain
    toChain: KnownChainId.EVMChain
    fromToken: KnownTokenId.EVMToken
    toToken: KnownTokenId.EVMToken
  },
): Promise<BridgeInfoFromEVMOutput> {
  const transitStacksChain = KnownChainId.isEVMMainnetChain(info.fromChain)
    ? KnownChainId.Stacks.Mainnet
    : KnownChainId.Stacks.Testnet
  const transitStacksToken = await toCorrespondingStacksCurrency(info.fromToken)
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
    getEvm2StacksFeeInfo(step1Route),
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
