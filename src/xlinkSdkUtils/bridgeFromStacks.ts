import * as btc from "@scure/btc-signer"
import {
  broadcastTransaction,
  deserializeTransaction,
} from "@stacks/transactions"
import { ContractCallOptions } from "clarity-codegen"
import { addressToScriptPubKey } from "../bitcoinUtils/bitcoinHelpers"
import { getBTCPegInAddress } from "../bitcoinUtils/btcAddresses"
import { contractAssignedChainIdFromBridgeChain } from "../stacksUtils/crossContractDataMapping"
import { stxTokenContractAddresses } from "../stacksUtils/stxContractAddresses"
import {
  composeTxXLINK,
  getStacksContractCallInfo,
  getStacksTokenContractInfo,
  numberToStacksContractNumber,
} from "../stacksUtils/xlinkContractHelpers"
import {
  buildSupportedRoutes,
  defineRoute,
} from "../utils/buildSupportedRoutes"
import {
  StacksTransactionBroadcastError,
  UnsupportedBridgeRouteError,
} from "../utils/errors"
import { decodeHex } from "../utils/hexHelpers"
import { checkNever } from "../utils/typeHelpers"
import { KnownChainId, KnownTokenId } from "../utils/types.internal"
import { ChainId, TokenId } from "./types"
import { evmContractAddresses } from "../evmUtils/evmContractAddresses"

export const supportedRoutes = buildSupportedRoutes(
  [
    // from mainnet
    defineRoute(
      // to Bitcoin
      [[KnownChainId.Stacks.Mainnet, KnownChainId.Bitcoin.Mainnet]],
      [[KnownTokenId.Stacks.aBTC, KnownTokenId.Bitcoin.BTC]],
    ),
    defineRoute(
      // to Ethereum
      [[KnownChainId.Stacks.Mainnet, KnownChainId.EVM.Ethereum]],
      [
        [KnownTokenId.Stacks.aBTC, KnownTokenId.EVM.WBTC],
        [KnownTokenId.Stacks.ALEX, KnownTokenId.EVM.ALEX],
      ],
    ),
    defineRoute(
      // to BSC
      [[KnownChainId.Stacks.Mainnet, KnownChainId.EVM.BSC]],
      [
        [KnownTokenId.Stacks.aBTC, KnownTokenId.EVM.BTCB],
        [KnownTokenId.Stacks.sUSDT, KnownTokenId.EVM.USDT],
        [KnownTokenId.Stacks.ALEX, KnownTokenId.EVM.ALEX],
        [KnownTokenId.Stacks.sSKO, KnownTokenId.EVM.SKO],
      ],
    ),
    defineRoute(
      // to rest EVM chains
      [
        [KnownChainId.Stacks.Mainnet, KnownChainId.EVM.CoreDAO],
        [KnownChainId.Stacks.Mainnet, KnownChainId.EVM.Bsquared],
        [KnownChainId.Stacks.Mainnet, KnownChainId.EVM.BOB],
        [KnownChainId.Stacks.Mainnet, KnownChainId.EVM.Bitlayer],
        [KnownChainId.Stacks.Mainnet, KnownChainId.EVM.Lorenzo],
        [KnownChainId.Stacks.Mainnet, KnownChainId.EVM.Merlin],
      ],
      [
        [KnownTokenId.Stacks.aBTC, KnownTokenId.EVM.aBTC],
        [KnownTokenId.Stacks.ALEX, KnownTokenId.EVM.ALEX],
        [KnownTokenId.Stacks.vLiSTX, KnownTokenId.EVM.vLiSTX],
        [KnownTokenId.Stacks.vLiALEX, KnownTokenId.EVM.vLiALEX],
      ],
    ),

    // from testnet
  ],
  {
    async isAvailable(route) {
      if (!KnownChainId.isStacksChain(route.fromChain)) return false
      if (!KnownTokenId.isStacksToken(route.fromToken)) return false
      if (
        stxTokenContractAddresses[route.fromToken]?.[route.fromChain] == null
      ) {
        return false
      }

      if (KnownChainId.isStacksChain(route.toChain)) {
        return false
      }

      if (KnownChainId.isEVMChain(route.toChain)) {
        if (!KnownTokenId.isEVMToken(route.toToken)) return false
        return evmContractAddresses[route.toChain][route.toToken] != null
      }

      if (KnownChainId.isBitcoinChain(route.toChain)) {
        if (!KnownTokenId.isBitcoinToken(route.toToken)) return false
        return getBTCPegInAddress(route.toChain) != null
      }

      checkNever(route.toChain)
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

  if (KnownChainId.isStacksChain(route.fromChain)) {
    if (KnownChainId.isBitcoinChain(route.toChain)) {
      if (
        KnownTokenId.isStacksToken(route.fromToken) &&
        KnownTokenId.isBitcoinToken(route.toToken)
      ) {
        return bridgeFromStacks_toBitcoin({
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isEVMChain(route.toChain)) {
      if (
        KnownTokenId.isStacksToken(route.fromToken) &&
        KnownTokenId.isEVMToken(route.toToken)
      ) {
        return bridgeFromStacks_toEVM({
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else {
      checkNever(route.toChain)
    }
  } else {
    checkNever(route.fromChain)
  }

  throw new UnsupportedBridgeRouteError(
    info.fromChain,
    info.toChain,
    info.fromToken,
    info.toToken,
  )
}

async function bridgeFromStacks_toBitcoin(
  info: Omit<
    BridgeFromStacksInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > & {
    fromChain: KnownChainId.StacksChain
    toChain: KnownChainId.BitcoinChain
    fromToken: KnownTokenId.StacksToken
    toToken: KnownTokenId.BitcoinToken
  },
): Promise<BridgeFromStacksOutput> {
  const contractCallInfo = getStacksContractCallInfo(info.fromChain)
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
    "btc-peg-out-endpoint-v2-01",
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

async function bridgeFromStacks_toEVM(
  info: Omit<
    BridgeFromStacksInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > & {
    fromChain: KnownChainId.StacksChain
    toChain: KnownChainId.EVMChain
    fromToken: KnownTokenId.StacksToken
    toToken: KnownTokenId.EVMToken
  },
): Promise<BridgeFromStacksOutput> {
  const contractCallInfo = getStacksContractCallInfo(info.fromChain)
  const tokenContractInfo = getStacksTokenContractInfo(
    info.fromChain,
    info.fromToken,
  )
  if (contractCallInfo == null || tokenContractInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const options = composeTxXLINK(
    "cross-peg-out-endpoint-v2-01",
    "transfer-to-unwrap",
    {
      "token-trait": `${tokenContractInfo.deployerAddress}.${tokenContractInfo.contractName}`,
      "amount-in-fixed": numberToStacksContractNumber(info.amount),
      "dest-chain-id": contractAssignedChainIdFromBridgeChain(info.toChain),
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
