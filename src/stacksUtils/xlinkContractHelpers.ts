import {
  composeTxOptionsFactory,
  executeReadonlyCallFactory,
} from "clarity-codegen"
import { xlinkContracts } from "../../generated/smartContract/contracts_xlink"
import { KnownChainId, TokenIdInternal } from "../utils/types.internal"
import {
  STACKS_CONTRACT_DEPLOYER_MAINNET,
  STACKS_CONTRACT_DEPLOYER_TESTNET,
  STACKS_MAINNET,
  STACKS_TESTNET,
} from "../config"
import { StacksNetwork } from "@stacks/network"
import { stxTokenContractAddresses } from "./stxContractAddresses"
import { BigNumber, BigNumberSource } from "../utils/BigNumber"
import { checkNever } from "../utils/typeHelpers"

const CONTRACT_COMMON_NUMBER_SCALE = 8
export const numberFromStacksContractNumber = (
  num: bigint,
  decimals?: number,
): BigNumber => {
  return BigNumber.leftMoveDecimals(
    decimals ?? CONTRACT_COMMON_NUMBER_SCALE,
    num,
  )
}
export const numberToStacksContractNumber = (
  num: BigNumberSource,
  decimals?: number,
): bigint => {
  return BigNumber.toBigInt(
    {},
    BigNumber.rightMoveDecimals(decimals ?? CONTRACT_COMMON_NUMBER_SCALE, num),
  )
}

export const composeTxXLINK = composeTxOptionsFactory(xlinkContracts, {})

export const executeReadonlyCallXLINK = executeReadonlyCallFactory(
  xlinkContracts,
  {},
)

export const getContractCallInfo = (
  chainId: KnownChainId.StacksChain,
):
  | undefined
  | {
      network: StacksNetwork
      deployerAddress: string
    } => {
  if (chainId === KnownChainId.Stacks.Mainnet) {
    return {
      deployerAddress: STACKS_CONTRACT_DEPLOYER_MAINNET,
      network: STACKS_MAINNET,
    }
  }
  if (chainId === KnownChainId.Stacks.Testnet) {
    return {
      deployerAddress: STACKS_CONTRACT_DEPLOYER_TESTNET,
      network: STACKS_TESTNET,
    }
  }
  checkNever(chainId)
  return
}

export const getTokenContractInfo = (
  chainId: KnownChainId.StacksChain,
  tokenId: TokenIdInternal,
):
  | undefined
  | {
      network: StacksNetwork
      deployerAddress: string
      contractName: string
    } => {
  const contractCallInfo = getContractCallInfo(chainId)

  if (
    contractCallInfo == null ||
    stxTokenContractAddresses[tokenId]?.[chainId] == null
  ) {
    return undefined
  }

  const { deployerAddress, network } = contractCallInfo

  return {
    ...stxTokenContractAddresses[tokenId]![chainId],
    network,
    deployerAddress,
  }
}
