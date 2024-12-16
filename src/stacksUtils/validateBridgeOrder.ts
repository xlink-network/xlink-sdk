import { Response } from "clarity-codegen"
import { hasLength } from "../utils/arrayHelpers"
import { SwapRoute } from "../utils/SwapRouteHelpers"
import { KnownChainId } from "../utils/types/knownIds"
import { StacksContractAddress } from "../xlinkSdkUtils/types"
import { StacksContractName } from "./stxContractAddresses"
import {
  executeReadonlyCallXLINK,
  getStacksContractCallInfo,
} from "./xlinkContractHelpers"

export async function validateBridgeOrder(info: {
  chainId: KnownChainId.BitcoinChain
  commitTx: Uint8Array
  revealTx: Uint8Array
  terminatingStacksToken: StacksContractAddress
  swapRoute?: SwapRoute
}): Promise<void> {
  const contractBaseCallInfo = getStacksContractCallInfo(
    info.chainId === KnownChainId.Bitcoin.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet,
    StacksContractName.BTCPegInEndpoint,
  )
  const contractSwapCallInfo = getStacksContractCallInfo(
    info.chainId === KnownChainId.Bitcoin.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet,
    StacksContractName.BTCPegInEndpointSwap,
  )
  if (contractBaseCallInfo == null || contractSwapCallInfo == null) {
    throw new Error(
      "[validateBridgeOrder_BitcoinToEVM] stacks contract information not found",
    )
  }

  const { commitTx, revealTx, swapRoute } = info

  let resp: Response<any>

  if (swapRoute == null || hasLength(swapRoute.swapPools, 0)) {
    resp = await executeReadonlyCallXLINK(
      contractBaseCallInfo.contractName,
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
      contractBaseCallInfo.executeOptions,
    )
  } else if (swapRoute.swapPools.length < 4) {
    resp = await executeReadonlyCallXLINK(
      contractSwapCallInfo.contractName,
      "validate-tx-cross-swap",
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
        "routing-traits": [
          `${swapRoute.fromTokenAddress.deployerAddress}.${swapRoute.fromTokenAddress.contractName}`,
          ...swapRoute.swapPools.map(
            (pool): `${string}.${string}` =>
              `${pool.toTokenAddress.deployerAddress}.${pool.toTokenAddress.contractName}`,
          ),
        ],
      },
      contractSwapCallInfo.executeOptions,
    )
  } else {
    throw new Error(
      `[validateBridgeOrder_BitcoinToEVM] unsupported swap route length: ${(swapRoute as any).length}`,
    )
  }

  if (resp.type === "success") return

  throw resp.error
}
