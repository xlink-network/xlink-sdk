import { BigNumber } from "../utils/BigNumber"
import { _KnownRoute_FromMeta } from "../utils/buildSupportedRoutes"
import {
  ALEXSwapParameters,
  getALEXSwapParametersImpl
} from "../utils/swapHelpers/alexSwapParametersHelpers"
import { SDKGlobalContext } from "../xlinkSdkUtils/types.internal"
import { getMeta2StacksFeeInfo } from "./peggingHelpers"

export async function getALEXSwapParameters_FromMeta(
  sdkContext: SDKGlobalContext,
  info: _KnownRoute_FromMeta & {
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
