import { EVMAddress } from "../../sdkUtils/types"
import { SDKGlobalContext } from "../../sdkUtils/types.internal"
import { requestAPI } from "../../utils/apiHelpers"
import {
  _allKnownEVMMainnetChains,
  _allKnownEVMTestnetChains,
  KnownChainId,
} from "../../utils/types/knownIds"
import { EVMEndpointContract } from "../evmContractAddresses"

export type EVMOnChainConfigForEVMChain = null | Partial<
  Record<EVMEndpointContract, EVMAddress>
>

export type EVMOnChainConfigByEVMChain = Partial<
  Record<KnownChainId.EVMChain, EVMOnChainConfigForEVMChain>
>

export async function getEVMOnChainConfig(
  sdkContext: SDKGlobalContext,
  chainId: KnownChainId.EVMChain,
): Promise<EVMOnChainConfigForEVMChain> {
  const config = await getEVMOnChainConfigByChainType(
    sdkContext,
    KnownChainId.isEVMMainnetChain(chainId) ? "mainnet" : "testnet",
  )

  return config[chainId] ?? null
}
export async function getEVMOnChainConfigByChainType(
  sdkContext: SDKGlobalContext,
  network: "mainnet" | "testnet",
): Promise<EVMOnChainConfigByEVMChain> {
  if (
    sdkContext.evm.onChainConfigCache != null &&
    sdkContext.evm.onChainConfigCache.get(network) != null
  ) {
    return sdkContext.evm.onChainConfigCache.get(network)!
  }

  const promise = _getEVMOnChainConfigByChainTypeImpl(
    sdkContext,
    network,
  ).catch(err => {
    const cachedPromise = sdkContext.evm.onChainConfigCache?.get(network)
    if (promise === cachedPromise) {
      sdkContext.evm.onChainConfigCache?.delete(network)
    }
    throw err
  })
  sdkContext.evm.onChainConfigCache?.set(network, promise)
  return promise
}

async function _getEVMOnChainConfigByChainTypeImpl(
  sdkContext: SDKGlobalContext,
  network: "mainnet" | "testnet",
): Promise<EVMOnChainConfigByEVMChain> {
  const evmChains =
    network === "mainnet"
      ? _allKnownEVMMainnetChains
      : _allKnownEVMTestnetChains

  const resp = await requestAPI<null | {
    config: Server_Resp_EVMOnChainConfigByEVMChain
  }>(sdkContext, {
    method: "POST",
    path: "/2024-10-01/evm/on-chain-config",
    body: { chains: evmChains },
  })

  if (resp == null) return {}

  return resp.config
}
type Server_Resp_EVMOnChainConfigByEVMChain = Partial<
  Record<
    /* XLink SDK EVMChain */ string,
    null | Partial<Record</* contract name enum */ string, `0x${string}`>>
  >
>
