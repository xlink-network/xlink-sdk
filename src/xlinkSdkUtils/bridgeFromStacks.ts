import * as btc from "@scure/btc-signer"
import { ContractCallOptions } from "clarity-codegen"
import { addressToScriptPubKey } from "../bitcoinUtils/bitcoinHelpers"
import { contractAssignedChainIdFromKnownChain } from "../stacksUtils/crossContractDataMapping"
import { isSupportedStacksRoute } from "../stacksUtils/peggingHelpers"
import {
  getTerminatingStacksTokenContractAddress,
  StacksContractName,
} from "../stacksUtils/stxContractAddresses"
import {
  composeTxXLINK,
  getStacksContractCallInfo,
  getStacksTokenContractInfo,
  numberToStacksContractNumber,
} from "../stacksUtils/xlinkContractHelpers"
import {
  buildSupportedRoutes,
  defineRoute,
  KnownRoute_FromStacks_ToBitcoin,
  KnownRoute_FromStacks_ToBRC20,
  KnownRoute_FromStacks_ToEVM,
  KnownRoute_FromStacks_ToRunes,
} from "../utils/buildSupportedRoutes"
import { UnsupportedBridgeRouteError } from "../utils/errors"
import { decodeHex } from "../utils/hexHelpers"
import { assertExclude, checkNever } from "../utils/typeHelpers"
import {
  _allKnownEVMMainnetChains,
  _allKnownEVMTestnetChains,
  KnownChainId,
  KnownTokenId,
} from "../utils/types/knownIds"
import { ChainId, SDKNumber, TokenId } from "./types"
import { SDKGlobalContext } from "./types.internal"

export const supportedRoutes = buildSupportedRoutes(
  [
    // from mainnet
    ...defineRoute(
      // to Bitcoin
      [[KnownChainId.Stacks.Mainnet], [KnownChainId.Bitcoin.Mainnet]],
      [[KnownTokenId.Stacks.aBTC, KnownTokenId.Bitcoin.BTC]],
    ),
    ...defineRoute(
      // to rest EVM chains
      [[KnownChainId.Stacks.Mainnet], [..._allKnownEVMMainnetChains]],
      [
        // BTCs
        [KnownTokenId.Stacks.aBTC, KnownTokenId.EVM.aBTC],
        [KnownTokenId.Stacks.aBTC, KnownTokenId.EVM.WBTC],
        [KnownTokenId.Stacks.aBTC, KnownTokenId.EVM.BTCB],
        [KnownTokenId.Stacks.aBTC, KnownTokenId.EVM.cbBTC],
        // USDTs
        [KnownTokenId.Stacks.sUSDT, KnownTokenId.EVM.USDT],
        [KnownTokenId.Stacks.sUSDT, KnownTokenId.EVM.sUSDT],
        // others
        [KnownTokenId.Stacks.sSKO, KnownTokenId.EVM.SKO],
        [KnownTokenId.Stacks.ALEX, KnownTokenId.EVM.ALEX],
        [KnownTokenId.Stacks.vLiSTX, KnownTokenId.EVM.vLiSTX],
        [KnownTokenId.Stacks.vLiALEX, KnownTokenId.EVM.vLiALEX],
        [KnownTokenId.Stacks.uBTC, KnownTokenId.EVM.uBTC],
        [KnownTokenId.Stacks.uBTC, KnownTokenId.EVM.wuBTC],
        [KnownTokenId.Stacks.DB20, KnownTokenId.EVM.DB20],
        [KnownTokenId.Stacks.DOG, KnownTokenId.EVM.DOG],
        [KnownTokenId.Stacks.STX, KnownTokenId.EVM.STX],
      ],
    ),

    // from testnet
    ...defineRoute(
      // to Bitcoin
      [[KnownChainId.Stacks.Testnet], [KnownChainId.Bitcoin.Testnet]],
      [[KnownTokenId.Stacks.aBTC, KnownTokenId.Bitcoin.BTC]],
    ),
    ...defineRoute(
      // to rest EVM chains
      [[KnownChainId.Stacks.Testnet], [..._allKnownEVMTestnetChains]],
      [
        // BTCs
        [KnownTokenId.Stacks.aBTC, KnownTokenId.EVM.aBTC],
        [KnownTokenId.Stacks.aBTC, KnownTokenId.EVM.WBTC],
        [KnownTokenId.Stacks.aBTC, KnownTokenId.EVM.BTCB],
        [KnownTokenId.Stacks.aBTC, KnownTokenId.EVM.cbBTC],
        // USDTs
        [KnownTokenId.Stacks.sUSDT, KnownTokenId.EVM.USDT],
        [KnownTokenId.Stacks.sUSDT, KnownTokenId.EVM.sUSDT],
        // others
        [KnownTokenId.Stacks.sSKO, KnownTokenId.EVM.SKO],
        [KnownTokenId.Stacks.ALEX, KnownTokenId.EVM.ALEX],
        [KnownTokenId.Stacks.vLiSTX, KnownTokenId.EVM.vLiSTX],
        [KnownTokenId.Stacks.vLiALEX, KnownTokenId.EVM.vLiALEX],
        [KnownTokenId.Stacks.uBTC, KnownTokenId.EVM.uBTC],
        [KnownTokenId.Stacks.uBTC, KnownTokenId.EVM.wuBTC],
        [KnownTokenId.Stacks.DB20, KnownTokenId.EVM.DB20],
        [KnownTokenId.Stacks.DOG, KnownTokenId.EVM.DOG],
        [KnownTokenId.Stacks.STX, KnownTokenId.EVM.STX],
      ],
    ),
  ],
  {
    isSupported: isSupportedStacksRoute,
  },
)

export interface BridgeFromStacksInput {
  fromChain: ChainId
  toChain: ChainId
  fromToken: TokenId
  toToken: TokenId
  fromAddress: string
  toAddress: string
  amount: SDKNumber
  sendTransaction: (tx: ContractCallOptions) => Promise<{
    txid: string
  }>
}

export interface BridgeFromStacksOutput {
  txid: string
}

export async function bridgeFromStacks(
  ctx: SDKGlobalContext,
  info: BridgeFromStacksInput,
): Promise<BridgeFromStacksOutput> {
  const route = await supportedRoutes.checkRouteValid(ctx, info)

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
        return bridgeFromStacks_toEVM(ctx, {
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isBRC20Chain(route.toChain)) {
      if (
        KnownTokenId.isStacksToken(route.fromToken) &&
        KnownTokenId.isBRC20Token(route.toToken)
      ) {
        return bridgeFromStacks_toMeta(ctx, {
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isRunesChain(route.toChain)) {
      if (
        KnownTokenId.isStacksToken(route.fromToken) &&
        KnownTokenId.isRunesToken(route.toToken)
      ) {
        return bridgeFromStacks_toMeta(ctx, {
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else {
      assertExclude(route.toChain, assertExclude.i<KnownChainId.StacksChain>())
      checkNever(route)
    }
  } else {
    assertExclude(route.fromChain, assertExclude.i<KnownChainId.EVMChain>())
    assertExclude(route.fromChain, assertExclude.i<KnownChainId.BitcoinChain>())
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
  info: Omit<
    BridgeFromStacksInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    KnownRoute_FromStacks_ToBitcoin,
): Promise<BridgeFromStacksOutput> {
  const contractCallInfo = getStacksContractCallInfo(
    info.fromChain,
    StacksContractName.BTCPegOutEndpoint,
  )
  if (!contractCallInfo) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const bitcoinNetwork =
    info.toChain === KnownChainId.Bitcoin.Mainnet
      ? btc.NETWORK
      : btc.TEST_NETWORK

  const options = composeTxXLINK(
    contractCallInfo.contractName,
    "request-peg-out-0",
    {
      "peg-out-address": addressToScriptPubKey(bitcoinNetwork, info.toAddress),
      amount: numberToStacksContractNumber(info.amount),
    },
    contractCallInfo.executeOptions,
  )

  return await info.sendTransaction(options)
}

async function bridgeFromStacks_toEVM(
  ctx: SDKGlobalContext,
  info: Omit<
    BridgeFromStacksInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    KnownRoute_FromStacks_ToEVM,
): Promise<BridgeFromStacksOutput> {
  const contractCallInfo = getStacksContractCallInfo(
    info.fromChain,
    StacksContractName.EVMPegOutEndpoint,
  )
  const fromTokenContractInfo = await getStacksTokenContractInfo(
    ctx,
    info.fromChain,
    info.fromToken,
  )
  if (contractCallInfo == null || fromTokenContractInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const terminatingTokenContractAddress =
    (await getTerminatingStacksTokenContractAddress(ctx, info)) ??
    fromTokenContractInfo

  const options = composeTxXLINK(
    contractCallInfo.contractName,
    "transfer-to-unwrap",
    {
      "token-trait": `${terminatingTokenContractAddress.deployerAddress}.${terminatingTokenContractAddress.contractName}`,
      "amount-in-fixed": numberToStacksContractNumber(info.amount),
      "dest-chain-id": contractAssignedChainIdFromKnownChain(info.toChain),
      "settle-address": decodeHex(info.toAddress),
    },
    contractCallInfo.executeOptions,
  )

  return await info.sendTransaction(options)
}

async function bridgeFromStacks_toMeta(
  ctx: SDKGlobalContext,
  info: Omit<
    BridgeFromStacksInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    (KnownRoute_FromStacks_ToBRC20 | KnownRoute_FromStacks_ToRunes),
): Promise<BridgeFromStacksOutput> {
  const contractCallInfo = getStacksContractCallInfo(
    info.fromChain,
    StacksContractName.MetaPegOutEndpoint,
  )
  const fromTokenContractInfo = await getStacksTokenContractInfo(
    ctx,
    info.fromChain,
    info.fromToken,
  )
  if (contractCallInfo == null || fromTokenContractInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const bitcoinNetwork =
    info.toChain === KnownChainId.BRC20.Mainnet ||
    info.toChain === KnownChainId.Runes.Mainnet
      ? btc.NETWORK
      : btc.TEST_NETWORK

  const options = composeTxXLINK(
    contractCallInfo.contractName,
    "request-peg-out",
    {
      "peg-out-address": addressToScriptPubKey(bitcoinNetwork, info.toAddress),
      "the-chain-id": contractAssignedChainIdFromKnownChain(info.toChain),
      "token-trait": `${fromTokenContractInfo.deployerAddress}.${fromTokenContractInfo.contractName}`,
      amount: numberToStacksContractNumber(info.amount),
    },
    contractCallInfo.executeOptions,
  )

  return await info.sendTransaction(options)
}
