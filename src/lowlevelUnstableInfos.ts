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
  wrapContractAddress,
  alexContractDeployerMainnet,
  alexContractDeployerTestnet,
  alexContractMultisigMainnet,
  alexContractMultisigTestnet,
  legacyAlexContractDeployerMainnet,
  legacyAlexContractDeployerTestnet,
  xlinkContractsDeployerMainnet,
  xlinkContractsDeployerTestnet,
  xlinkContractsMultisigMainnet,
  xlinkContractsMultisigTestnet,
} from "./stacksUtils/stxContractAddresses"

export {
  KnownRoute_FromStacks,
  KnownRoute_FromStacks_ToEVM,
  KnownRoute_FromStacks_ToBitcoin,
  KnownRoute_FromStacks_ToBRC20,
  KnownRoute_FromStacks_ToRunes,
  KnownRoute_FromEVM,
  KnownRoute_FromEVM_ToStacks,
  KnownRoute_FromEVM_ToEVM,
  KnownRoute_FromEVM_ToBitcoin,
  KnownRoute_FromEVM_ToBRC20,
  KnownRoute_FromEVM_ToRunes,
  KnownRoute_FromBitcoin,
  KnownRoute_FromBitcoin_ToStacks,
  KnownRoute_FromBitcoin_ToEVM,
  KnownRoute_FromBitcoin_ToBRC20,
  KnownRoute_FromBitcoin_ToRunes,
  _KnownRoute_FromBRC20 as KnownRoute_FromBRC20,
  KnownRoute_FromBRC20_ToEVM,
  KnownRoute_FromBRC20_ToStacks,
  KnownRoute_FromBRC20_ToBitcoin,
  KnownRoute_FromBRC20_ToRunes,
  _KnownRoute_FromRunes as KnownRoute_FromRunes,
  KnownRoute_FromRunes_ToEVM,
  KnownRoute_FromRunes_ToStacks,
  KnownRoute_FromRunes_ToBitcoin,
  KnownRoute_FromRunes_ToBRC20,
} from "./utils/buildSupportedRoutes"

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
export { createBridgeOrderFromMeta } from "./stacksUtils/createBridgeOrderFromMeta"
export { bridgeFromEVM_toLaunchpad } from "./xlinkSdkUtils/bridgeFromEVM"

export { bridgeInfoFromEVM_toLaunchpad } from "./xlinkSdkUtils/bridgeInfoFromEVM"
export { bridgeInfoFromBitcoin_toLaunchpad } from "./xlinkSdkUtils/bridgeInfoFromBitcoin"

export { getBitcoinHardLinkageAddress } from "./bitcoinUtils/btcAddresses"

export const getXLinkSDKContext = (
  sdk: import("./XLinkSDK").XLinkSDK,
): SDKGlobalContext => {
  return sdk["sdkContext"]
}

export const evmTokensFromStacksToken = async (options: {
  fromStacksChain: KnownChainId.StacksChain
  fromStacksToken: KnownTokenId.StacksToken
  toChain: KnownChainId.EVMChain
}): Promise<{
  evmTokens: KnownTokenId.EVMToken[]
}> => {
  const evmTokens = await evmTokenFromCorrespondingStacksToken(
    options.toChain,
    options.fromStacksToken,
  )
  return { evmTokens }
}
export const evmTokenToStacksToken = async (options: {
  fromChain: KnownChainId.EVMChain
  fromToken: KnownTokenId.EVMToken
  toStacksChain: KnownChainId.StacksChain
}): Promise<{
  stacksTokens: KnownTokenId.StacksToken[]
}> => {
  const stacksTokens = await evmTokenToCorrespondingStacksToken(
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
