import { callReadOnlyFunction } from "@stacks/transactions"
import { CallReadOnlyFunctionFn, Response } from "clarity-codegen"
import { hasLength } from "../utils/arrayHelpers"
import { checkNever } from "../utils/typeHelpers"
import { KnownChainId } from "../utils/types/knownIds"
import { StacksContractAddress } from "../xlinkSdkUtils/types"
import { BridgeSwapRoute_FromBitcoin } from "./createBridgeOrder"
import {
  executeReadonlyCallXLINK,
  getStacksContractCallInfo,
} from "./xlinkContractHelpers"

export async function validateBridgeOrder(info: {
  chainId: KnownChainId.BitcoinChain
  commitTx: Uint8Array
  revealTx: Uint8Array
  terminatingStacksToken: StacksContractAddress
  swapRoute: BridgeSwapRoute_FromBitcoin
}): Promise<void> {
  const contractCallInfo = getStacksContractCallInfo(
    info.chainId === KnownChainId.Bitcoin.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet,
    "btc-peg-in-endpoint-v2-05",
  )
  if (contractCallInfo == null) {
    throw new Error(
      "[validateBridgeOrder_BitcoinToEVM] stacks contract information not found",
    )
  }

  const { commitTx, revealTx, swapRoute } = info
  const executeOptions = {
    deployerAddress: contractCallInfo.deployerAddress,
    callReadOnlyFunction: (callOptions =>
      callReadOnlyFunction({
        ...callOptions,
        network: contractCallInfo.network,
      })) satisfies CallReadOnlyFunctionFn,
  }

  let resp: Response<any>

  if (hasLength(swapRoute, 0)) {
    resp = await executeReadonlyCallXLINK(
      contractCallInfo.contractName,
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
        "token-out-trait": `${info.terminatingStacksToken.deployerAddress}.${info.terminatingStacksToken.contractName}`,
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
