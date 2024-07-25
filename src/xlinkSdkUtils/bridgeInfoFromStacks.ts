import { getStacks2BtcFeeInfo } from "../bitcoinUtils/peggingHelpers"
import { getStacks2EvmFeeInfo } from "../evmUtils/peggingHelpers"
import { UnsupportedBridgeRouteError } from "../utils/errors"
import { assertExclude, checkNever } from "../utils/typeHelpers"
import {
  PublicTransferProphetAggregated,
  transformToPublicTransferProphet,
} from "../utils/types/TransferProphet"
import { KnownChainId, KnownTokenId } from "../utils/types/knownIds"
import { supportedRoutes } from "./bridgeFromStacks"
import { ChainId, SDKNumber, TokenId } from "./types"

export interface BridgeInfoFromStacksInput {
  fromChain: ChainId
  toChain: ChainId
  fromToken: TokenId
  toToken: TokenId
  amount: SDKNumber
}

export interface BridgeInfoFromStacksOutput
  extends PublicTransferProphetAggregated {}

export async function bridgeInfoFromStacks(
  info: BridgeInfoFromStacksInput,
): Promise<BridgeInfoFromStacksOutput> {
  const route = await supportedRoutes.checkRouteValid(info)

  if (KnownChainId.isStacksChain(route.fromChain)) {
    if (KnownChainId.isBitcoinChain(route.toChain)) {
      if (
        KnownTokenId.isStacksToken(route.fromToken) &&
        KnownTokenId.isBitcoinToken(route.toToken)
      ) {
        return bridgeInfoFromStacks_toBitcoin({
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isEVMChain(route.toChain)) {
      if (
        KnownTokenId.isStacksToken(route.fromToken) &&
        KnownTokenId.isEVMToken(route.toToken)
      ) {
        return bridgeInfoFromStacks_toEVM({
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else {
      assertExclude(route.toChain, assertExclude.i<KnownChainId.StacksChain>())
      checkNever(route)
    }
  } else {
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

async function bridgeInfoFromStacks_toBitcoin(
  info: Omit<
    BridgeInfoFromStacksInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > & {
    fromChain: KnownChainId.StacksChain
    toChain: KnownChainId.BitcoinChain
    fromToken: KnownTokenId.StacksToken
    toToken: KnownTokenId.BitcoinToken
  },
): Promise<BridgeInfoFromStacksOutput> {
  const step1 = await getStacks2BtcFeeInfo(info)
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

async function bridgeInfoFromStacks_toEVM(
  info: Omit<
    BridgeInfoFromStacksInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > & {
    fromChain: KnownChainId.StacksChain
    toChain: KnownChainId.EVMChain
    fromToken: KnownTokenId.StacksToken
    toToken: KnownTokenId.EVMToken
  },
): Promise<BridgeInfoFromStacksOutput> {
  const step1 = await getStacks2EvmFeeInfo(info)
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
