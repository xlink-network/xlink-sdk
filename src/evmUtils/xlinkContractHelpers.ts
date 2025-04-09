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
} from "../xlinkSdkUtils/types"
import { SDKGlobalContext } from "../xlinkSdkUtils/types.internal"
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
    [
      chain === KnownChainId.EVM.Base ? EVMToken.USDC :
      chain === KnownChainId.EVM.Arbitrum ? EVMToken.USDC :
      EVMToken.USDT
    ]: maybeAddress(configs[8]),
    // prettier-ignore
    [
      chain === KnownChainId.EVM.BSC ? EVMToken.BTCB :
      chain === KnownChainId.EVM.Base ? EVMToken.cbBTC :
      EVMToken.WBTC
    ]:
      maybeAddress(configs[9]),
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
  /**
   * https://t.me/c/1599543687/57298
   */
  ENDPOINT = "ENDPOINT",
  REGISTRY = "REGISTRY",
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
  TIMELOCK = "TIMELOCK",
  MULTISIG = "MULTISIG",
  MIGRATE = "MIGRATE",
  MIGRATE_BOB = "MIGRATE_BOB",
  MIGRATE_BOB_L2 = "MIGRATE_BOB_L2",
  MIGRATE_BOB_L2_S = "MIGRATE_BOB_L2_S",

  // https://github.com/xlink-network/xlink/blob/9e6e268d820f2f9756ca15a36f8580e4f98c087e/packages/contracts/bridge-solidity/scripts/params.ts
  ENDPOINT_NATIVE = "ENDPOINT_NATIVE",

  // https://github.com/xlink-network/xlink/pull/299/commits/22b23c9ff3ea65eeb7c632db4255afe803f97fef#diff-8302902f9863ee3c7928a0fa6eb6ca22edd10f5553708459cdd072c1ea3ef696
  TOKEN_UBTC = "TOKEN_UBTC",
  TOKEN_WUBTC = "TOKEN_WUBTC",

  // https://github.com/xlink-network/xlink/pull/366/files#diff-84d6042780ec5ce60f8e5349d20baf5f577f9d878feb8a703748ad37a91e31fd
  TOKEN_STX = "TOKEN_STX",

  // https://t.me/c/1599543687/69562
  TOKEN_TRUMP = "TOKEN_TRUMP",

  // https://t.me/c/1599543687/73009
  TOKEN_GHIBLICZ = "TOKEN_GHIBLICZ",

  // https://t.me/c/1599543687/73347
  TOKEN_ETH = "TOKEN_ETH",

  // https://t.me/c/1599543687/73387
  TOKEN_SOL = "TOKEN_SOL",

  // https://t.me/c/1599543687/73476
  TOKEN_LINK = "TOKEN_LINK",
}
