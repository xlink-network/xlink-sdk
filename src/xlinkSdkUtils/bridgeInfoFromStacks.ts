import { getStacks2BtcFeeInfo } from "../bitcoinUtils/peggingHelpers"
import { getStacks2EvmFeeInfo } from "../evmUtils/peggingHelpers"
import { contractAssignedChainIdFromBridgeChain } from "../stacksUtils/crossContractDataMapping"
import {
  getStacksContractCallInfo,
  getStacksTokenContractInfo,
} from "../stacksUtils/xlinkContractHelpers"
import { UnsupportedBridgeRouteError } from "../utils/errors"
import { PublicTransferProphet } from "./types"
import { KnownChainId, KnownTokenId } from "../utils/knownIds"
import { assertExclude, checkNever } from "../utils/typeHelpers"
import { supportedRoutes } from "./bridgeFromStacks"
import { ChainId, SDKNumber, TokenId, toSDKNumberOrUndefined } from "./types"

export interface BridgeInfoFromStacksInput {
  fromChain: ChainId
  toChain: ChainId
  fromToken: TokenId
  toToken: TokenId
  amount: SDKNumber
}

export interface BridgeInfoFromStacksOutput extends PublicTransferProphet {
  feeToken: TokenId
}

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
    minFeeAmount: toSDKNumberOrUndefined(transferProphet.minFeeAmount),
    minBridgeAmount: toSDKNumberOrUndefined(transferProphet.minBridgeAmount),
    maxBridgeAmount: toSDKNumberOrUndefined(transferProphet.maxBridgeAmount),
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
    minFeeAmount: toSDKNumberOrUndefined(transferProphet.minFeeAmount),
    minBridgeAmount: toSDKNumberOrUndefined(transferProphet.minBridgeAmount),
    maxBridgeAmount: toSDKNumberOrUndefined(transferProphet.maxBridgeAmount),
  }
}
