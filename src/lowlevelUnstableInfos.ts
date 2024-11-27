/**
 * @experimental these APIs are not stable and may change in the future, and are
 *   not covered by semantic versioning. Please use them at your own risk.
 */

import {
  fromCorrespondingStacksToken,
  toCorrespondingStacksToken,
} from "./evmUtils/peggingHelpers"
import { KnownChainId, KnownTokenId } from "./utils/types/knownIds"

export {
  contractAssignedChainIdFromKnownChain,
  contractAssignedChainIdToKnownChain,
} from "./stacksUtils/crossContractDataMapping"

export {
  getTerminatingStacksTokenContractAddress,
  getEVMTokenIdFromTerminatingStacksTokenContractAddress,
} from "./stacksUtils/stxContractAddresses"

export {
  addressFromBuffer,
  addressToBuffer,
} from "./stacksUtils/xlinkContractHelpers"

export const evmTokensFromStacksToken = async (options: {
  toEVMChain: KnownChainId.EVMChain
  fromStacksToken: KnownTokenId.StacksToken
}): Promise<{
  evmTokens: KnownTokenId.EVMToken[]
}> => {
  const evmTokens = await fromCorrespondingStacksToken(
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
  const stacksTokens = await toCorrespondingStacksToken(options.fromEVMToken)
  return { stacksTokens: stacksTokens == null ? [] : [stacksTokens] }
}
