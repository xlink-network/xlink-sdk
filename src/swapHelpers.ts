import {
  getALEXSwapParameters_FromBitcoin,
  getPossibleEVMDexAggregatorSwapParameters_FromBitcoin,
} from "./bitcoinUtils/swapHelpers"
import { getALEXSwapParameters_FromEVM } from "./evmUtils/swapHelpers"
import { getXLinkSDKContext } from "./lowlevelUnstableInfos"
import {
  getALEXSwapParameters_FromMeta,
  getPossibleEVMDexAggregatorSwapParameters_FromMeta,
} from "./metaUtils/swapHelpers"
import { BigNumber } from "./utils/BigNumber"
import { KnownRoute } from "./utils/buildSupportedRoutes"
import { ALEXSwapParameters as _ALEXSwapParameters } from "./utils/swapHelpers/alexSwapParametersHelpers"
import { EVMDexAggregatorSwapParameters as _EVMDexAggregatorSwapParameters } from "./utils/swapHelpers/evmDexAggregatorSwapParametersHelpers"
import { FetchRoutesImpl } from "./utils/swapHelpers/fetchDexAggregatorPossibleRoutes/helpers"
import {
  DexAggregatorRoute as _DexAggregatorRoute,
  getDexAggregatorRoutes as _getDexAggregatorRoutes,
} from "./utils/swapHelpers/getDexAggregatorRoutes"
import { checkNever } from "./utils/typeHelpers"
import { KnownChainId, KnownTokenId } from "./utils/types/knownIds"
import { XLinkSDK } from "./XLinkSDK"
import { SDKNumber, toSDKNumberOrUndefined } from "./sdkUtils/types"

export interface ALEXSwapParameters
  extends Omit<_ALEXSwapParameters, "fromAmount"> {
  fromAmount: SDKNumber
}
/**
 * This function retrieves the necessary parameters for performing an ALEX swap.
 * It provides the required details to proceed with an ALEX swap, such as the
 * tokens involved, and the amount to be swapped.
 *
 * @param sdk - The XLinkSDK instance
 * @param info - The entire bridging route
 */
export async function getALEXSwapParameters(
  sdk: XLinkSDK,
  info: KnownRoute & {
    amount: SDKNumber
  },
): Promise<undefined | ALEXSwapParameters> {
  let params: undefined | _ALEXSwapParameters

  if (KnownChainId.isStacksChain(info.fromChain)) {
    return
  } else if (KnownChainId.isEVMChain(info.fromChain)) {
    if (!KnownTokenId.isEVMToken(info.fromToken)) return
    params = await getALEXSwapParameters_FromEVM(getXLinkSDKContext(sdk), {
      fromChain: info.fromChain,
      fromToken: info.fromToken,
      toChain: info.toChain as any,
      toToken: info.toToken as any,
      amount: BigNumber.from(info.amount),
    })
  } else if (KnownChainId.isBitcoinChain(info.fromChain)) {
    if (!KnownTokenId.isBitcoinToken(info.fromToken)) return
    params = await getALEXSwapParameters_FromBitcoin(getXLinkSDKContext(sdk), {
      fromChain: info.fromChain,
      fromToken: info.fromToken,
      toChain: info.toChain as any,
      toToken: info.toToken as any,
      amount: BigNumber.from(info.amount),
    })
  } else if (KnownChainId.isBRC20Chain(info.fromChain)) {
    if (!KnownTokenId.isBRC20Token(info.fromToken)) return
    params = await getALEXSwapParameters_FromMeta(getXLinkSDKContext(sdk), {
      fromChain: info.fromChain,
      fromToken: info.fromToken,
      toChain: info.toChain as any,
      toToken: info.toToken as any,
      amount: BigNumber.from(info.amount),
    })
  } else if (KnownChainId.isRunesChain(info.fromChain)) {
    if (!KnownTokenId.isRunesToken(info.fromToken)) return
    params = await getALEXSwapParameters_FromMeta(getXLinkSDKContext(sdk), {
      fromChain: info.fromChain,
      fromToken: info.fromToken,
      toChain: info.toChain as any,
      toToken: info.toToken as any,
      amount: BigNumber.from(info.amount),
    })
  } else {
    checkNever(info.fromChain)
  }

  if (params == null) return

  return {
    ...params,
    fromAmount: toSDKNumberOrUndefined(params.fromAmount),
  }
}

export interface EVMDexAggregatorSwapParameters
  extends Omit<_EVMDexAggregatorSwapParameters, "fromAmount"> {
  fromAmount: SDKNumber
}
/**
 * Retrieves the parameters for a swap via an EVM DEX aggregator.
 *
 * This function calculates and returns the necessary parameters for executing
 * a swap through the aggregator
 *
 * @param sdk - The XLinkSDK instance used for interacting with the blockchain.
 * @param info - The entire bridging route
 */
export async function getPossibleEVMDexAggregatorSwapParameters(
  sdk: XLinkSDK,
  info: KnownRoute & {
    amount: SDKNumber
  },
): Promise<EVMDexAggregatorSwapParameters[]> {
  if (KnownChainId.isStacksChain(info.fromChain)) {
    return []
  }

  if (KnownChainId.isEVMChain(info.fromChain)) {
    return []
  }

  if (KnownChainId.isBitcoinChain(info.fromChain)) {
    if (!KnownTokenId.isBitcoinToken(info.fromToken)) return []

    const res = await getPossibleEVMDexAggregatorSwapParameters_FromBitcoin(
      getXLinkSDKContext(sdk),
      {
        fromChain: info.fromChain,
        fromToken: info.fromToken,
        toChain: info.toChain as any,
        toToken: info.toToken as any,
        amount: BigNumber.from(info.amount),
      },
    )
    if (res == null) return []

    return res.map(
      (r): EVMDexAggregatorSwapParameters => ({
        ...r,
        fromAmount: toSDKNumberOrUndefined(r.fromAmount),
      }),
    )
  }

  if (KnownChainId.isBRC20Chain(info.fromChain)) {
    if (!KnownTokenId.isBRC20Token(info.fromToken)) return []

    const res = await getPossibleEVMDexAggregatorSwapParameters_FromMeta(
      getXLinkSDKContext(sdk),
      {
        fromChain: info.fromChain,
        fromToken: info.fromToken,
        toChain: info.toChain as any,
        toToken: info.toToken as any,
        amount: BigNumber.from(info.amount),
      },
    )
    if (res == null) return []

    return res.map(
      (r): EVMDexAggregatorSwapParameters => ({
        ...r,
        fromAmount: toSDKNumberOrUndefined(r.fromAmount),
      }),
    )
  }

  if (KnownChainId.isRunesChain(info.fromChain)) {
    if (!KnownTokenId.isRunesToken(info.fromToken)) return []

    const res = await getPossibleEVMDexAggregatorSwapParameters_FromMeta(
      getXLinkSDKContext(sdk),
      {
        fromChain: info.fromChain,
        fromToken: info.fromToken,
        toChain: info.toChain as any,
        toToken: info.toToken as any,
        amount: BigNumber.from(info.amount),
      },
    )
    if (res == null) return []

    return res.map(
      (r): EVMDexAggregatorSwapParameters => ({
        ...r,
        fromAmount: toSDKNumberOrUndefined(r.fromAmount),
      }),
    )
  }

  checkNever(info.fromChain)
  return []
}

export { FetchRoutesImpl } from "./utils/swapHelpers/fetchDexAggregatorPossibleRoutes/helpers"
export {
  fetchIceScreamSwapPossibleRoutesFactory,
  FetchIceScreamSwapPossibleRoutesFailedError,
} from "./utils/swapHelpers/fetchDexAggregatorPossibleRoutes/fetchIceScreamSwapPossibleRoutes"
export {
  fetchMatchaPossibleRoutesFactory,
  FetchMatchaPossibleRoutesFailedError,
} from "./utils/swapHelpers/fetchDexAggregatorPossibleRoutes/fetchMatchaPossibleRoutes"
export {
  fetchKyberSwapPossibleRoutesFactory,
  FetchKyberSwapPossibleRoutesFailedError,
} from "./utils/swapHelpers/fetchDexAggregatorPossibleRoutes/fetchKyberSwapPossibleRoutes"
export interface DexAggregatorRoute
  extends Omit<_DexAggregatorRoute, "fromAmount" | "toAmount" | "slippage"> {
  fromAmount: SDKNumber
  toAmount: SDKNumber
  slippage: SDKNumber
}
export function getDexAggregatorRoutes(
  sdk: XLinkSDK,
  info: {
    routeFetcher: FetchRoutesImpl
    routes: {
      evmChain: KnownChainId.EVMChain
      fromToken: KnownTokenId.EVMToken
      toToken: KnownTokenId.EVMToken
      amount: SDKNumber
      slippage: SDKNumber
    }[]
  },
): Promise<DexAggregatorRoute[]> {
  return _getDexAggregatorRoutes(getXLinkSDKContext(sdk), {
    routeFetcher: info.routeFetcher,
    routes: info.routes.map(r => ({
      evmChain: r.evmChain,
      fromToken: r.fromToken,
      toToken: r.toToken,
      amount: BigNumber.from(r.amount),
      slippage: BigNumber.from(r.slippage),
    })),
  }).then(res =>
    res.map(r => ({
      ...r,
      fromAmount: toSDKNumberOrUndefined(r.fromAmount),
      toAmount: toSDKNumberOrUndefined(r.toAmount),
      slippage: toSDKNumberOrUndefined(r.slippage),
    })),
  )
}
