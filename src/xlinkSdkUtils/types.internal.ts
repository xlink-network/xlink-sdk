import { Client } from "viem"
import { EVMOnChainAddresses } from "../evmUtils/evmContractAddresses"
import type {
  BRC20SupportedRoute,
  RunesSupportedRoute,
} from "../metaUtils/xlinkContractHelpers"
import { StacksTokenInfo } from "../stacksUtils/xlinkContractHelpers"
import { KnownChainId } from "../utils/types/knownIds"
import { EVMAddress } from "./types"

export interface SDKGlobalContextCache<K, T> {
  get: (key: K) => T | null
  set: (key: K, value: T) => void
  delete: (key: K) => void
}

export interface SDKGlobalContext {
  backendAPI: {
    runtimeEnv: "prod" | "dev"
  }
  stacks: {
    tokensCache?: SDKGlobalContextCache<
      KnownChainId.StacksChain,
      Promise<StacksTokenInfo[]>
    >
  }
  btc: {
    ignoreValidateResult?: boolean
  }
  brc20: {
    routesConfigCache?: SDKGlobalContextCache<
      KnownChainId.BRC20Chain,
      Promise<BRC20SupportedRoute[]>
    >
    ignoreValidateResult?: boolean
  }
  runes: {
    routesConfigCache?: SDKGlobalContextCache<
      KnownChainId.RunesChain,
      Promise<RunesSupportedRoute[]>
    >
    ignoreValidateResult?: boolean
  }
  evm: {
    enableMulticall?: boolean
    onChainConfigCache?: SDKGlobalContextCache<
      `${KnownChainId.EVMChain}:${EVMAddress}`,
      Promise<EVMOnChainAddresses>
    >
    viemClients: Partial<Record<KnownChainId.EVMChain, Client>>
  }
}
