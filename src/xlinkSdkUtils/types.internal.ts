import { Client } from "viem"
import { EVMOnChainAddresses } from "../evmUtils/evmContractAddresses"
import { KnownChainId } from "../utils/types/knownIds"

export interface SDKGlobalContextCache<T> {
  get: (key: string) => T | null
  set: (key: string, value: T) => void
  delete: (key: string) => void
}

export interface SDKGlobalContext {
  evm: {
    enableMulticall?: boolean
    onChainConfigCache?: SDKGlobalContextCache<Promise<EVMOnChainAddresses>>
    viemClients: Record<KnownChainId.EVMChain, Client>
  }
}
