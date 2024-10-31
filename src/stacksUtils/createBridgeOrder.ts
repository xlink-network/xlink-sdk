import { callReadOnlyFunction } from "@stacks/transactions"
import { CallReadOnlyFunctionFn, unwrapResponse } from "clarity-codegen"
import { toCorrespondingStacksToken } from "../evmUtils/peggingHelpers"
import { hasLength } from "../utils/arrayHelpers"
import { UnsupportedBridgeRouteError } from "../utils/errors"
import { decodeHex } from "../utils/hexHelpers"
import { checkNever } from "../utils/typeHelpers"
import { KnownChainId, KnownTokenId } from "../utils/types/knownIds"
import { StacksContractAddress } from "../xlinkSdkUtils/types"
import { contractAssignedChainIdFromKnownChain } from "./crossContractDataMapping"
import { getTerminatingStacksTokenContractAddress } from "./stxContractAddresses"
import {
  addressToBuffer,
  executeReadonlyCallXLINK,
  getStacksContractCallInfo,
  getStacksTokenContractInfo,
} from "./xlinkContractHelpers"

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

export interface CreateBridgeOrderResult {
  terminatingStacksToken: StacksContractAddress
  data: Uint8Array
}

export async function createBridgeOrder_BitcoinToStacks(info: {
  fromChain: KnownChainId.BitcoinChain
  fromBitcoinScriptPubKey: Uint8Array
  toChain: KnownChainId.StacksChain
  toToken: KnownTokenId.StacksToken
  toStacksAddress: string
  swapRoute: BridgeSwapRoute_FromBitcoin
  swapSlippedAmount?: bigint
}): Promise<undefined | CreateBridgeOrderResult> {
  let data: undefined | Uint8Array

  const contractCallInfo = getStacksContractCallInfo(
    info.toChain,
    "btc-peg-in-endpoint",
  )
  if (contractCallInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
      info.toToken,
    )
  }

  const { swapRoute, toStacksAddress /*, swapSlippedAmount = 0n */ } = info
  const executeOptions = {
    deployerAddress: contractCallInfo.deployerAddress,
    callReadOnlyFunction: (callOptions =>
      callReadOnlyFunction({
        ...callOptions,
        network: contractCallInfo.network,
      })) satisfies CallReadOnlyFunctionFn,
  }

  const targetTokenContractInfo = getStacksTokenContractInfo(
    info.toChain,
    info.toToken,
  )
  if (targetTokenContractInfo == null) {
    return undefined
  }

  if (hasLength(swapRoute, 0)) {
    data = await executeReadonlyCallXLINK(
      "btc-peg-in-endpoint-v2-04",
      "create-order-cross-or-fail",
      {
        order: {
          from: info.fromBitcoinScriptPubKey,
          to: addressToBuffer(info.toChain, toStacksAddress),
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

  return {
    terminatingStacksToken: targetTokenContractInfo,
    data: data!,
  }
}

export async function createBridgeOrder_BitcoinToEVM(info: {
  fromChain: KnownChainId.BitcoinChain
  fromBitcoinScriptPubKey: Uint8Array
  toChain: KnownChainId.EVMChain
  toToken: KnownTokenId.EVMToken
  toEVMAddress: string
  swapRoute: BridgeSwapRoute_FromBitcoin
  swapSlippedAmount?: bigint
}): Promise<undefined | CreateBridgeOrderResult> {
  const contractCallInfo = getStacksContractCallInfo(
    info.fromChain === KnownChainId.Bitcoin.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet,
    "btc-peg-in-endpoint",
  )
  if (contractCallInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
      info.toToken,
    )
  }

  const { swapRoute, toEVMAddress /*, swapSlippedAmount = 0n */ } = info
  const executeOptions = {
    deployerAddress: contractCallInfo.deployerAddress,
    callReadOnlyFunction: (callOptions =>
      callReadOnlyFunction({
        ...callOptions,
        network: contractCallInfo.network,
      })) satisfies CallReadOnlyFunctionFn,
  }

  const targetChainId = contractAssignedChainIdFromKnownChain(info.toChain)

  const swappedStacksToken = await toCorrespondingStacksToken(info.toToken)
  if (swappedStacksToken == null) return undefined
  const swappedStacksTokenAddress = getStacksTokenContractInfo(
    contractCallInfo.network.isMainnet()
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet,
    swappedStacksToken,
  )
  if (swappedStacksTokenAddress == null) return undefined

  const terminatingStacksTokenAddress =
    getTerminatingStacksTokenContractAddress({
      fromChain: contractCallInfo.network.isMainnet()
        ? KnownChainId.Stacks.Mainnet
        : KnownChainId.Stacks.Testnet,
      fromToken: swappedStacksToken,
      toChain: info.toChain,
      toToken: info.toToken,
    }) ?? swappedStacksTokenAddress

  let data: undefined | Uint8Array
  if (hasLength(swapRoute, 0)) {
    data = await executeReadonlyCallXLINK(
      "btc-peg-in-endpoint-v2-04",
      "create-order-cross-or-fail",
      {
        order: {
          from: info.fromBitcoinScriptPubKey,
          to: decodeHex(toEVMAddress),
          "chain-id": targetChainId,
          token: `${swappedStacksTokenAddress.deployerAddress}.${swappedStacksTokenAddress.contractName}`,
          "token-out": `${terminatingStacksTokenAddress.deployerAddress}.${terminatingStacksTokenAddress.contractName}`,
        },
      },
      executeOptions,
    ).then(unwrapResponse)
  } else {
    checkNever(swapRoute)
  }

  return {
    terminatingStacksToken: {
      deployerAddress: terminatingStacksTokenAddress.deployerAddress,
      contractName: terminatingStacksTokenAddress.contractName,
    },
    data: data!,
  }
}
