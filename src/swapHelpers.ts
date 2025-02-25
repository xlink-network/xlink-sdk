import {
  getALEXSwapParameters_FromBitcoin,
  getEVMDexAggregatorSwapParameters_FromBitcoin,
} from "./bitcoinUtils/swapHelpers"
import { getXLinkSDKContext } from "./lowlevelUnstableInfos"
import { BigNumber } from "./utils/BigNumber"
import { KnownRoute_WithMetaProtocol } from "./utils/buildSupportedRoutes"
import { checkNever } from "./utils/typeHelpers"
import { KnownChainId, KnownTokenId } from "./utils/types/knownIds"
import { XLinkSDK } from "./XLinkSDK"
import { SDKNumber, toSDKNumberOrUndefined } from "./xlinkSdkUtils/types"

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
  info: KnownRoute_WithMetaProtocol & {
    amount: SDKNumber
  },
): Promise<
  | undefined
  | {
      stacksChain: KnownChainId.StacksChain
      fromToken: KnownTokenId.StacksToken
      toToken: KnownTokenId.StacksToken
      fromAmount: SDKNumber
    }
> {
  if (KnownChainId.isStacksChain(info.fromChain)) {
    return
  }

  if (KnownChainId.isEVMChain(info.fromChain)) {
    return
  }

  if (KnownChainId.isBitcoinChain(info.fromChain)) {
    if (!KnownTokenId.isBitcoinToken(info.fromToken)) return

    const res = await getALEXSwapParameters_FromBitcoin(
      getXLinkSDKContext(sdk),
      {
        fromChain: info.fromChain,
        fromToken: info.fromToken,
        toChain: info.toChain as any,
        toToken: info.toToken as any,
        amount: BigNumber.from(info.amount),
      },
    )
    if (res == null) return

    return {
      ...res,
      fromAmount: toSDKNumberOrUndefined(res.fromAmount),
    }
  }

  if (KnownChainId.isRunesChain(info.fromChain)) {
    return
  }

  if (KnownChainId.isBRC20Chain(info.fromChain)) {
    return
  }

  checkNever(info.fromChain)
  return
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
export async function getEVMDexAggregatorSwapParameters(
  sdk: XLinkSDK,
  info: KnownRoute_WithMetaProtocol & {
    amount: SDKNumber
  },
): Promise<
  | undefined
  | {
      evmChain: KnownChainId.EVMChain
      fromToken: KnownTokenId.EVMToken
      toToken: KnownTokenId.EVMToken
      fromAmount: SDKNumber
    }
> {
  if (KnownChainId.isStacksChain(info.fromChain)) {
    return
  }

  if (KnownChainId.isEVMChain(info.fromChain)) {
    return
  }

  if (KnownChainId.isBitcoinChain(info.fromChain)) {
    if (!KnownTokenId.isBitcoinToken(info.fromToken)) return

    const res = await getEVMDexAggregatorSwapParameters_FromBitcoin(
      getXLinkSDKContext(sdk),
      {
        fromChain: info.fromChain,
        fromToken: info.fromToken,
        toChain: info.toChain as any,
        toToken: info.toToken as any,
        amount: BigNumber.from(info.amount),
      },
    )
    if (res == null) return

    return {
      ...res,
      fromAmount: toSDKNumberOrUndefined(res.fromAmount),
    }
  }

  if (KnownChainId.isRunesChain(info.fromChain)) {
    return
  }

  if (KnownChainId.isBRC20Chain(info.fromChain)) {
    return
  }

  checkNever(info.fromChain)
  return
}
