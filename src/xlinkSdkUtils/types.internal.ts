import { Client } from "viem"
import { EVMSupportedRoute } from "../evmUtils/apiHelpers/getEVMSupportedRoutes"
import { EVMOnChainAddresses } from "../evmUtils/evmContractAddresses"
import type { BRC20SupportedRoute } from "../metaUtils/apiHelpers/getBRC20SupportedRoutes"
import type { RunesSupportedRoute } from "../metaUtils/apiHelpers/getRunesSupportedRoutes"
import { StacksTokenInfo } from "../stacksUtils/apiHelpers/getAllStacksTokens"
import { KnownChainId } from "../utils/types/knownIds"
import { EVMAddress } from "./types"
import { KnownRoute } from "../utils/buildSupportedRoutes"

export interface SDKGlobalContextCache<K, T> {
  get: (key: K) => T | null
  set: (key: K, value: T) => void
  delete: (key: K) => void
}

export interface SDKGlobalContext {
  routes: {
    detectedCache: SDKGlobalContextCache<"mainnet" | "testnet", KnownRoute[]>
  }
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
    ignoreValidateResult?: boolean
    routesConfigCache?: SDKGlobalContextCache<
      KnownChainId.BRC20Chain,
      Promise<BRC20SupportedRoute[]>
    >
  }
  runes: {
    ignoreValidateResult?: boolean
    routesConfigCache?: SDKGlobalContextCache<
      KnownChainId.RunesChain,
      Promise<RunesSupportedRoute[]>
    >
  }
  evm: {
    enableMulticall?: boolean
    routesConfigCache?: SDKGlobalContextCache<
      "mainnet" | "testnet",
      Promise<EVMSupportedRoute[]>
    >
    onChainConfigCache?: SDKGlobalContextCache<
      `${KnownChainId.EVMChain}:${EVMAddress}`,
      Promise<EVMOnChainAddresses>
    >
    viemClients: Partial<Record<KnownChainId.EVMChain, Client>>
  }
}
