import { CallReadOnlyFunctionFn, unwrapResponse } from "clarity-codegen"
import { checkNever } from "../utils/typeHelpers"
import { executeReadonlyCallXLINK } from "./xlinkContractHelpers"
import { StacksNetwork } from "@stacks/network"
import { callReadOnlyFunction } from "@stacks/transactions"

export interface BridgeSwapRouteNode {
  poolId: bigint
  tokenContractAddress: `${string}.${string}::${string}`
}

export type BridgeSwapRoute_BitcoinToStacks =
  | []
  | [BridgeSwapRouteNode]
  | [BridgeSwapRouteNode, BridgeSwapRouteNode]
  | [BridgeSwapRouteNode, BridgeSwapRouteNode, BridgeSwapRouteNode]

export async function createBridgeOrder_BitcoinToStack(info: {
  endpointDeployerAddress: string
  network: StacksNetwork
  receiverStxAddr: string
  swapSlippedAmount: bigint
  swapRoute: BridgeSwapRoute_BitcoinToStacks
}): Promise<{ data: Uint8Array }> {
  let data: undefined | Uint8Array

  const { swapRoute, receiverStxAddr, swapSlippedAmount } = info
  const executeOptions = {
    deployerAddress: info.endpointDeployerAddress,
    callReadOnlyFunction: (callOptions =>
      callReadOnlyFunction({
        ...callOptions,
        network: info.network,
      })) satisfies CallReadOnlyFunctionFn,
  }

  if (swapRoute.length === 0) {
    data = await executeReadonlyCallXLINK(
      "btc-bridge-endpoint-v1-11",
      "create-order-0-or-fail",
      { order: receiverStxAddr },
      executeOptions,
    ).then(unwrapResponse)
  } else if (swapRoute.length === 1) {
    data = await executeReadonlyCallXLINK(
      "btc-bridge-endpoint-v1-11",
      "create-order-1-or-fail",
      {
        order: {
          "pool-id": swapRoute[0].poolId,
          "min-dy": swapSlippedAmount,
          user: receiverStxAddr,
        },
      },
      executeOptions,
    ).then(unwrapResponse)
  } else if (swapRoute.length === 2) {
    data = await executeReadonlyCallXLINK(
      "btc-bridge-endpoint-v1-11",
      "create-order-2-or-fail",
      {
        order: {
          "pool1-id": swapRoute[0].poolId,
          "pool2-id": swapRoute[1].poolId,
          "min-dz": swapSlippedAmount,
          user: receiverStxAddr,
        },
      },
      executeOptions,
    ).then(unwrapResponse)
  } else if (swapRoute.length === 3) {
    data = await executeReadonlyCallXLINK(
      "btc-bridge-endpoint-v1-11",
      "create-order-3-or-fail",
      {
        order: {
          "pool1-id": swapRoute[0].poolId,
          "pool2-id": swapRoute[1].poolId,
          "pool3-id": swapRoute[2].poolId,
          "min-dw": swapSlippedAmount,
          user: receiverStxAddr,
        },
      },
      executeOptions,
    ).then(unwrapResponse)
  } else {
    checkNever(swapRoute)
  }

  return { data: data! }
}
