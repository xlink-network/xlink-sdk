import {
  evmTokenFromCorrespondingStacksToken,
  getEvm2StacksFeeInfo,
  getStacks2EvmFeeInfo,
} from "../evmUtils/peggingHelpers"
import { getEVMTokenContractInfo } from "../evmUtils/xlinkContractHelpers"
import { KnownRoute_FromBitcoin } from "../lowlevelUnstableInfos"
import { hasAny, last } from "../utils/arrayHelpers"
import { BigNumber } from "../utils/BigNumber"
import { applyTransferProphets } from "../utils/feeRateHelpers"
import {
  EVMDexAggregatorSwapParameters,
  possibleSwapOnEVMChains,
} from "../utils/swapHelpers/evmDexAggregatorSwapParametersHelpers"
import {
  ALEXSwapParameters,
  getALEXSwapParametersImpl,
} from "../utils/swapHelpers/alexSwapParametersHelpers"
import { toCorrespondingStacksToken } from "../utils/SwapRouteHelpers"
import { isNotNull } from "../utils/typeHelpers"
import { KnownChainId, KnownTokenId } from "../utils/types/knownIds"
import { TransferProphet } from "../utils/types/TransferProphet"
import { SDKGlobalContext } from "../xlinkSdkUtils/types.internal"
import { getBtc2StacksFeeInfo } from "./peggingHelpers"
import { evmNativeCurrencyAddress } from "../xlinkSdkUtils/types"

export async function getALEXSwapParameters_FromBitcoin(
  sdkContext: SDKGlobalContext,
  info: KnownRoute_FromBitcoin & {
    amount: BigNumber
  },
): Promise<undefined | ALEXSwapParameters> {
  return getALEXSwapParametersImpl(sdkContext, {
    ...info,
    getInitialToStacksTransferProphet: ctx =>
      getBtc2StacksFeeInfo(
        {
          fromChain: info.fromChain,
          fromToken: info.fromToken,
          toChain: ctx.transitStacksChain,
          toToken: ctx.firstStepToStacksToken,
        },
        { swapRoute: { via: "ALEX" } },
      ),
  })
}

export async function getPossibleEVMDexAggregatorSwapParameters_FromBitcoin(
  sdkContext: SDKGlobalContext,
  info: KnownRoute_FromBitcoin & {
    amount: BigNumber
  },
): Promise<EVMDexAggregatorSwapParameters[]> {
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
    return []
  }

  const transitStacksChain =
    info.fromChain === KnownChainId.Bitcoin.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet

  const [firstStepToStacksToken, lastStepFromStacksToken] = await Promise.all([
    toCorrespondingStacksToken(sdkContext, info.fromChain, info.fromToken),
    toCorrespondingStacksToken(sdkContext, info.toChain, info.toToken),
  ])
  if (firstStepToStacksToken == null || lastStepFromStacksToken == null) {
    return []
  }

  const bitcoin2StacksTransferProphet = await getBtc2StacksFeeInfo(
    {
      fromChain: info.fromChain,
      fromToken: info.fromToken,
      toChain: transitStacksChain,
      toToken: firstStepToStacksToken,
    },
    { swapRoute: { via: "evmDexAggregator" } },
  )
  if (
    bitcoin2StacksTransferProphet == null ||
    bitcoin2StacksTransferProphet.isPaused
  ) {
    return []
  }

  return Promise.all(
    possibleSwapOnEVMChains.map(async evmChain =>
      _getEVMDexAggregatorSwapParameters_FromBitcoin(sdkContext, {
        initialToStacksTransferProphet: bitcoin2StacksTransferProphet,
        transitStacksChain,
        firstStepToStacksToken,
        lastStepFromStacksToken,
        evmChain,
        amount: info.amount,
      }),
    ),
  ).then(res => res.flat())
}
async function _getEVMDexAggregatorSwapParameters_FromBitcoin(
  sdkContext: SDKGlobalContext,
  info: {
    initialToStacksTransferProphet: TransferProphet
    transitStacksChain: KnownChainId.StacksChain
    firstStepToStacksToken: KnownTokenId.StacksToken
    lastStepFromStacksToken: KnownTokenId.StacksToken
    evmChain: KnownChainId.EVMChain
    amount: BigNumber
  },
): Promise<EVMDexAggregatorSwapParameters[]> {
  const {
    evmChain,
    transitStacksChain,
    firstStepToStacksToken,
    lastStepFromStacksToken,
  } = info

  const filterOutAvailableTokens = async (
    tokens: KnownTokenId.EVMToken[],
  ): Promise<KnownTokenId.EVMToken[]> => {
    return Promise.all(
      tokens.map(token =>
        getEVMTokenContractInfo(sdkContext, evmChain, token).then(res =>
          res == null || res.tokenContractAddress === evmNativeCurrencyAddress
            ? null
            : token,
        ),
      ),
    ).then(infos => infos.filter(isNotNull))
  }
  const [possibleFromTokens, possibleToTokens] = await Promise.all([
    evmTokenFromCorrespondingStacksToken(
      sdkContext,
      evmChain,
      firstStepToStacksToken,
    ).then(filterOutAvailableTokens),
    evmTokenFromCorrespondingStacksToken(
      sdkContext,
      evmChain,
      lastStepFromStacksToken,
    ).then(filterOutAvailableTokens),
  ])
  if (!hasAny(possibleFromTokens) || !hasAny(possibleToTokens)) return []

  const fromTokensWithTransferProphet = await Promise.all(
    possibleFromTokens.map(token =>
      getStacks2EvmFeeInfo(
        sdkContext,
        {
          fromChain: transitStacksChain,
          fromToken: firstStepToStacksToken,
          toChain: evmChain,
          toToken: token,
        },
        { toDexAggregator: true },
      ).then(info =>
        info == null || info.isPaused ? null : { token, transferProphet: info },
      ),
    ),
  ).then(infos => infos.filter(isNotNull))

  const toTokens = await Promise.all(
    possibleToTokens.map(token =>
      getEvm2StacksFeeInfo(sdkContext, {
        fromChain: evmChain,
        fromToken: token,
        toChain: transitStacksChain,
        toToken: lastStepFromStacksToken,
      }).then(info => (info == null || info.isPaused ? null : token)),
    ),
  ).then(tokens => tokens.filter(isNotNull))

  const results: EVMDexAggregatorSwapParameters[] = []
  for (const fromToken of fromTokensWithTransferProphet) {
    for (const toToken of toTokens) {
      const feeInfos = [
        info.initialToStacksTransferProphet,
        fromToken.transferProphet,
      ] as const
      const fromAmount = last(
        applyTransferProphets(feeInfos, BigNumber.from(info.amount)),
      ).netAmount
      results.push({
        evmChain,
        fromToken: fromToken.token,
        toToken,
        fromAmount,
      })
    }
  }
  return results
}
