import { Client } from "viem"
import { EVMOnChainAddresses } from "../evmUtils/evmContractAddresses"
import { KnownChainId } from "../utils/types/knownIds"
import type {
  BRC20SupportedRoute,
  RunesSupportedRoute,
} from "../metaUtils/xlinkContractHelpers"

export interface SDKGlobalContextCache<K, T> {
  get: (key: K) => T | null
  set: (key: K, value: T) => void
  delete: (key: K) => void
}

export interface SDKGlobalContext {
  brc20: {
    routesConfigCache?: SDKGlobalContextCache<
      string,
      Promise<BRC20SupportedRoute[]>
    >
  }
  runes: {
    routesConfigCache?: SDKGlobalContextCache<
      string,
      Promise<RunesSupportedRoute[]>
    >
  }
  evm: {
    enableMulticall?: boolean
    onChainConfigCache?: SDKGlobalContextCache<
      string,
      Promise<EVMOnChainAddresses>
    >
    viemClients: Partial<Record<KnownChainId.EVMChain, Client>>
  }
}
