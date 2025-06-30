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
import {
  SDKNumber,
  StacksContractAddress,
  toSDKNumberOrUndefined,
} from "./sdkUtils/types"
import { SDKGlobalContext } from "./sdkUtils/types.internal"
import {
  InstantSwapOrderData as _InstantSwapOrderData,
  decodeInstantSwapOrderData as _decodeInstantSwapOrderData,
  encodeInstantSwapOrderData as _encodeInstantSwapOrderData,
} from "./bitcoinUtils/apiHelpers/InstantSwapOrder"
import { BigNumber } from "./utils/BigNumber"
import { deserializeCV, serializeCVBytes } from "@stacks/transactions"

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
  contractsDeployerMainnet as brotocolContractsDeployerMainnet,
  contractsDeployerTestnet as brotocolContractsDeployerTestnet,
  contractsMultisigMainnet as brotocolContractsMultisigMainnet,
  contractsMultisigTestnet as brotocolContractsMultisigTestnet,
} from "./stacksUtils/stxContractAddresses"

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
  applyTransferProphets,
  applyTransferProphet,
  TransferProphetAppliedResult,
  composeTransferProphets,
} from "./utils/feeRateHelpers"

export { addressFromBuffer, addressToBuffer } from "./utils/addressHelpers"

export { bridgeFromEVM_toLaunchpad } from "./sdkUtils/bridgeFromEVM"
export { bridgeInfoFromEVM_toLaunchpad } from "./sdkUtils/bridgeInfoFromEVM"
export { bridgeInfoFromBitcoin_toLaunchpad } from "./sdkUtils/bridgeInfoFromBitcoin"

export { getBitcoinHardLinkageAddress } from "./bitcoinUtils/btcAddresses"

export const getSDKContext = (
  sdk: import("./BroSDK").BroSDK,
): SDKGlobalContext => {
  return sdk["sdkContext"]
}

export const getTerminatingStacksTokenContractAddress = async (
  sdk: import("./BroSDK").BroSDK,
  info: {
    evmChain: KnownChainId.EVMChain
    evmToken: KnownTokenId.EVMToken
    stacksChain: KnownChainId.StacksChain
  },
): Promise<undefined | StacksContractAddress> => {
  return _getTerminatingStacksTokenContractAddress(getSDKContext(sdk), info)
}
export const getStacksTokenFromTerminatingStacksTokenContractAddress = async (
  sdk: import("./BroSDK").BroSDK,
  info: {
    stacksChain: KnownChainId.StacksChain
    stacksTokenAddress: StacksContractAddress
  },
): Promise<undefined | KnownTokenId.StacksToken> => {
  return _getStacksTokenFromTerminatingStacksTokenContractAddress(
    getSDKContext(sdk),
    info,
  )
}
export const getEVMTokenIdFromTerminatingStacksTokenContractAddress = async (
  sdk: import("./BroSDK").BroSDK,
  info: {
    evmChain: KnownChainId.EVMChain
    stacksChain: KnownChainId.StacksChain
    stacksTokenAddress: StacksContractAddress
  },
): Promise<undefined | KnownTokenId.EVMToken> => {
  return _getEVMTokenFromTerminatingStacksTokenContractAddress(
    getSDKContext(sdk),
    info,
  )
}

export const evmTokensFromStacksToken = async (
  sdk: import("./BroSDK").BroSDK,
  options: {
    fromStacksChain: KnownChainId.StacksChain
    fromStacksToken: KnownTokenId.StacksToken
    toChain: KnownChainId.EVMChain
  },
): Promise<{
  evmTokens: KnownTokenId.EVMToken[]
}> => {
  const evmTokens = await evmTokenFromCorrespondingStacksToken(
    getSDKContext(sdk),
    options.toChain,
    options.fromStacksToken,
  )
  return { evmTokens }
}
export const evmTokenToStacksToken = async (
  sdk: import("./BroSDK").BroSDK,
  options: {
    fromChain: KnownChainId.EVMChain
    fromToken: KnownTokenId.EVMToken
    toStacksChain: KnownChainId.StacksChain
  },
): Promise<{
  stacksTokens: KnownTokenId.StacksToken[]
}> => {
  const stacksTokens = await evmTokenToCorrespondingStacksToken(
    getSDKContext(sdk),
    options.fromChain,
    options.fromToken,
  )
  return { stacksTokens: stacksTokens == null ? [] : [stacksTokens] }
}

export const metaTokensFromStacksToken = async (
  sdk: import("./BroSDK").BroSDK,
  options: {
    fromStacksChain: KnownChainId.StacksChain
    fromStacksToken: KnownTokenId.StacksToken
    toChain: KnownChainId.BRC20Chain | KnownChainId.RunesChain
  },
): Promise<{
  tokens: (KnownTokenId.BRC20Token | KnownTokenId.RunesToken)[]
}> => {
  const metaTokens = await metaTokenFromCorrespondingStacksToken(
    getSDKContext(sdk),
    options.toChain,
    options.fromStacksToken,
  )
  return { tokens: metaTokens == null ? [] : [metaTokens as any] }
}
export const metaTokenToStacksToken = async (
  sdk: import("./BroSDK").BroSDK,
  options: {
    fromChain: KnownChainId.BRC20Chain | KnownChainId.RunesChain
    fromToken: KnownTokenId.BRC20Token | KnownTokenId.RunesToken
    toStacksChain: KnownChainId.StacksChain
  },
): Promise<{
  stacksTokens: KnownTokenId.StacksToken[]
}> => {
  const stacksTokens = await metaTokenToCorrespondingStacksToken(
    getSDKContext(sdk),
    {
      chain: options.fromChain as any,
      token: options.fromToken as any,
    },
  )
  return { stacksTokens: stacksTokens == null ? [] : [stacksTokens] }
}

export interface InstantSwapOrderData
  extends Omit<_InstantSwapOrderData, "minimumAmountsToReceive"> {
  minimumAmountsToReceive: SDKNumber
}
export const encodeInstantSwapOrderData = async (
  sdk: import("./BroSDK").BroSDK,
  stacksNetwork: KnownChainId.StacksChain,
  data: InstantSwapOrderData,
): Promise<undefined | Uint8Array> => {
  const res = await _encodeInstantSwapOrderData(
    getSDKContext(sdk),
    stacksNetwork,
    {
      ...data,
      minimumAmountsToReceive: BigNumber.from(data.minimumAmountsToReceive),
    },
  )
  if (res == null) return
  return serializeCVBytes(res)
}
export const decodeInstantSwapOrderData = async (
  sdk: import("./BroSDK").BroSDK,
  stacksNetwork: KnownChainId.StacksChain,
  data: Uint8Array,
): Promise<undefined | InstantSwapOrderData> => {
  const res = await _decodeInstantSwapOrderData(
    getSDKContext(sdk),
    stacksNetwork,
    deserializeCV(data),
  )
  if (res == null) return
  return {
    ...res,
    minimumAmountsToReceive: toSDKNumberOrUndefined(
      res.minimumAmountsToReceive,
    ),
  }
}
