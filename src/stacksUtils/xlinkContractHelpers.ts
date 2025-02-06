import { StacksNetwork } from "@stacks/network"
import { callReadOnlyFunction } from "@stacks/transactions"
import {
  CallReadOnlyFunctionFn,
  composeTxOptionsFactory,
  executeReadonlyCallFactory,
} from "clarity-codegen"
import { xlinkContracts } from "../../generated/smartContract/contracts_xlink"
import { STACKS_MAINNET, STACKS_TESTNET } from "../config"
import { BigNumber, BigNumberSource } from "../utils/BigNumber"
import { KnownChainId, KnownTokenId } from "../utils/types/knownIds"
import {
  isStacksContractAddressEqual,
  StacksContractAddress,
} from "../xlinkSdkUtils/types"
import { SDKGlobalContext } from "../xlinkSdkUtils/types.internal"
import {
  StacksContractName,
  stxContractAddresses,
  stxTokenContractAddresses_legacy,
} from "./stxContractAddresses"
import { getAllStacksTokens } from "./apiHelpers/getAllStacksTokens"

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

export const getStacksContractCallInfo = <C extends StacksContractName>(
  chainId: KnownChainId.StacksChain,
  contractName: C,
):
  | undefined
  | (Omit<StacksContractAddress, "contractName"> & {
      contractName: C
      network: StacksNetwork
      executeOptions: {
        deployerAddress?: string
        senderAddress?: string
        callReadOnlyFunction?: CallReadOnlyFunctionFn
      }
    }) => {
  const network =
    chainId === KnownChainId.Stacks.Mainnet ? STACKS_MAINNET : STACKS_TESTNET

  if (stxContractAddresses[contractName][chainId] == null) {
    return undefined
  }

  return {
    ...stxContractAddresses[contractName][chainId],
    contractName,
    network,
    executeOptions: {
      deployerAddress:
        stxContractAddresses[contractName][chainId].deployerAddress,
      callReadOnlyFunction(callOptions) {
        return callReadOnlyFunction({
          ...callOptions,
          contractAddress:
            stxContractAddresses[contractName][chainId].deployerAddress,
          contractName:
            stxContractAddresses[contractName][chainId].contractName,
          network,
        })
      },
    },
  }
}

export const getStacksTokenContractInfo = async (
  ctx: SDKGlobalContext,
  chainId: KnownChainId.StacksChain,
  tokenId: KnownTokenId.StacksToken,
): Promise<
  undefined | (StacksContractAddress & { network: StacksNetwork })
> => {
  let address: StacksContractAddress | undefined
  if (stxTokenContractAddresses_legacy[tokenId]?.[chainId] != null) {
    address = stxTokenContractAddresses_legacy[tokenId][chainId]
  } else {
    const allTokens = await getAllStacksTokens(ctx, chainId)
    for (const token of allTokens) {
      if (token.stacksTokenId === tokenId) {
        address = token.contractAddress
        break
      }
    }
  }

  if (address == null) {
    return undefined
  }

  const network =
    chainId === KnownChainId.Stacks.Mainnet ? STACKS_MAINNET : STACKS_TESTNET

  return { ...address, network }
}

export async function getStacksToken(
  ctx: SDKGlobalContext,
  chain: KnownChainId.StacksChain,
  tokenAddress: StacksContractAddress,
): Promise<undefined | KnownTokenId.StacksToken> {
  for (const token of Object.keys(
    stxTokenContractAddresses_legacy,
  ) as (keyof typeof stxTokenContractAddresses_legacy)[]) {
    const info = stxTokenContractAddresses_legacy[token]?.[chain]
    if (info == null) continue

    if (isStacksContractAddressEqual(info, tokenAddress)) {
      return token as KnownTokenId.StacksToken
    }
  }

  const allTokens = await getAllStacksTokens(ctx, chain)
  for (const token of allTokens) {
    if (isStacksContractAddressEqual(token.contractAddress, tokenAddress)) {
      return token.stacksTokenId
    }

    if (token.underlyingToken != null) {
      if (
        isStacksContractAddressEqual(
          token.underlyingToken.contractAddress,
          tokenAddress,
        )
      ) {
        return token.stacksTokenId
      }
    }
  }

  return
}
