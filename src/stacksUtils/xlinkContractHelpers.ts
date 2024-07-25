import { StacksNetwork } from "@stacks/network"
import {
  composeTxOptionsFactory,
  executeReadonlyCallFactory,
} from "clarity-codegen"
import { xlinkContracts } from "../../generated/smartContract/contracts_xlink"
import {
  STACKS_CONTRACT_DEPLOYER_MAINNET,
  STACKS_CONTRACT_DEPLOYER_TESTNET,
  STACKS_MAINNET,
  STACKS_TESTNET,
} from "../config"
import { BigNumber, BigNumberSource } from "../utils/BigNumber"
import { checkNever } from "../utils/typeHelpers"
import { KnownChainId, KnownTokenId } from "../utils/types/knownIds"
import { StacksContractAddress } from "../xlinkSdkUtils/types"
import { stxTokenContractAddresses } from "./stxContractAddresses"

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

export const getStacksContractCallInfo = (
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

export const getStacksTokenContractInfo = (
  chainId: KnownChainId.StacksChain,
  tokenId: KnownTokenId.StacksToken,
):
  | undefined
  | {
      network: StacksNetwork
      deployerAddress: string
      contractName: string
    } => {
  const contractCallInfo = getStacksContractCallInfo(chainId)

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

export async function getStacksToken(
  chain: KnownChainId.StacksChain,
  tokenAddress: StacksContractAddress,
): Promise<undefined | KnownTokenId.StacksToken> {
  for (const token of Object.keys(
    stxTokenContractAddresses,
  ) as (keyof typeof stxTokenContractAddresses)[]) {
    const info = stxTokenContractAddresses[token]?.[chain]
    if (info == null) continue

    if (
      info.deployerAddress === tokenAddress.deployerAddress &&
      info.contractName === tokenAddress.contractName
    ) {
      return token
    }
  }

  return
}
