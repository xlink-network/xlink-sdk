import { Address, Client, isAddress, zeroAddress } from "viem"
import { BigNumber, BigNumberSource } from "../utils/BigNumber"
import {
  KnownChainId,
  KnownTokenId,
  _allKnownEVMTokens,
} from "../utils/knownIds"
import {
  EVMEndpointContract,
  EVMOnChainAddresses,
  evmClients,
  evmContractAddresses,
} from "./evmContractAddresses"
import { readContract } from "viem/actions"
import { bridgeConfigAbi } from "./contractAbi/bridgeConfig"
import { EVMAddress } from "../xlinkSdkUtils/types"
import pMemoize from "../utils/pMemoize"

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
  chainId: KnownChainId.EVMChain,
): Promise<
  | undefined
  | {
      client: Client
      bridgeEndpointContractAddress: Address
    }
> {
  const addresses = await getAllAddresses(chainId)
  if (addresses == null) return

  const bridgeEndpointContractAddress =
    addresses.onChainAddresses?.[EVMEndpointContract.BridgeEndpoint] ??
    addresses.localAddresses[EVMEndpointContract.BridgeEndpoint]
  if (bridgeEndpointContractAddress == null) return

  return {
    client: addresses.client,
    bridgeEndpointContractAddress,
  }
}

export async function getEVMTokenContractInfo(
  chainId: KnownChainId.EVMChain,
  tokenId: KnownTokenId.EVMToken,
): Promise<
  | undefined
  | {
      client: Client
      bridgeEndpointContractAddress: Address
      tokenContractAddress: Address
    }
> {
  const addresses = await getAllAddresses(chainId)
  if (addresses == null) return

  const bridgeEndpointContractAddress =
    addresses.onChainAddresses?.[EVMEndpointContract.BridgeEndpoint] ??
    addresses.localAddresses[EVMEndpointContract.BridgeEndpoint]
  if (bridgeEndpointContractAddress == null) return

  const tokenContractAddress =
    addresses.onChainAddresses?.[tokenId] ?? addresses.localAddresses[tokenId]

  if (tokenContractAddress == null) return

  return {
    client: addresses.client,
    bridgeEndpointContractAddress,
    tokenContractAddress,
  }
}

export async function getEVMToken(
  chain: KnownChainId.EVMChain,
  tokenAddress: EVMAddress,
): Promise<undefined | KnownTokenId.EVMToken> {
  const addresses = await getAllAddresses(chain)
  if (addresses == null) return

  tokenAddress = tokenAddress.toLowerCase() as EVMAddress
  return Object.values(_allKnownEVMTokens).find(
    token =>
      (
        addresses.onChainAddresses?.[token] ?? addresses.localAddresses?.[token]
      )?.toLowerCase() === tokenAddress,
  )
}

async function getAllAddresses(chainId: KnownChainId.EVMChain): Promise<
  | undefined
  | {
      client: Client
      onChainAddresses?: EVMOnChainAddresses
      localAddresses: EVMOnChainAddresses
    }
> {
  const client = evmClients[chainId]
  const localAddresses = evmContractAddresses[chainId]
  const configContractAddress = localAddresses[EVMEndpointContract.BridgeConfig]

  let onChainAddresses: undefined | EVMOnChainAddresses
  if (configContractAddress != null) {
    onChainAddresses = await getOnChainConfigs(chainId, configContractAddress)
  }

  return {
    client,
    onChainAddresses,
    localAddresses,
  }
}

const getOnChainConfigs: typeof _getOnChainConfigs = pMemoize(
  _getOnChainConfigs as any,
  { skipCache: true },
)
async function _getOnChainConfigs(
  chain: KnownChainId.EVMChain,
  configContractAddress: Address,
): Promise<EVMOnChainAddresses> {
  const client = evmClients[chain]

  const configs = await readContract(client, {
    abi: bridgeConfigAbi,
    address: configContractAddress,
    functionName: "getConfigs",
    args: [
      [
        ONCHAIN_CONFIG_KEY.ENDPOINT,
        ONCHAIN_CONFIG_KEY.TOKEN_ABTC,
        ONCHAIN_CONFIG_KEY.TOKEN_ALEX,
        ONCHAIN_CONFIG_KEY.TOKEN_ATALEX,
        ONCHAIN_CONFIG_KEY.TOKEN_LISTX,
        ONCHAIN_CONFIG_KEY.TOKEN_USDT,
        ONCHAIN_CONFIG_KEY.TOKEN_BTC,
        ONCHAIN_CONFIG_KEY.TOKEN_LUNR,
        ONCHAIN_CONFIG_KEY.TOKEN_SKO,
        ONCHAIN_CONFIG_KEY.TOKEN_SUSDT,
      ],
    ],
  })

  const EVMToken = KnownTokenId.EVM
  return {
    [EVMEndpointContract.BridgeEndpoint]: maybeAddress(configs[0]),
    [EVMToken.aBTC]: maybeAddress(configs[1]),
    [EVMToken.ALEX]: maybeAddress(configs[2]),
    [EVMToken.vLiALEX]: maybeAddress(configs[3]),
    [EVMToken.vLiSTX]: maybeAddress(configs[4]),
    [EVMToken.USDT]: maybeAddress(configs[5]),
    [client === evmClients[KnownChainId.EVM.BSC]
      ? EVMToken.BTCB
      : EVMToken.WBTC]: maybeAddress(configs[6]),
    [EVMToken.LUNR]: maybeAddress(configs[7]),
    [EVMToken.SKO]: maybeAddress(configs[8]),
    [EVMToken.sUSDT]: maybeAddress(configs[9]),
  }
}
function maybeAddress(value: string | null): Address | undefined {
  if (value == null) return undefined
  if (value === "") return undefined
  if (!isAddress(value)) return undefined
  if (value === zeroAddress) return undefined
  return value
}
/**
 * https://t.me/c/1599543687/57298
 */
enum ONCHAIN_CONFIG_KEY {
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
  TIMELOCK = "TIMELOCK",
  MULTISIG = "MULTISIG",
  MIGRATE = "MIGRATE",
  MIGRATE_BOB = "MIGRATE_BOB",
  MIGRATE_BOB_L2 = "MIGRATE_BOB_L2",
  MIGRATE_BOB_L2_S = "MIGRATE_BOB_L2_S",
}
