import { Address, Client, isAddress, zeroAddress } from "viem"
import { readContract } from "viem/actions"
import { BigNumber, BigNumberSource } from "../utils/BigNumber"
import {
  KnownChainId,
  KnownTokenId,
  _allKnownEVMTokens,
} from "../utils/types/knownIds"
import {
  EVMAddress,
  EVMNativeCurrencyAddress,
  evmNativeCurrencyAddress,
} from "../sdkUtils/types"
import { SDKGlobalContext } from "../sdkUtils/types.internal"
import { BridgeConfigAbi } from "./contractAbi/bridgeConfig"
import {
  EVMEndpointContract,
  EVMOnChainAddresses,
  evmContractAddresses,
} from "./evmContractAddresses"
import { nativeCurrencyAddress } from "./addressHelpers"

const CONTRACT_COMMON_NUMBER_SCALE = 18
export const numberFromSolidityContractNumber = (
  num: bigint,
  decimals?: number,
): BigNumber => {
  return BigNumber.leftMoveDecimals(
    decimals ?? CONTRACT_COMMON_NUMBER_SCALE,
    num,
  )
}
export const numberToSolidityContractNumber = (
  num: BigNumberSource,
  decimals?: number,
): bigint => {
  return BigNumber.toBigInt(
    {},
    BigNumber.rightMoveDecimals(decimals ?? CONTRACT_COMMON_NUMBER_SCALE, num),
  )
}

export async function getEVMContractCallInfo(
  sdkContext: SDKGlobalContext,
  chainId: KnownChainId.EVMChain,
): Promise<
  | undefined
  | {
      client: Client
      bridgeEndpointContractAddress: Address
      nativeBridgeEndpointContractAddress?: Address
      registryContractAddress?: Address
      timeLockContractAddress?: Address
    }
> {
  const addresses = await getAllAddresses(sdkContext, chainId)
  if (addresses == null) return

  const bridgeEndpointContractAddress =
    addresses.onChainAddresses?.[EVMEndpointContract.BridgeEndpoint] ??
    addresses.localAddresses[EVMEndpointContract.BridgeEndpoint]
  if (bridgeEndpointContractAddress == null) return

  const nativeBridgeEndpointContractAddress =
    addresses.onChainAddresses?.[EVMEndpointContract.NativeBridgeEndpoint] ??
    addresses.localAddresses[EVMEndpointContract.NativeBridgeEndpoint]
  const registryContractAddress =
    addresses.onChainAddresses?.[EVMEndpointContract.Registry] ??
    addresses.localAddresses[EVMEndpointContract.Registry]
  const timeLockContractAddress =
    addresses.onChainAddresses?.[EVMEndpointContract.TimeLock] ??
    addresses.localAddresses[EVMEndpointContract.TimeLock]

  return {
    client: addresses.client,
    bridgeEndpointContractAddress,
    nativeBridgeEndpointContractAddress,
    registryContractAddress,
    timeLockContractAddress,
  }
}

export async function getEVMTokenContractInfo(
  sdkContext: SDKGlobalContext,
  chainId: KnownChainId.EVMChain,
  tokenId: KnownTokenId.EVMToken,
): Promise<
  | undefined
  | {
      client: Client
      tokenContractAddress: Address | EVMNativeCurrencyAddress
    }
> {
  const addresses = await getAllAddresses(sdkContext, chainId)
  if (addresses == null) return

  const tokenContractAddress =
    addresses.onChainAddresses?.[tokenId] ?? addresses.localAddresses[tokenId]

  if (tokenContractAddress == null) return

  return {
    client: addresses.client,
    tokenContractAddress:
      tokenContractAddress === nativeCurrencyAddress
        ? evmNativeCurrencyAddress
        : tokenContractAddress,
  }
}

export async function getEVMToken(
  sdkContext: SDKGlobalContext,
  chain: KnownChainId.EVMChain,
  tokenAddress: EVMAddress,
): Promise<undefined | KnownTokenId.EVMToken> {
  const addresses = await getAllAddresses(sdkContext, chain)
  if (addresses == null) return

  tokenAddress = tokenAddress.toLowerCase() as EVMAddress
  return Object.values(_allKnownEVMTokens).find(
    token =>
      (
        addresses.onChainAddresses?.[token] ?? addresses.localAddresses?.[token]
      )?.toLowerCase() === tokenAddress,
  )
}

export async function getAllAddresses(
  sdkContext: SDKGlobalContext,
  chainId: KnownChainId.EVMChain,
): Promise<
  | undefined
  | {
      client: Client
      onChainAddresses?: EVMOnChainAddresses
      localAddresses: EVMOnChainAddresses
    }
> {
  const client = sdkContext.evm.viemClients[chainId]
  const localAddresses = evmContractAddresses[chainId]
  const configContractAddress = localAddresses[EVMEndpointContract.BridgeConfig]

  if (client == null) return

  let onChainAddresses: undefined | EVMOnChainAddresses
  if (configContractAddress != null) {
    onChainAddresses = await getOnChainConfigs(
      sdkContext,
      chainId,
      configContractAddress,
    )
  }

  return {
    client,
    onChainAddresses,
    localAddresses,
  }
}

const getOnChainConfigs = async (
  sdkContext: SDKGlobalContext,
  chain: KnownChainId.EVMChain,
  configContractAddress: Address,
): Promise<undefined | EVMOnChainAddresses> => {
  const cache = sdkContext.evm.onChainConfigCache
  const cacheKey = `${chain}:${configContractAddress}` as const

  if (cache != null) {
    const cachedPromise = cache.get(cacheKey)
    if (cachedPromise != null) return cachedPromise
  }

  const client = sdkContext.evm.viemClients[chain]
  if (client == null) return

  const promise = _getOnChainConfigsImpl(
    client,
    chain,
    configContractAddress,
  ).catch(err => {
    queueMicrotask(() => {
      if (cache != null && promise === cache.get(cacheKey)) {
        cache.delete(cacheKey)
      }
    })
    throw err
  })
  if (cache != null) {
    cache.set(cacheKey, promise)
  }
  return promise
}

const _getOnChainConfigsImpl = async (
  client: Client,
  chain: KnownChainId.EVMChain,
  configContractAddress: Address,
): Promise<EVMOnChainAddresses> => {
  const configs = await readContract(client, {
    abi: BridgeConfigAbi,
    address: configContractAddress,
    functionName: "getConfigs",
    args: [
      [
        ONCHAIN_CONFIG_KEY.ENDPOINT,
        ONCHAIN_CONFIG_KEY.REGISTRY,
        ONCHAIN_CONFIG_KEY.TIMELOCK,
        ONCHAIN_CONFIG_KEY.ENDPOINT_NATIVE,
        ONCHAIN_CONFIG_KEY.TOKEN_ABTC,
        ONCHAIN_CONFIG_KEY.TOKEN_ALEX,
        ONCHAIN_CONFIG_KEY.TOKEN_ATALEX,
        ONCHAIN_CONFIG_KEY.TOKEN_LISTX,
        ONCHAIN_CONFIG_KEY.TOKEN_USDT,
        ONCHAIN_CONFIG_KEY.TOKEN_BTC,
        ONCHAIN_CONFIG_KEY.TOKEN_LUNR,
        ONCHAIN_CONFIG_KEY.TOKEN_SKO,
        ONCHAIN_CONFIG_KEY.TOKEN_SUSDT,
        ONCHAIN_CONFIG_KEY.TOKEN_UBTC,
        ONCHAIN_CONFIG_KEY.TOKEN_WUBTC,
        ONCHAIN_CONFIG_KEY.TOKEN_DB20,
        ONCHAIN_CONFIG_KEY.TOKEN_DOG,
        ONCHAIN_CONFIG_KEY.TOKEN_STX,
        ONCHAIN_CONFIG_KEY.TOKEN_TRUMP,
        ONCHAIN_CONFIG_KEY.TOKEN_GHIBLICZ,
        ONCHAIN_CONFIG_KEY.TOKEN_ETH,
        ONCHAIN_CONFIG_KEY.TOKEN_SOL,
        ONCHAIN_CONFIG_KEY.TOKEN_LINK,
      ],
    ],
  }).catch(err => {
    console.groupCollapsed(
      `Failed to read on-chain configs from ${configContractAddress} (${chain})`,
    )
    console.error(err)
    console.groupEnd()
    return null
  })

  if (configs == null) {
    return {}
  }

  const EVMToken = KnownTokenId.EVM
  return {
    [EVMEndpointContract.BridgeEndpoint]: maybeAddress(configs[0]),
    [EVMEndpointContract.Registry]: maybeAddress(configs[1]),
    [EVMEndpointContract.TimeLock]: maybeAddress(configs[2]),
    [EVMEndpointContract.NativeBridgeEndpoint]: maybeAddress(configs[3]),
    [EVMToken.aBTC]: maybeAddress(configs[4]),
    [EVMToken.ALEX]: maybeAddress(configs[5]),
    [EVMToken.vLiALEX]: maybeAddress(configs[6]),
    [EVMToken.vLiSTX]: maybeAddress(configs[7]),
    // prettier-ignore
    [EVMToken.USDT]:
      chain === KnownChainId.EVM.Ethereum ||
      chain === KnownChainId.EVM.BSC
        ? maybeAddress(configs[8])
        : undefined,
    // prettier-ignore
    [EVMToken.USDC]:
      chain === KnownChainId.EVM.Base ||
      chain === KnownChainId.EVM.Arbitrum
        ? maybeAddress(configs[8])
        : undefined,
    // prettier-ignore
    [EVMToken.WBTC]:
      chain === KnownChainId.EVM.Ethereum ||
      chain === KnownChainId.EVM.Arbitrum
        ? maybeAddress(configs[9])
        : undefined,
    // prettier-ignore
    [EVMToken.BTCB]:
      chain === KnownChainId.EVM.BSC
        ? maybeAddress(configs[9])
        : undefined,
    // prettier-ignore
    [EVMToken.cbBTC]:
      chain === KnownChainId.EVM.Base
        ? maybeAddress(configs[9])
        : undefined,
    [EVMToken.LUNR]: maybeAddress(configs[10]),
    [EVMToken.SKO]: maybeAddress(configs[11]),
    [EVMToken.sUSDT]: maybeAddress(configs[12]),
    [EVMToken.uBTC]: maybeAddress(configs[13]),
    [EVMToken.wuBTC]: maybeAddress(configs[14]),
    [EVMToken.DB20]: maybeAddress(configs[15]),
    [EVMToken.DOG]: maybeAddress(configs[16]),
    [EVMToken.STX]: maybeAddress(configs[17]),
    [EVMToken.TRUMP]: maybeAddress(configs[18]),
    [EVMToken.GHIBLICZ]: maybeAddress(configs[19]),
    [EVMToken.ETH]: maybeAddress(configs[20]),
    [EVMToken.SOL]: maybeAddress(configs[21]),
    [EVMToken.LINK]: maybeAddress(configs[22]),
  }
}
function maybeAddress(value: string | null): Address | undefined {
  if (value == null) return undefined
  if (value === "") return undefined
  if (!isAddress(value)) return undefined
  if (value === zeroAddress) return undefined
  return value
}

enum ONCHAIN_CONFIG_KEY {
  ENDPOINT = "ENDPOINT",
  ENDPOINT_NATIVE = "ENDPOINT_NATIVE",
  REGISTRY = "REGISTRY",
  TIMELOCK = "TIMELOCK",
  MULTISIG = "MULTISIG",
  MIGRATE = "MIGRATE",
  MIGRATE_BOB = "MIGRATE_BOB",
  MIGRATE_BOB_L2 = "MIGRATE_BOB_L2",
  MIGRATE_BOB_L2_S = "MIGRATE_BOB_L2_S",

  TOKEN_ABTC = "TOKEN_ABTC",
  TOKEN_ALEX = "TOKEN_ALEX",
  TOKEN_ATALEX = "TOKEN_ATALEX",
  TOKEN_LISTX = "TOKEN_LISTX",
  TOKEN_USDT = "TOKEN_USDT",
  TOKEN_BTC = "TOKEN_BTC",
  TOKEN_LUNR = "TOKEN_LUNR",
  TOKEN_SKO = "TOKEN_SKO",
  TOKEN_SUSDT = "TOKEN_SUSDT",
  TOKEN_DB20 = "TOKEN_DB20",
  TOKEN_DOG = "TOKEN_DOG",
  TOKEN_UBTC = "TOKEN_UBTC",
  TOKEN_WUBTC = "TOKEN_WUBTC",
  TOKEN_STX = "TOKEN_STX",
  TOKEN_TRUMP = "TOKEN_TRUMP",
  TOKEN_GHIBLICZ = "TOKEN_GHIBLICZ",
  TOKEN_ETH = "TOKEN_ETH",
  TOKEN_SOL = "TOKEN_SOL",
  TOKEN_LINK = "TOKEN_LINK",
}
