import { getStacks2BtcFeeInfo } from "../bitcoinUtils/peggingHelpers"
import {
  getEvm2StacksFeeInfo,
  getStacks2EvmFeeInfo,
  toCorrespondingStacksCurrency,
} from "../evmUtils/peggingHelpers"
import { getEVMTokenContractInfo } from "../evmUtils/xlinkContractHelpers"
import { contractAssignedChainIdFromBridgeChain } from "../stacksUtils/crossContractDataMapping"
import {
  getStacksContractCallInfo,
  getStacksTokenContractInfo,
} from "../stacksUtils/xlinkContractHelpers"
import { UnsupportedBridgeRouteError } from "../utils/errors"
import { composeTransferProphet2 } from "../utils/feeRateHelpers"
import { checkNever } from "../utils/typeHelpers"
import { KnownChainId, KnownTokenId } from "../utils/types.internal"
import { supportedRoutes } from "./bridgeFromEVM"
import { ChainId, SDKNumber, TokenId, toSDKNumberOrUndefined } from "./types"

export interface BridgeInfoFromEVMInput {
  fromChain: ChainId
  toChain: ChainId
  fromToken: TokenId
  toToken: TokenId
  amount: SDKNumber
}

export interface BridgeInfoFromEVMOutput {
  isPaused: boolean
  feeToken: TokenId
  feeRate: SDKNumber
  minFeeAmount: SDKNumber
  minBridgeAmount: null | SDKNumber
  maxBridgeAmount: null | SDKNumber
}

export async function bridgeInfoFromEVM(
  info: BridgeInfoFromEVMInput,
): Promise<BridgeInfoFromEVMOutput> {
  const route = await supportedRoutes.pickLeftToRightRouteOrThrow(
    info.fromChain,
    info.toChain,
    info.fromToken,
    info.toToken,
  )

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
    checkNever(route.fromChain)
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
  const evmContractCallInfo = await getEVMTokenContractInfo(
    info.fromChain,
    info.fromToken,
  )
  const stacksContractCallInfo = getStacksContractCallInfo(info.toChain)
  if (evmContractCallInfo == null || stacksContractCallInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const transferProphet = await getEvm2StacksFeeInfo(
    {
      network: stacksContractCallInfo.network,
      endpointDeployerAddress: stacksContractCallInfo.deployerAddress,
    },
    {
      client: evmContractCallInfo.client,
      bridgeContractAddress: evmContractCallInfo.bridgeEndpointContractAddress,
    },
    evmContractCallInfo.tokenContractAddress,
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
  const stacksChain = KnownChainId.isEVMMainnetChain(info.fromChain)
    ? KnownChainId.Stacks.Mainnet
    : KnownChainId.Stacks.Testnet
  const stacksContractCallInfo = getStacksContractCallInfo(stacksChain)
  const evmContractCallInfo = await getEVMTokenContractInfo(
    info.fromChain,
    info.fromToken,
  )
  if (evmContractCallInfo == null || stacksContractCallInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const [step1TransferProphet, step2TransferProphet] = await Promise.all([
    getEvm2StacksFeeInfo(
      {
        network: stacksContractCallInfo.network,
        endpointDeployerAddress: stacksContractCallInfo.deployerAddress,
      },
      {
        client: evmContractCallInfo.client,
        bridgeContractAddress:
          evmContractCallInfo.bridgeEndpointContractAddress,
      },
      evmContractCallInfo.tokenContractAddress,
    ),
    getStacks2BtcFeeInfo({
      network: stacksContractCallInfo.network,
      endpointDeployerAddress: stacksContractCallInfo.deployerAddress,
    }),
  ])
  if (step1TransferProphet == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const composed = composeTransferProphet2(
    step1TransferProphet,
    step2TransferProphet,
  )

  return {
    isPaused: composed.isPaused,
    feeToken: info.fromToken as TokenId,
    feeRate: toSDKNumberOrUndefined(composed.feeRate),
    minFeeAmount: toSDKNumberOrUndefined(composed.minFee),
    minBridgeAmount: toSDKNumberOrUndefined(composed.minAmount),
    maxBridgeAmount: toSDKNumberOrUndefined(composed.maxAmount),

    // For debugging
    // @ts-ignore
    _transferProphets: [step1TransferProphet, step2TransferProphet],
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
  const stacksChain = KnownChainId.isEVMMainnetChain(info.fromChain)
    ? KnownChainId.Stacks.Mainnet
    : KnownChainId.Stacks.Testnet
  const evmContractCallInfo = await getEVMTokenContractInfo(
    info.fromChain,
    info.fromToken,
  )
  const transitStacksToken = await toCorrespondingStacksCurrency(info.fromToken)
  const transitStacksContractCallInfo =
    transitStacksToken == null
      ? undefined
      : getStacksTokenContractInfo(stacksChain, transitStacksToken)
  if (
    evmContractCallInfo == null ||
    transitStacksToken == null ||
    transitStacksContractCallInfo == null
  ) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const [step1TransferProphet, step2TransferProphet] = await Promise.all([
    getEvm2StacksFeeInfo(
      {
        network: transitStacksContractCallInfo.network,
        endpointDeployerAddress: transitStacksContractCallInfo.deployerAddress,
      },
      {
        client: evmContractCallInfo.client,
        bridgeContractAddress:
          evmContractCallInfo.bridgeEndpointContractAddress,
      },
      evmContractCallInfo.tokenContractAddress,
    ),
    getStacks2EvmFeeInfo(
      {
        network: transitStacksContractCallInfo.network,
        endpointDeployerAddress: transitStacksContractCallInfo.deployerAddress,
      },
      {
        toChainId: contractAssignedChainIdFromBridgeChain(info.toChain),
        stacksToken: transitStacksContractCallInfo,
      },
    ),
  ])
  if (step1TransferProphet == null || step2TransferProphet == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const composed = composeTransferProphet2(
    step1TransferProphet,
    step2TransferProphet,
  )

  return {
    isPaused: composed.isPaused,
    feeToken: info.fromToken as TokenId,
    feeRate: toSDKNumberOrUndefined(composed.feeRate),
    minFeeAmount: toSDKNumberOrUndefined(composed.minFee),
    minBridgeAmount: toSDKNumberOrUndefined(composed.minAmount),
    maxBridgeAmount: toSDKNumberOrUndefined(composed.maxAmount),

    // For debugging
    // @ts-ignore
    _transferProphets: [step1TransferProphet, step2TransferProphet],
  }
}
