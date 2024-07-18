import { getBtc2StacksFeeInfo } from "../bitcoinUtils/peggingHelpers"
import { getStacks2EvmFeeInfo } from "../evmUtils/peggingHelpers"
import { contractAssignedChainIdFromBridgeChain } from "../stacksUtils/crossContractDataMapping"
import {
  getStacksContractCallInfo,
  getStacksTokenContractInfo,
} from "../stacksUtils/xlinkContractHelpers"
import { GetSupportedRoutesFnAnyResult } from "../utils/buildSupportedRoutes"
import { UnsupportedBridgeRouteError } from "../utils/errors"
import { composeTransferProphet2 } from "../utils/feeRateHelpers"
import { assertExclude, checkNever } from "../utils/typeHelpers"
import { KnownChainId, KnownTokenId } from "../utils/types.internal"
import { supportedRoutes } from "./bridgeFromBitcoin"
import { ChainId, SDKNumber, TokenId, toSDKNumberOrUndefined } from "./types"

export interface BridgeInfoFromBitcoinInput {
  fromChain: ChainId
  toChain: ChainId
  amount: SDKNumber
}

export interface BridgeInfoFromBitcoinOutput {
  isPaused: boolean
  feeToken: TokenId
  feeRate: SDKNumber
  minFeeAmount: SDKNumber
  minBridgeAmount: null | SDKNumber
  maxBridgeAmount: null | SDKNumber
}

export const bridgeInfoFromBitcoin = async (
  info: BridgeInfoFromBitcoinInput,
): Promise<BridgeInfoFromBitcoinOutput> => {
  const res: GetSupportedRoutesFnAnyResult =
    await supportedRoutes.getSupportedTokens(info.fromChain, info.toChain)
  if (res.length <= 0) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
    )
  }

  const fromChain = info.fromChain as KnownChainId.AllChain
  const toChain = info.toChain as KnownChainId.AllChain

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
  const contractCallInfo = getStacksContractCallInfo(info.toChain)
  if (contractCallInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
    )
  }

  const feeInfo = await getBtc2StacksFeeInfo({
    network: contractCallInfo.network,
    endpointDeployerAddress: contractCallInfo.deployerAddress,
  })

  return {
    isPaused: feeInfo.isPaused,
    feeToken: KnownTokenId.Bitcoin.BTC as TokenId,
    feeRate: toSDKNumberOrUndefined(feeInfo.feeRate),
    minFeeAmount: toSDKNumberOrUndefined(feeInfo.minFee),
    minBridgeAmount: toSDKNumberOrUndefined(feeInfo.minAmount),
    maxBridgeAmount: toSDKNumberOrUndefined(feeInfo.maxAmount),
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
  const stacksContractCallInfo = getStacksTokenContractInfo(
    transitStacksChainId,
    KnownTokenId.Stacks.aBTC,
  )
  if (stacksContractCallInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
    )
  }

  const step1FeeInfo = await getBtc2StacksFeeInfo({
    network: stacksContractCallInfo.network,
    endpointDeployerAddress: stacksContractCallInfo.deployerAddress,
  })
  const step2FeeInfo = await getStacks2EvmFeeInfo(
    {
      network: stacksContractCallInfo.network,
      endpointDeployerAddress: stacksContractCallInfo.deployerAddress,
    },
    {
      toChainId: contractAssignedChainIdFromBridgeChain(info.toChain),
      stacksToken: stacksContractCallInfo,
    },
  )
  if (step2FeeInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
    )
  }

  const finalInfo = composeTransferProphet2(step1FeeInfo, step2FeeInfo)

  return {
    isPaused: finalInfo.isPaused,
    feeToken: KnownTokenId.Bitcoin.BTC as TokenId,
    feeRate: toSDKNumberOrUndefined(finalInfo.feeRate),
    minFeeAmount: toSDKNumberOrUndefined(finalInfo.minFee),
    minBridgeAmount: toSDKNumberOrUndefined(finalInfo.minAmount),
    maxBridgeAmount: toSDKNumberOrUndefined(finalInfo.maxAmount),

    // for debugging
    // @ts-ignore
    _transferProphets: finalInfo.transferProphets,
  }
}
