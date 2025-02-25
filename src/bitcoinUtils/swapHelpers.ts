import {
  evmTokenFromCorrespondingStacksToken,
  getStacks2EvmFeeInfo,
} from "../evmUtils/peggingHelpers"
import { getEVMTokenContractInfo } from "../evmUtils/xlinkContractHelpers"
import { KnownRoute_FromBitcoin } from "../lowlevelUnstableInfos"
import { getStacksTokenContractInfo } from "../stacksUtils/xlinkContractHelpers"
import { hasAny, last } from "../utils/arrayHelpers"
import { BigNumber } from "../utils/BigNumber"
import {
  applyTransferProphet,
  applyTransferProphets,
} from "../utils/feeRateHelpers"
import { toCorrespondingStacksToken } from "../utils/SwapRouteHelpers"
import { isNotNull } from "../utils/typeHelpers"
import { KnownChainId, KnownTokenId } from "../utils/types/knownIds"
import { EVMAddress } from "../xlinkSdkUtils/types"
import { SDKGlobalContext } from "../xlinkSdkUtils/types.internal"
import { getBtc2StacksFeeInfo } from "./peggingHelpers"

export async function getALEXSwapParameters_FromBitcoin(
  sdkContext: SDKGlobalContext,
  info: KnownRoute_FromBitcoin & {
    amount: BigNumber
  },
): Promise<
  | undefined
  | {
      stacksChain: KnownChainId.StacksChain
      fromToken: KnownTokenId.StacksToken
      toToken: KnownTokenId.StacksToken
      fromAmount: BigNumber
    }
> {
  const transitStacksChain =
    info.fromChain === KnownChainId.Bitcoin.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet

  const [firstStepToStacksToken, lastStepFromStacksToken] = await Promise.all([
    toCorrespondingStacksToken(sdkContext, info.fromChain, info.fromToken),
    toCorrespondingStacksToken(sdkContext, info.toChain, info.toToken),
  ])
  if (firstStepToStacksToken == null || lastStepFromStacksToken == null) return

  const [fromToken, toToken, feeInfo] = await Promise.all([
    getStacksTokenContractInfo(
      sdkContext,
      transitStacksChain,
      firstStepToStacksToken,
    ),
    getStacksTokenContractInfo(
      sdkContext,
      transitStacksChain,
      lastStepFromStacksToken,
    ),
    getBtc2StacksFeeInfo(
      {
        fromChain: info.fromChain,
        fromToken: info.fromToken,
        toChain: transitStacksChain,
        toToken: firstStepToStacksToken,
      },
      { swapRoute: { via: "ALEX" } },
    ),
  ])

  if (fromToken == null || toToken == null || feeInfo == null) return

  const fromAmount = applyTransferProphet(
    feeInfo,
    BigNumber.from(info.amount),
  ).netAmount

  return {
    stacksChain: transitStacksChain,
    fromToken: firstStepToStacksToken,
    toToken: lastStepFromStacksToken,
    fromAmount,
  }
}

export async function getEVMDexAggregatorSwapParameters_FromBitcoin(
  sdkContext: SDKGlobalContext,
  info: KnownRoute_FromBitcoin & {
    amount: BigNumber
  },
): Promise<
  | undefined
  | {
      evmChain: KnownChainId.EVMChain
      fromToken: KnownTokenId.EVMToken
      toToken: KnownTokenId.EVMToken
      fromAmount: BigNumber
    }
> {
  const transitStacksChain =
    info.fromChain === KnownChainId.Bitcoin.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet
  const swapOnEVMChain = KnownChainId.EVM.Linea

  /**
   * currently we only support:
   *
   *  * bitcoin chain
   *  * most mainnet
   */
  if (
    !(
      KnownChainId.Bitcoin.Mainnet === info.fromChain &&
      (KnownChainId.isEVMMainnetChain(info.toChain) ||
        KnownChainId.Stacks.Mainnet === info.toChain ||
        KnownChainId.BRC20.Mainnet === info.toChain ||
        KnownChainId.Runes.Mainnet === info.toChain)
    )
  ) {
    return
  }

  const [firstStepToStacksToken, lastStepFromStacksToken] = await Promise.all([
    toCorrespondingStacksToken(sdkContext, info.fromChain, info.fromToken),
    toCorrespondingStacksToken(sdkContext, info.toChain, info.toToken),
  ])
  if (firstStepToStacksToken == null || lastStepFromStacksToken == null) return

  const getTokensDetail = async (
    tokens: KnownTokenId.EVMToken[],
  ): Promise<
    {
      token: KnownTokenId.EVMToken
      address: EVMAddress
    }[]
  > => {
    const _contractInfos = await Promise.all(
      tokens.map(token =>
        getEVMTokenContractInfo(sdkContext, swapOnEVMChain, token).then(res =>
          res == null ? null : { token, address: res.tokenContractAddress },
        ),
      ),
    )
    return _contractInfos.filter(isNotNull)
  }
  const [fromTokens, toTokens] = await Promise.all([
    evmTokenFromCorrespondingStacksToken(
      sdkContext,
      swapOnEVMChain,
      firstStepToStacksToken,
    ).then(getTokensDetail),
    evmTokenFromCorrespondingStacksToken(
      sdkContext,
      swapOnEVMChain,
      lastStepFromStacksToken,
    ).then(getTokensDetail),
  ])
  if (!hasAny(fromTokens) || !hasAny(toTokens)) return

  const _feeInfos = await Promise.all([
    getBtc2StacksFeeInfo(
      {
        fromChain: info.fromChain,
        fromToken: info.fromToken,
        toChain: transitStacksChain,
        toToken: firstStepToStacksToken,
      },
      { swapRoute: { via: "evmDexAggregator" } },
    ),
    getStacks2EvmFeeInfo(
      sdkContext,
      {
        fromChain: transitStacksChain,
        fromToken: firstStepToStacksToken,
        toChain: swapOnEVMChain,
        toToken: fromTokens[0].token,
      },
      { toDexAggregator: true },
    ),
  ])
  const feeInfos = _feeInfos.filter(isNotNull)

  if (feeInfos.length !== _feeInfos.length || !hasAny(feeInfos)) return

  const fromAmount = last(
    applyTransferProphets(feeInfos, BigNumber.from(info.amount)),
  ).netAmount

  return {
    evmChain: swapOnEVMChain,
    fromToken: fromTokens[0].token,
    toToken: toTokens[0].token,
    fromAmount,
  }
}
