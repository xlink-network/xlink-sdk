import * as btc from "@scure/btc-signer"
import {
  broadcastTransaction,
  deserializeTransaction,
} from "@stacks/transactions"
import { ContractCallOptions } from "clarity-codegen"
import { addressToScriptPubKey } from "../bitcoinUtils/bitcoinHelpers"
import { contractAssignedChainIdFromBridgeChain } from "../ethereumUtils/crossContractDataMapping"
import {
  composeTxXLINK,
  getContractCallInfo,
  getTokenContractInfo,
  numberToStacksContractNumber,
} from "../stacksUtils/xlinkContractHelpers"
import {
  buildSupportedRoutes,
  defineRoute,
} from "../utils/buildSupportedRoutes"
import { decodeHex } from "../utils/hexHelpers"
import {
  StacksTransactionBroadcastError,
  UnsupportedBridgeRouteError,
} from "../utils/errors"
import { checkNever } from "../utils/typeHelpers"
import { KnownChainId, KnownTokenId } from "../utils/types.internal"
import { ChainId, TokenId } from "./types"
import { stxTokenContractAddresses } from "../stacksUtils/stxContractAddresses"

export const supportedRoutes = buildSupportedRoutes(
  [
    // from mainnet
    defineRoute(
      [KnownChainId.Stacks.Mainnet, KnownChainId.Bitcoin.Mainnet],
      [[KnownTokenId.Stacks.aBTC, KnownTokenId.Bitcoin.BTC]],
    ),
    defineRoute(
      [KnownChainId.Stacks.Mainnet, KnownChainId.Ethereum.Mainnet],
      [
        [KnownTokenId.Stacks.aBTC, KnownTokenId.Ethereum.WBTC],
        [KnownTokenId.Stacks.sUSDT, KnownTokenId.Ethereum.USDT],
        [KnownTokenId.Stacks.sLUNR, KnownTokenId.Ethereum.LUNR],
        [KnownTokenId.Stacks.ALEX, KnownTokenId.Ethereum.ALEX],
        [KnownTokenId.Stacks.sSKO, KnownTokenId.Ethereum.SKO],
      ],
    ),
    defineRoute(
      [KnownChainId.Stacks.Mainnet, KnownChainId.Ethereum.BSC],
      [
        [KnownTokenId.Stacks.aBTC, KnownTokenId.Ethereum.BTCB],
        [KnownTokenId.Stacks.sUSDT, KnownTokenId.Ethereum.USDT],
        [KnownTokenId.Stacks.sLUNR, KnownTokenId.Ethereum.LUNR],
        [KnownTokenId.Stacks.ALEX, KnownTokenId.Ethereum.ALEX],
        [KnownTokenId.Stacks.sSKO, KnownTokenId.Ethereum.SKO],
      ],
    ),

    // from testnet
    defineRoute(
      [KnownChainId.Stacks.Testnet, KnownChainId.Bitcoin.Testnet],
      [[KnownTokenId.Stacks.aBTC, KnownTokenId.Bitcoin.BTC]],
    ),
    defineRoute(
      [KnownChainId.Stacks.Testnet, KnownChainId.Ethereum.Sepolia],
      [
        [KnownTokenId.Stacks.aBTC, KnownTokenId.Ethereum.WBTC],
        [KnownTokenId.Stacks.sUSDT, KnownTokenId.Ethereum.USDT],
        [KnownTokenId.Stacks.sLUNR, KnownTokenId.Ethereum.LUNR],
        [KnownTokenId.Stacks.ALEX, KnownTokenId.Ethereum.ALEX],
        [KnownTokenId.Stacks.sSKO, KnownTokenId.Ethereum.SKO],
      ],
    ),
    defineRoute(
      [KnownChainId.Stacks.Testnet, KnownChainId.Ethereum.BSCTest],
      [
        [KnownTokenId.Stacks.aBTC, KnownTokenId.Ethereum.BTCB],
        [KnownTokenId.Stacks.sUSDT, KnownTokenId.Ethereum.USDT],
        [KnownTokenId.Stacks.sLUNR, KnownTokenId.Ethereum.LUNR],
        [KnownTokenId.Stacks.ALEX, KnownTokenId.Ethereum.ALEX],
        [KnownTokenId.Stacks.sSKO, KnownTokenId.Ethereum.SKO],
      ],
    ),
  ],
  {
    async isAvailable(route) {
      if (
        route.fromChain === KnownChainId.Stacks.Mainnet ||
        route.fromChain === KnownChainId.Stacks.Testnet
      ) {
        return (
          stxTokenContractAddresses[route.fromToken]?.[route.fromChain] != null
        )
      }

      if (
        route.toChain === KnownChainId.Stacks.Mainnet ||
        route.toChain === KnownChainId.Stacks.Testnet
      ) {
        return stxTokenContractAddresses[route.toToken]?.[route.toChain] != null
      }

      checkNever(route)
      return false
    },
  },
)

export interface BridgeFromStacksInput {
  fromChain: ChainId
  toChain: ChainId
  fromToken: TokenId
  toToken: TokenId
  toAddress: string
  amount: string
  signTransaction: (tx: ContractCallOptions) => Promise<{
    transactionHex: string
  }>
}

export interface BridgeFromStacksOutput {
  txid: string
}

export async function bridgeFromStacks(
  info: BridgeFromStacksInput,
): Promise<BridgeFromStacksOutput> {
  const route = await supportedRoutes.pickLeftToRightRouteOrThrow(
    info.fromChain,
    info.toChain,
    info.fromToken,
    info.toToken,
  )

  if (
    route.fromChain === KnownChainId.Stacks.Mainnet ||
    route.fromChain === KnownChainId.Stacks.Testnet
  ) {
    if (
      route.toChain === KnownChainId.Bitcoin.Mainnet ||
      route.toChain === KnownChainId.Bitcoin.Testnet
    ) {
      return bridgeFromStacks_toBitcoin({
        ...info,
        fromChain: route.fromChain,
        toChain: route.toChain,
      })
    }

    if (
      route.toChain === KnownChainId.Ethereum.Mainnet ||
      route.toChain === KnownChainId.Ethereum.Sepolia ||
      route.toChain === KnownChainId.Ethereum.BSC ||
      route.toChain === KnownChainId.Ethereum.BSCTest
    ) {
      return bridgeFromStacks_toEthereum({
        ...info,
        fromChain: route.fromChain,
        toChain: route.toChain,
      })
    }

    checkNever(route)
  } else {
    checkNever(route)
  }

  throw new UnsupportedBridgeRouteError(
    info.fromChain,
    info.toChain,
    info.fromToken,
    info.toToken,
  )
}

async function bridgeFromStacks_toBitcoin(
  info: Omit<BridgeFromStacksInput, "fromChain" | "toChain"> & {
    fromChain:
      | typeof KnownChainId.Stacks.Mainnet
      | typeof KnownChainId.Stacks.Testnet
    toChain:
      | typeof KnownChainId.Bitcoin.Mainnet
      | typeof KnownChainId.Bitcoin.Testnet
  },
): Promise<BridgeFromStacksOutput> {
  const contractCallInfo = getContractCallInfo(info.fromChain)
  if (!contractCallInfo) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const { network: stacksNetwork, deployerAddress } = contractCallInfo

  const bitcoinNetwork =
    info.toChain === KnownChainId.Bitcoin.Mainnet
      ? btc.NETWORK
      : btc.TEST_NETWORK

  const options = composeTxXLINK(
    "btc-bridge-endpoint-v1-11",
    "request-peg-out-0",
    {
      "peg-out-address": addressToScriptPubKey(bitcoinNetwork, info.toAddress),
      amount: numberToStacksContractNumber(info.amount),
    },
    { deployerAddress },
  )

  const { transactionHex } = await info.signTransaction(options)

  const broadcastResponse = await broadcastTransaction(
    deserializeTransaction(transactionHex),
    stacksNetwork,
  )

  if (broadcastResponse.error) {
    throw new StacksTransactionBroadcastError(broadcastResponse)
  }

  return { txid: broadcastResponse.txid }
}

async function bridgeFromStacks_toEthereum(
  info: Omit<BridgeFromStacksInput, "fromChain" | "toChain"> & {
    fromChain:
      | typeof KnownChainId.Stacks.Mainnet
      | typeof KnownChainId.Stacks.Testnet
    toChain:
      | typeof KnownChainId.Ethereum.Mainnet
      | typeof KnownChainId.Ethereum.Sepolia
      | typeof KnownChainId.Ethereum.BSC
      | typeof KnownChainId.Ethereum.BSCTest
  },
): Promise<BridgeFromStacksOutput> {
  const contractCallInfo = getContractCallInfo(info.fromChain)
  const tokenContractInfo = getTokenContractInfo(info.fromChain, info.fromToken)
  if (contractCallInfo == null || tokenContractInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const options = composeTxXLINK(
    "cross-bridge-endpoint-v1-03",
    "transfer-to-unwrap",
    {
      "token-trait": `${tokenContractInfo.deployerAddress}.${tokenContractInfo.contractName}`,
      "amount-in-fixed": numberToStacksContractNumber(info.amount),
      "the-chain-id": contractAssignedChainIdFromBridgeChain(info.toChain),
      "settle-address": decodeHex(info.toAddress),
    },
    { deployerAddress: contractCallInfo.deployerAddress },
  )

  const { transactionHex } = await info.signTransaction(options)

  const broadcastResponse = await broadcastTransaction(
    deserializeTransaction(transactionHex),
    contractCallInfo.network,
  )

  if (broadcastResponse.error) {
    throw new StacksTransactionBroadcastError(broadcastResponse)
  }

  return { txid: broadcastResponse.txid }
}
