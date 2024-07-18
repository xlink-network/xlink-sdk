import { contractAssignedChainIdFromBridgeChain } from "../stacksUtils/crossContractDataMapping"
import { getStacks2EvmFeeInfo } from "../evmUtils/peggingHelpers"
import {
  getStacksContractCallInfo,
  getStacksTokenContractInfo,
} from "../stacksUtils/xlinkContractHelpers"
import { UnsupportedBridgeRouteError } from "../utils/errors"
import { checkNever } from "../utils/typeHelpers"
import { KnownChainId, KnownTokenId } from "../utils/types.internal"
import { supportedRoutes } from "./bridgeFromStacks"
import { ChainId, SDKNumber, TokenId, toSDKNumberOrUndefined } from "./types"
import { getStacks2BtcFeeInfo } from "../bitcoinUtils/peggingHelpers"

export interface BridgeInfoFromStacksInput {
  fromChain: ChainId
  toChain: ChainId
  fromToken: TokenId
  toToken: TokenId
  amount: SDKNumber
}

export interface BridgeInfoFromStacksOutput {
  isPaused: boolean
  feeToken: TokenId
  feeRate: SDKNumber
  minFeeAmount: SDKNumber
  minBridgeAmount: null | SDKNumber
  maxBridgeAmount: null | SDKNumber
}

export async function bridgeInfoFromStacks(
  info: BridgeInfoFromStacksInput,
): Promise<BridgeInfoFromStacksOutput> {
  const route = await supportedRoutes.pickLeftToRightRouteOrThrow(
    info.fromChain,
    info.toChain,
    info.fromToken,
    info.toToken,
  )

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
      checkNever(route.toChain)
    }
  } else {
    checkNever(route.fromChain)
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
  const contractCallInfo = getStacksContractCallInfo(info.fromChain)
  if (contractCallInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const transferProphet = await getStacks2BtcFeeInfo({
    network: contractCallInfo.network,
    endpointDeployerAddress: contractCallInfo.deployerAddress,
  })

  return {
    isPaused: transferProphet.isPaused,
    feeToken: info.fromToken as TokenId,
    feeRate: toSDKNumberOrUndefined(transferProphet.feeRate),
    minFeeAmount: toSDKNumberOrUndefined(transferProphet.minFee),
    minBridgeAmount: toSDKNumberOrUndefined(transferProphet.minAmount),
    maxBridgeAmount: toSDKNumberOrUndefined(transferProphet.maxAmount),
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
  const contractCallInfo = getStacksContractCallInfo(info.fromChain)
  const tokenContractInfo = getStacksTokenContractInfo(
    info.fromChain,
    info.fromToken,
  )
  if (contractCallInfo == null || tokenContractInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const transferProphet = await getStacks2EvmFeeInfo(
    {
      network: contractCallInfo.network,
      endpointDeployerAddress: contractCallInfo.deployerAddress,
    },
    {
      toChainId: contractAssignedChainIdFromBridgeChain(info.toChain),
      stacksToken: tokenContractInfo,
    },
  )
  if (transferProphet == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  return {
    isPaused: transferProphet.isPaused,
    feeToken: info.fromToken as TokenId,
    feeRate: toSDKNumberOrUndefined(transferProphet.feeRate),
    minFeeAmount: toSDKNumberOrUndefined(transferProphet.minFee),
    minBridgeAmount: toSDKNumberOrUndefined(transferProphet.minAmount),
    maxBridgeAmount: toSDKNumberOrUndefined(transferProphet.maxAmount),
  }
}
