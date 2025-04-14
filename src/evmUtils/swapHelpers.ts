import { BigNumber } from "../utils/BigNumber"
import { KnownRoute_FromEVM } from "../utils/buildSupportedRoutes"
import {
  ALEXSwapParameters,
  getALEXSwapParametersImpl,
} from "../utils/swapHelpers/alexSwapParametersHelpers"
import { SDKGlobalContext } from "../xlinkSdkUtils/types.internal"
import { getEvm2StacksFeeInfo } from "./peggingHelpers"

export async function getALEXSwapParameters_FromEVM(
  sdkContext: SDKGlobalContext,
  info: KnownRoute_FromEVM & {
    amount: BigNumber
  },
): Promise<undefined | ALEXSwapParameters> {
  return getALEXSwapParametersImpl(sdkContext, {
    ...info,
    getInitialToStacksTransferProphet: ctx =>
      getEvm2StacksFeeInfo(sdkContext, {
        fromChain: info.fromChain as any,
        fromToken: info.fromToken,
        toChain: ctx.transitStacksChain,
        toToken: ctx.firstStepToStacksToken,
      }),
  })
}
