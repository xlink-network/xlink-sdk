import { getStacksTokenContractInfo } from "../../stacksUtils/xlinkContractHelpers"
import { SDKGlobalContext } from "../../xlinkSdkUtils/types.internal"
import { BigNumber } from "../BigNumber"
import { KnownRoute_WithMetaProtocol } from "../buildSupportedRoutes"
import { applyTransferProphet } from "../feeRateHelpers"
import { toCorrespondingStacksToken } from "../SwapRouteHelpers"
import {
  KnownChainId,
  KnownTokenId,
  getChainIdNetworkType,
} from "../types/knownIds"
import { TransferProphet } from "../types/TransferProphet"

export interface ALEXSwapParameters {
  stacksChain: KnownChainId.StacksChain
  fromToken: KnownTokenId.StacksToken
  toToken: KnownTokenId.StacksToken
  fromAmount: BigNumber
}

export async function getALEXSwapParametersImpl(
  sdkContext: SDKGlobalContext,
  info: KnownRoute_WithMetaProtocol & {
    amount: BigNumber
    getInitialToStacksTransferProphet: (info: {
      transitStacksChain: KnownChainId.StacksChain
      firstStepToStacksToken: KnownTokenId.StacksToken
    }) => Promise<undefined | TransferProphet>
  },
): Promise<undefined | ALEXSwapParameters> {
  const transitStacksChain =
    getChainIdNetworkType(info.fromChain) === "mainnet"
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
    info.getInitialToStacksTransferProphet({
      transitStacksChain,
      firstStepToStacksToken,
    }),
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
