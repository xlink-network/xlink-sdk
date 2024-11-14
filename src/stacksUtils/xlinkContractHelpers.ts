import { StacksNetwork } from "@stacks/network"
import { callReadOnlyFunction } from "@stacks/transactions"
import {
  CallReadOnlyFunctionFn,
  composeTxOptionsFactory,
  executeReadonlyCallFactory,
} from "clarity-codegen"
import { xlinkContracts } from "../../generated/smartContract/contracts_xlink"
import { STACKS_MAINNET, STACKS_TESTNET } from "../config"
import { requestAPI } from "../utils/apiHelpers"
import { BigNumber, BigNumberSource } from "../utils/BigNumber"
import {
  createStacksToken,
  KnownChainId,
  KnownTokenId,
} from "../utils/types/knownIds"
import {
  isStacksContractAddressEqual,
  StacksContractAddress,
} from "../xlinkSdkUtils/types"
import { SDKGlobalContext } from "../xlinkSdkUtils/types.internal"
import {
  StacksContractName,
  stxContractAddresses,
  stxTokenContractAddresses,
} from "./stxContractAddresses"

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

// const _composeTxXLINK = composeTxOptionsFactory(xlinkContracts, {})
// export const composeTxXLINK: typeof _composeTxXLINK = (...args) => {
//   const res = _composeTxXLINK(...args)
//   return {
//     ...res,
//     contractName:
//       (contractNameOverrides as any)?.[res.contractName] ?? res.contractName,
//   }
// }

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
  if (stxTokenContractAddresses[tokenId]?.[chainId] != null) {
    address = stxTokenContractAddresses[tokenId][chainId]
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
    stxTokenContractAddresses,
  ) as (keyof typeof stxTokenContractAddresses)[]) {
    const info = stxTokenContractAddresses[token]?.[chain]
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

const getAllStacksTokens = (
  ctx: SDKGlobalContext,
  chain: KnownChainId.StacksChain,
): Promise<StacksTokenInfo[]> => {
  const cache = ctx.stacks.tokensCache

  if (cache == null) {
    return getAllStacksTokensImpl(ctx, chain)
  }

  const cached = cache.get(chain)
  if (cached == null) {
    const promise = getAllStacksTokensImpl(ctx, chain).catch(e => {
      if (cache.get(chain) === promise) {
        cache.delete(chain)
      }
      throw e
    })
    cache.set(chain, promise)
  }
  return cache.get(chain)!
}
const getAllStacksTokensImpl = async (
  ctx: SDKGlobalContext,
  chain: KnownChainId.StacksChain,
): Promise<StacksTokenInfo[]> => {
  const res = await requestAPI<{ tokens: StacksTokenFromAPI[] }>(ctx, {
    method: "GET",
    path: "/2024-10-01/stacks/tokens",
    query: {
      network: chain === KnownChainId.Stacks.Mainnet ? "mainnet" : "testnet",
    },
  })
  return res.tokens.map(info => ({
    stacksTokenId: createStacksToken(info.id),
    contractAddress: info.contractAddress,
    decimals: info.decimals,
    underlyingToken: info.underlyingToken,
  }))
}
export interface StacksTokenInfo {
  stacksTokenId: KnownTokenId.StacksToken
  contractAddress: StacksContractAddress
  decimals: number
  underlyingToken?: {
    contractAddress: StacksContractAddress
    decimals: number
  }
}
interface StacksTokenFromAPI {
  id: string
  contractAddress: StacksContractAddress
  decimals: number
  underlyingToken?: {
    contractAddress: StacksContractAddress
    decimals: number
  }
}
