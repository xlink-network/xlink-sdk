import { BigNumber } from "../utils/BigNumber"
import {
  KnownRoute_FromBRC20,
  KnownRoute_FromMeta,
} from "../utils/buildSupportedRoutes"
import {
  ALEXSwapParameters,
  getALEXSwapParametersImpl,
} from "../utils/swapHelpers/alexSwapParametersHelpers"
import {
  EVMDexAggregatorSwapParameters,
  getPossibleEVMDexAggregatorSwapParametersImpl,
} from "../utils/swapHelpers/evmDexAggregatorSwapParametersHelpers"
import { SDKGlobalContext } from "../xlinkSdkUtils/types.internal"
import { getMeta2StacksFeeInfo } from "./peggingHelpers"

export async function getALEXSwapParameters_FromMeta(
  sdkContext: SDKGlobalContext,
  info: KnownRoute_FromMeta & {
    amount: BigNumber
  },
): Promise<undefined | ALEXSwapParameters> {
  return getALEXSwapParametersImpl(sdkContext, {
    ...info,
    getInitialToStacksTransferProphet: ctx =>
      getMeta2StacksFeeInfo(
        sdkContext,
        {
          fromChain: info.fromChain as any,
          fromToken: info.fromToken,
          toChain: ctx.transitStacksChain,
          toToken: ctx.firstStepToStacksToken,
        },
        { swapRoute: { via: "ALEX" } },
      ),
  })
}

export async function getPossibleEVMDexAggregatorSwapParameters_FromBRC20(
  sdkContext: SDKGlobalContext,
  info: KnownRoute_FromBRC20 & {
    amount: BigNumber
  },
): Promise<EVMDexAggregatorSwapParameters[]> {
  return getPossibleEVMDexAggregatorSwapParametersImpl(sdkContext, {
    ...info,
    getInitialToStacksTransferProphet: ctx =>
      getMeta2StacksFeeInfo(
        sdkContext,
        {
          fromChain: info.fromChain,
          fromToken: info.fromToken,
          toChain: ctx.transitStacksChain,
          toToken: ctx.firstStepToStacksToken,
        },
        { swapRoute: { via: "evmDexAggregator" } },
      ),
  })
}
