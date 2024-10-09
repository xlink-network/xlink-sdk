import { StacksNetwork } from "@stacks/network"
import { callReadOnlyFunction } from "@stacks/transactions"
import { CallReadOnlyFunctionFn, Response } from "clarity-codegen"
import { hasLength } from "../utils/arrayHelpers"
import { checkNever } from "../utils/typeHelpers"
import { BridgeSwapRoute_FromBitcoin } from "./createBridgeOrder"
import { executeReadonlyCallXLINK } from "./xlinkContractHelpers"

export async function validateBridgeOrder_BitcoinToStacks(
  contractCallInfo: {
    network: StacksNetwork
    endpointDeployerAddress: string
  },
  info: {
    btcTx: Uint8Array
    swapRoute: BridgeSwapRoute_FromBitcoin
  },
): Promise<void> {
  const { btcTx, swapRoute } = info
  const executeOptions = {
    deployerAddress: contractCallInfo.endpointDeployerAddress,
    callReadOnlyFunction: (callOptions =>
      callReadOnlyFunction({
        ...callOptions,
        network: contractCallInfo.network,
      })) satisfies CallReadOnlyFunctionFn,
  }

  let resp: Response<any>

  if (hasLength(swapRoute, 0)) {
    resp = await executeReadonlyCallXLINK(
      "btc-peg-in-endpoint-v2-03",
      "validate-tx-0",
      {
        tx: btcTx,
        "output-idx": 0n,
        "order-idx": 2n,
      },
      executeOptions,
    )
    // } else if (swapRoute.length === 1) {
    //   resp = await executeReadonlyCallXLINK(
    //     "btc-peg-in-endpoint-v2-01",
    //     "validate-tx-1",
    //     {
    //       tx: btcTx,
    //       "output-idx": 0n,
    //       "order-idx": 2n,
    //       token: swapRoute[0].tokenContractAddress,
    //     },
    //     executeOptions,
    //   )
    // } else if (swapRoute.length === 2) {
    //   resp = await executeReadonlyCallXLINK(
    //     "btc-peg-in-endpoint-v2-01",
    //     "validate-tx-2",
    //     {
    //       tx: btcTx,
    //       "output-idx": 0n,
    //       "order-idx": 2n,
    //       token1: swapRoute[0].tokenContractAddress,
    //       token2: swapRoute[1].tokenContractAddress,
    //     },
    //     executeOptions,
    //   )
    // } else if (swapRoute.length === 3) {
    //   resp = await executeReadonlyCallXLINK(
    //     "btc-peg-in-endpoint-v2-01",
    //     "validate-tx-3",
    //     {
    //       tx: btcTx,
    //       "output-idx": 0n,
    //       "order-idx": 2n,
    //       token1: swapRoute[0].tokenContractAddress,
    //       token2: swapRoute[1].tokenContractAddress,
    //       token3: swapRoute[2].tokenContractAddress,
    //     },
    //     executeOptions,
    //   )
  } else {
    checkNever(swapRoute)
    throw new Error(
      `[validateBridgeOrder_BitcoinToStack] unsupported swap route length: ${(swapRoute as any).length}`,
    )
  }

  if (resp.type === "success") return

  throw resp.error
}

export async function validateBridgeOrder_BitcoinToEVM(
  contractCallInfo: {
    network: StacksNetwork
    endpointDeployerAddress: string
  },
  info: {
    commitTx: Uint8Array
    revealTx: Uint8Array
    intermediateStacksToken: {
      deployerAddress: string
      contractName: string
    }
    swapRoute: BridgeSwapRoute_FromBitcoin
  },
): Promise<void> {
  const { commitTx, revealTx, swapRoute } = info
  const executeOptions = {
    deployerAddress: contractCallInfo.endpointDeployerAddress,
    callReadOnlyFunction: (callOptions =>
      callReadOnlyFunction({
        ...callOptions,
        network: contractCallInfo.network,
      })) satisfies CallReadOnlyFunctionFn,
  }

  let resp: Response<any>

  if (hasLength(swapRoute, 0)) {
    resp = await executeReadonlyCallXLINK(
      "btc-peg-in-endpoint-v2-03",
      "validate-tx-cross",
      {
        "commit-tx": {
          tx: commitTx,
          "output-idx": 1n,
        },
        "reveal-tx": {
          tx: revealTx,
          "order-idx": 0n,
        },
        "token-trait": `${info.intermediateStacksToken.deployerAddress}.${info.intermediateStacksToken.contractName}`,
      },
      executeOptions,
    )
  } else {
    checkNever(swapRoute)
    throw new Error(
      `[validateBridgeOrder_BitcoinToEVM] unsupported swap route length: ${(swapRoute as any).length}`,
    )
  }

  if (resp.type === "success") return

  throw resp.error
}
