import { StacksNetwork } from "@stacks/network"
import { callReadOnlyFunction } from "@stacks/transactions"
import { CallReadOnlyFunctionFn, unwrapResponse } from "clarity-codegen"
import { contractAssignedChainIdFromKnownChain } from "./crossContractDataMapping"
import { hasLength } from "../utils/arrayHelpers"
import { decodeHex } from "../utils/hexHelpers"
import { checkNever } from "../utils/typeHelpers"
import { KnownChainId, KnownTokenId } from "../utils/types/knownIds"
import {
  executeReadonlyCallXLINK,
  getStacksTokenContractInfo,
} from "./xlinkContractHelpers"
import { toCorrespondingStacksCurrency } from "../evmUtils/peggingHelpers"
import { getStacksAlternativeFromTokenContractAddress } from "./stxContractAddresses"

export interface BridgeSwapRouteNode {
  poolId: bigint
  tokenContractAddress: `${string}.${string}::${string}`
}

// prettier-ignore
export type BridgeSwapRoute_FromBitcoin =
  | []
// | [BridgeSwapRouteNode]
// | [BridgeSwapRouteNode, BridgeSwapRouteNode]
// | [BridgeSwapRouteNode, BridgeSwapRouteNode, BridgeSwapRouteNode]

export async function createBridgeOrder_BitcoinToStacks(
  contractCallInfo: {
    endpointDeployerAddress: string
    network: StacksNetwork
  },
  info: {
    targetToken: KnownTokenId.StacksToken
    fromBitcoinScriptPubKey: Uint8Array
    receiverAddr: string
    swapRoute: BridgeSwapRoute_FromBitcoin
    swapSlippedAmount?: bigint
  },
): Promise<undefined | { data: Uint8Array }> {
  let data: undefined | Uint8Array

  const { swapRoute, receiverAddr /*, swapSlippedAmount = 0n */ } = info
  const executeOptions = {
    deployerAddress: contractCallInfo.endpointDeployerAddress,
    callReadOnlyFunction: (callOptions =>
      callReadOnlyFunction({
        ...callOptions,
        network: contractCallInfo.network,
      })) satisfies CallReadOnlyFunctionFn,
  }

  const targetTokenContractInfo = getStacksTokenContractInfo(
    contractCallInfo.network.isMainnet()
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet,
    info.targetToken,
  )
  if (targetTokenContractInfo == null) {
    return undefined
  }

  if (hasLength(swapRoute, 0)) {
    data = await executeReadonlyCallXLINK(
      "btc-peg-in-endpoint-v2-03",
      "create-order-cross-or-fail",
      {
        order: {
          from: info.fromBitcoinScriptPubKey,
          to: decodeHex(receiverAddr),
          "chain-id": undefined,
          token: `${targetTokenContractInfo.deployerAddress}.${targetTokenContractInfo.contractName}`,
          "token-out": `${targetTokenContractInfo.deployerAddress}.${targetTokenContractInfo.contractName}`,
        },
      },
      executeOptions,
    ).then(unwrapResponse)
  } else {
    checkNever(swapRoute)
  }

  return { data: data! }
}

export async function createBridgeOrder_BitcoinToEVM(
  contractCallInfo: {
    endpointDeployerAddress: string
    network: StacksNetwork
  },
  info: {
    targetChain: KnownChainId.EVMChain
    targetToken: KnownTokenId.EVMToken
    fromBitcoinScriptPubKey: Uint8Array
    receiverAddr: string
    swapRoute: BridgeSwapRoute_FromBitcoin
    swapSlippedAmount?: bigint
  },
): Promise<
  | undefined
  | {
      intermediateStacksToken: {
        deployerAddress: string
        contractName: string
      }
      data: Uint8Array
    }
> {
  let data: undefined | Uint8Array

  const { swapRoute, receiverAddr /*, swapSlippedAmount = 0n */ } = info
  const executeOptions = {
    deployerAddress: contractCallInfo.endpointDeployerAddress,
    callReadOnlyFunction: (callOptions =>
      callReadOnlyFunction({
        ...callOptions,
        network: contractCallInfo.network,
      })) satisfies CallReadOnlyFunctionFn,
  }

  const targetChainId = contractAssignedChainIdFromKnownChain(info.targetChain)
  const targetTokenCorrespondingStacksToken =
    await toCorrespondingStacksCurrency(info.targetToken)
  if (targetTokenCorrespondingStacksToken == null) return undefined
  const targetTokenCorrespondingStacksTokenContractInfo =
    getStacksTokenContractInfo(
      contractCallInfo.network.isMainnet()
        ? KnownChainId.Stacks.Mainnet
        : KnownChainId.Stacks.Testnet,
      targetTokenCorrespondingStacksToken,
    )
  if (targetTokenCorrespondingStacksTokenContractInfo == null) {
    return undefined
  }

  const alternativeStacksTokenAddress =
    getStacksAlternativeFromTokenContractAddress(
      contractCallInfo.network.isMainnet()
        ? KnownChainId.Stacks.Mainnet
        : KnownChainId.Stacks.Testnet,
      targetTokenCorrespondingStacksToken,
      info.targetChain,
      info.targetToken,
    )
  const intermediateStacksTokenAddress =
    alternativeStacksTokenAddress ??
    targetTokenCorrespondingStacksTokenContractInfo

  if (hasLength(swapRoute, 0)) {
    data = await executeReadonlyCallXLINK(
      "btc-peg-in-endpoint-v2-03",
      "create-order-cross-or-fail",
      {
        order: {
          from: info.fromBitcoinScriptPubKey,
          to: decodeHex(receiverAddr),
          "chain-id": targetChainId,
          token: `${targetTokenCorrespondingStacksTokenContractInfo.deployerAddress}.${targetTokenCorrespondingStacksTokenContractInfo.contractName}`,
          "token-out": `${intermediateStacksTokenAddress.deployerAddress}.${intermediateStacksTokenAddress.contractName}`,
        },
      },
      executeOptions,
    ).then(unwrapResponse)
  } else {
    checkNever(swapRoute)
  }

  return {
    intermediateStacksToken: {
      deployerAddress: intermediateStacksTokenAddress.deployerAddress,
      contractName: intermediateStacksTokenAddress.contractName,
    },
    data: data!,
  }
}
