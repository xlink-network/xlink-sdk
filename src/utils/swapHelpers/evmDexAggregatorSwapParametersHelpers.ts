import { BigNumber } from "../BigNumber"
import { KnownChainId, KnownTokenId } from "../types/knownIds"

export const possibleSwapOnEVMChains = [
  KnownChainId.EVM.Base,
  KnownChainId.EVM.Arbitrum,
  KnownChainId.EVM.Linea,
] satisfies KnownChainId.EVMChain[]

export interface EVMDexAggregatorSwapParameters {
  evmChain: KnownChainId.EVMChain
  fromToken: KnownTokenId.EVMToken
  toToken: KnownTokenId.EVMToken
  fromAmount: BigNumber
}
