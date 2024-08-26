import { Client } from "viem"
import { EVMOnChainAddresses } from "../evmUtils/evmContractAddresses"
import { KnownChainId } from "../utils/types/knownIds"

export interface SDKGlobalContextCache<K, T> {
  get: (key: K) => T | null
  set: (key: K, value: T) => void
  delete: (key: K) => void
}

export interface SDKGlobalContext {
  evm: {
    enableMulticall?: boolean
    onChainConfigCache?: SDKGlobalContextCache<
      string,
      Promise<EVMOnChainAddresses>
    >
    viemClients: Record<KnownChainId.EVMChain, Client>
  }
}
