import { Address, Client } from "viem"
import { BigNumber, BigNumberSource } from "../utils/BigNumber"
import { KnownChainId, KnownTokenId } from "../utils/types.internal"
import {
  EVMEndpointContract,
  evmClients,
  evmContractAddresses,
} from "./evmContractAddresses"

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

export const getEVMContractCallInfo = (
  chainId: KnownChainId.EVMChain,
):
  | undefined
  | {
      client: Client
      bridgeEndpointContractAddress: Address
    } => {
  const client = evmClients[chainId]
  const address =
    evmContractAddresses[chainId]?.[EVMEndpointContract.BridgeEndpoint]

  if (client == null || address == null) return

  return { client, bridgeEndpointContractAddress: address }
}

export const getEVMTokenContractInfo = (
  chainId: KnownChainId.EVMChain,
  tokenId: KnownTokenId.EVMToken,
):
  | undefined
  | {
      client: Client
      bridgeEndpointContractAddress: Address
      tokenContractAddress: Address
    } => {
  const contractCallInfo = getEVMContractCallInfo(chainId)
  const tokenContractAddress = evmContractAddresses[chainId][tokenId]

  if (contractCallInfo == null || tokenContractAddress == null) {
    return undefined
  }

  if (tokenContractAddress == null) return

  return {
    ...contractCallInfo,
    tokenContractAddress,
  }
}
