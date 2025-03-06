/**
 * @experimental these APIs are not stable and may change in the future, and are
 *   not covered by semantic versioning. Please use them at your own risk.
 */

import {
  getEVMTokenFromTerminatingStacksTokenContractAddress as _getEVMTokenFromTerminatingStacksTokenContractAddress,
  getStacksTokenFromTerminatingStacksTokenContractAddress as _getStacksTokenFromTerminatingStacksTokenContractAddress,
  getTerminatingStacksTokenContractAddress as _getTerminatingStacksTokenContractAddress,
  evmTokenFromCorrespondingStacksToken,
  evmTokenToCorrespondingStacksToken,
} from "./evmUtils/peggingHelpers"
import {
  metaTokenFromCorrespondingStacksToken,
  metaTokenToCorrespondingStacksToken,
} from "./metaUtils/peggingHelpers"
import { KnownChainId, KnownTokenId } from "./utils/types/knownIds"
import { StacksContractAddress } from "./xlinkSdkUtils/types"
import { SDKGlobalContext } from "./xlinkSdkUtils/types.internal"

export {
  contractAssignedChainIdFromKnownChain,
  contractAssignedChainIdToKnownChain,
} from "./stacksUtils/crossContractDataMapping"
export {
  alexContractDeployerMainnet,
  alexContractDeployerTestnet,
  alexContractMultisigMainnet,
  alexContractMultisigTestnet,
  legacyAlexContractDeployerMainnet,
  legacyAlexContractDeployerTestnet,
  wrapContractAddress,
  xlinkContractsDeployerMainnet,
  xlinkContractsDeployerTestnet,
  xlinkContractsMultisigMainnet,
  xlinkContractsMultisigTestnet,
} from "./stacksUtils/stxContractAddresses"

export { isSupportedMetaRoute } from "./metaUtils/peggingHelpers"

export {
  KnownRoute_FromBitcoin,
  KnownRoute_FromBitcoin_ToBRC20,
  KnownRoute_FromBitcoin_ToEVM,
  KnownRoute_FromBitcoin_ToRunes,
  KnownRoute_FromBitcoin_ToStacks,
  KnownRoute_FromBRC20,
  KnownRoute_FromBRC20_ToBitcoin,
  KnownRoute_FromBRC20_ToEVM,
  KnownRoute_FromBRC20_ToRunes,
  KnownRoute_FromBRC20_ToStacks,
  KnownRoute_FromEVM,
  KnownRoute_FromEVM_ToBitcoin,
  KnownRoute_FromEVM_ToBRC20,
  KnownRoute_FromEVM_ToEVM,
  KnownRoute_FromEVM_ToRunes,
  KnownRoute_FromEVM_ToStacks,
  KnownRoute_FromRunes,
  KnownRoute_FromRunes_ToBitcoin,
  KnownRoute_FromRunes_ToBRC20,
  KnownRoute_FromRunes_ToEVM,
  KnownRoute_FromRunes_ToStacks,
  KnownRoute_FromStacks,
  KnownRoute_FromStacks_ToBitcoin,
  KnownRoute_FromStacks_ToBRC20,
  KnownRoute_FromStacks_ToEVM,
  KnownRoute_FromStacks_ToRunes,
} from "./utils/buildSupportedRoutes"

export {
  brc20TokenFromTick,
  brc20TokenToTick,
  runesTokenFromId,
  runesTokenToId,
} from "./metaUtils/tokenAddresses"

export { addressFromBuffer, addressToBuffer } from "./utils/addressHelpers"

export {
  BridgeSwapRouteNode,
  createBridgeOrderFromBitcoin,
  CreateBridgeOrderResult,
} from "./stacksUtils/createBridgeOrderFromBitcoin"
export { createBridgeOrderFromMeta } from "./stacksUtils/createBridgeOrderFromMeta"
export { bridgeFromEVM_toLaunchpad } from "./xlinkSdkUtils/bridgeFromEVM"

export { bridgeInfoFromBitcoin_toLaunchpad } from "./xlinkSdkUtils/bridgeInfoFromBitcoin"
export { bridgeInfoFromEVM_toLaunchpad } from "./xlinkSdkUtils/bridgeInfoFromEVM"

export { getBitcoinHardLinkageAddress } from "./bitcoinUtils/btcAddresses"

export const getXLinkSDKContext = (
  sdk: import("./XLinkSDK").XLinkSDK,
): SDKGlobalContext => {
  return sdk["sdkContext"]
}

export const getTerminatingStacksTokenContractAddress = async (
  sdk: import("./XLinkSDK").XLinkSDK,
  info: {
    evmChain: KnownChainId.EVMChain
    evmToken: KnownTokenId.EVMToken
    stacksChain: KnownChainId.StacksChain
  },
): Promise<undefined | StacksContractAddress> => {
  return _getTerminatingStacksTokenContractAddress(
    getXLinkSDKContext(sdk),
    info,
  )
}
export const getStacksTokenFromTerminatingStacksTokenContractAddress = async (
  sdk: import("./XLinkSDK").XLinkSDK,
  info: {
    stacksChain: KnownChainId.StacksChain
    stacksTokenAddress: StacksContractAddress
  },
): Promise<undefined | KnownTokenId.StacksToken> => {
  return _getStacksTokenFromTerminatingStacksTokenContractAddress(
    getXLinkSDKContext(sdk),
    info,
  )
}
export const getEVMTokenIdFromTerminatingStacksTokenContractAddress = async (
  sdk: import("./XLinkSDK").XLinkSDK,
  info: {
    evmChain: KnownChainId.EVMChain
    stacksChain: KnownChainId.StacksChain
    stacksTokenAddress: StacksContractAddress
  },
): Promise<undefined | KnownTokenId.EVMToken> => {
  return _getEVMTokenFromTerminatingStacksTokenContractAddress(
    getXLinkSDKContext(sdk),
    info,
  )
}

export const evmTokensFromStacksToken = async (
  sdk: import("./XLinkSDK").XLinkSDK,
  options: {
    fromStacksChain: KnownChainId.StacksChain
    fromStacksToken: KnownTokenId.StacksToken
    toChain: KnownChainId.EVMChain
  },
): Promise<{
  evmTokens: KnownTokenId.EVMToken[]
}> => {
  const evmTokens = await evmTokenFromCorrespondingStacksToken(
    getXLinkSDKContext(sdk),
    options.toChain,
    options.fromStacksToken,
  )
  return { evmTokens }
}
export const evmTokenToStacksToken = async (
  sdk: import("./XLinkSDK").XLinkSDK,
  options: {
    fromChain: KnownChainId.EVMChain
    fromToken: KnownTokenId.EVMToken
    toStacksChain: KnownChainId.StacksChain
  },
): Promise<{
  stacksTokens: KnownTokenId.StacksToken[]
}> => {
  const stacksTokens = await evmTokenToCorrespondingStacksToken(
    getXLinkSDKContext(sdk),
    options.fromChain,
    options.fromToken,
  )
  return { stacksTokens: stacksTokens == null ? [] : [stacksTokens] }
}

export const metaTokensFromStacksToken = async (
  sdk: import("./XLinkSDK").XLinkSDK,
  options: {
    fromStacksChain: KnownChainId.StacksChain
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
