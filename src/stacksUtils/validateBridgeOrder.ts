import { CallReadOnlyFunctionFn, Response } from "clarity-codegen"
import { checkNever } from "../utils/typeHelpers"
import { executeReadonlyCallXLINK } from "./xlinkContractHelpers"
import { BridgeSwapRoute_BitcoinToStacks } from "./createBridgeOrder"
import { callReadOnlyFunction } from "@stacks/transactions"
import { StacksNetwork } from "@stacks/network"

export async function validateBridgeOrder_BitcoinToStack(info: {
  endpointDeployerAddress: string
  network: StacksNetwork
  btcTx: Uint8Array
  swapRoute: BridgeSwapRoute_BitcoinToStacks
}): Promise<void> {
  const { btcTx, swapRoute } = info
  const executeOptions = {
    deployerAddress: info.endpointDeployerAddress,
    callReadOnlyFunction: (callOptions =>
      callReadOnlyFunction({
        ...callOptions,
        network: info.network,
      })) satisfies CallReadOnlyFunctionFn,
  }

  let resp: Response<any>

  if (swapRoute.length === 0) {
    resp = await executeReadonlyCallXLINK(
      "btc-bridge-endpoint-v1-11",
      "validate-tx-0",
      {
        tx: btcTx,
        "output-idx": 0n,
        "order-idx": 2n,
      },
      executeOptions,
    )
  } else if (swapRoute.length === 1) {
    resp = await executeReadonlyCallXLINK(
      "btc-bridge-endpoint-v1-11",
      "validate-tx-1",
      {
        tx: btcTx,
        "output-idx": 0n,
        "order-idx": 2n,
        token: swapRoute[0].tokenContractAddress,
      },
      executeOptions,
    )
  } else if (swapRoute.length === 2) {
    resp = await executeReadonlyCallXLINK(
      "btc-bridge-endpoint-v1-11",
      "validate-tx-2",
      {
        tx: btcTx,
        "output-idx": 0n,
        "order-idx": 2n,
        token1: swapRoute[0].tokenContractAddress,
        token2: swapRoute[1].tokenContractAddress,
      },
      executeOptions,
    )
  } else if (swapRoute.length === 3) {
    resp = await executeReadonlyCallXLINK(
      "btc-bridge-endpoint-v1-11",
      "validate-tx-3",
      {
        tx: btcTx,
        "output-idx": 0n,
        "order-idx": 2n,
        token1: swapRoute[0].tokenContractAddress,
        token2: swapRoute[1].tokenContractAddress,
        token3: swapRoute[2].tokenContractAddress,
      },
      executeOptions,
    )
  } else {
    checkNever(swapRoute)
    throw new Error(
      `[validateBridgeOrder_BitcoinToStack] unsupported swap route length: ${(swapRoute as any).length}`,
    )
  }

  if (resp.type === "success") return

  throw resp.error
}
