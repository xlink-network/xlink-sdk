/**
 * @experimental these APIs are not stable and may change in the future, and are
 *   not covered by semantic versioning. Please use them at your own risk.
 */

import {
  evmTokenFromCorrespondingStacksToken,
  evmTokenToCorrespondingStacksToken,
} from "./evmUtils/peggingHelpers"
import {
  metaTokenFromCorrespondingStacksToken,
  metaTokenToCorrespondingStacksToken,
} from "./metaUtils/peggingHelpers"
import { KnownChainId, KnownTokenId } from "./utils/types/knownIds"
import { SDKGlobalContext } from "./xlinkSdkUtils/types.internal"

export {
  contractAssignedChainIdFromKnownChain,
  contractAssignedChainIdToKnownChain,
} from "./stacksUtils/crossContractDataMapping"

export {
  getEVMTokenIdFromTerminatingStacksTokenContractAddress,
  getTerminatingStacksTokenContractAddress,
} from "./stacksUtils/stxContractAddresses"

export { isSupportedMetaRoute } from "./metaUtils/peggingHelpers"
export {
  bridgeInfoFromMeta,
  BridgeInfoFromMetaInput,
  BridgeInfoFromMetaOutput,
} from "./xlinkSdkUtils/bridgeInfoFromMeta"

export {
  brc20TokenFromTick,
  brc20TokenToTick,
  runesTokenFromId,
  runesTokenToId,
} from "./metaUtils/tokenAddresses"

export { addressFromBuffer, addressToBuffer } from "./utils/addressHelpers"

export {
  BridgeSwapRouteNode,
  CreateBridgeOrderResult,
  createBridgeOrderFromBitcoin,
} from "./stacksUtils/createBridgeOrderFromBitcoin"
export { bridgeFromEVM_toLaunchpad } from "./xlinkSdkUtils/bridgeFromEVM"

export const getXLinkSDKContext = (
  sdk: import("./XLinkSDK").XLinkSDK,
): SDKGlobalContext => {
  return sdk["sdkContext"]
}

export const evmTokensFromStacksToken = async (options: {
  toEVMChain: KnownChainId.EVMChain
  fromStacksToken: KnownTokenId.StacksToken
}): Promise<{
  evmTokens: KnownTokenId.EVMToken[]
}> => {
  const evmTokens = await evmTokenFromCorrespondingStacksToken(
    options.toEVMChain,
    options.fromStacksToken,
  )
  return { evmTokens }
}
export const evmTokenToStacksToken = async (options: {
  toStacksChain: KnownChainId.StacksChain
  fromEVMToken: KnownTokenId.EVMToken
}): Promise<{
  stacksTokens: KnownTokenId.StacksToken[]
}> => {
  const stacksTokens = await evmTokenToCorrespondingStacksToken(
    options.fromEVMToken,
  )
  return { stacksTokens: stacksTokens == null ? [] : [stacksTokens] }
}

export const metaTokensFromStacksToken = async (
  sdk: import("./XLinkSDK").XLinkSDK,
  options: {
    fromStacksToken: KnownTokenId.StacksToken
    toChain: KnownChainId.BRC20Chain | KnownChainId.RunesChain
  },
): Promise<{
  tokens: (KnownTokenId.BRC20Token | KnownTokenId.RunesToken)[]
}> => {
  const metaTokens = await metaTokenFromCorrespondingStacksToken(
    getXLinkSDKContext(sdk),
    options.toChain,
    options.fromStacksToken,
  )
  return { tokens: metaTokens == null ? [] : [metaTokens as any] }
}
export const metaTokenToStacksToken = async (
  sdk: import("./XLinkSDK").XLinkSDK,
  options: {
    fromChain: KnownChainId.BRC20Chain | KnownChainId.RunesChain
    fromToken: KnownTokenId.BRC20Token | KnownTokenId.RunesToken
    toStacksChain: KnownChainId.StacksChain
  },
): Promise<{
  stacksTokens: KnownTokenId.StacksToken[]
}> => {
  const stacksTokens = await metaTokenToCorrespondingStacksToken(
    getXLinkSDKContext(sdk),
    {
      chain: options.fromChain as any,
      token: options.fromToken as any,
    },
  )
  return { stacksTokens: stacksTokens == null ? [] : [stacksTokens] }
}
