import { EVMOnChainAddresses } from "../evmUtils/evmContractAddresses"

export interface SDKGlobalContextCache<T> {
  get: (key: string) => T | null
  set: (key: string, value: T) => void
}

export interface SDKGlobalContext {
  evm?: {
    enableMulticall?: boolean
    onChainConfigCache?: SDKGlobalContextCache<EVMOnChainAddresses>
  }
}
