import { Address, Client } from "viem"
import {
  ETHEREUM_BSCTESTNET_CLIENT,
  ETHEREUM_BSC_CLIENT,
  ETHEREUM_MAINNET_CLIENT,
  ETHEREUM_SEPOLIA_CLIENT,
} from "../config"
import { BigNumber, BigNumberSource } from "../utils/BigNumber"
import { checkNever } from "../utils/typeHelpers"
import { KnownChainId, TokenIdInternal } from "../utils/types.internal"
import { ethTokenContractAddresses } from "./ethContractAddresses"

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

export const getContractCallInfo = (
  chainId: KnownChainId.EthereumChain,
):
  | undefined
  | {
      client: Client
    } => {
  if (chainId === KnownChainId.Ethereum.Mainnet) {
    return {
      client: ETHEREUM_MAINNET_CLIENT,
    }
  }
  if (chainId === KnownChainId.Ethereum.BSC) {
    return {
      client: ETHEREUM_BSC_CLIENT,
    }
  }
  if (chainId === KnownChainId.Ethereum.Sepolia) {
    return {
      client: ETHEREUM_SEPOLIA_CLIENT,
    }
  }
  if (chainId === KnownChainId.Ethereum.BSCTest) {
    return {
      client: ETHEREUM_BSCTESTNET_CLIENT,
    }
  }

  checkNever(chainId)
  return
}

export const getTokenContractInfo = (
  chainId: KnownChainId.EthereumChain,
  tokenId: TokenIdInternal,
):
  | undefined
  | {
      client: Client
      contractAddress: Address
    } => {
  const contractCallInfo = getContractCallInfo(chainId)

  if (
    contractCallInfo == null ||
    ethTokenContractAddresses[tokenId]?.[chainId] == null
  ) {
    return undefined
  }

  const { client } = contractCallInfo

  return {
    client,
    contractAddress: ethTokenContractAddresses[tokenId]![chainId]!,
  }
}
