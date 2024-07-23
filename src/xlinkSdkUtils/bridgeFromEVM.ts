import { Hex, encodeFunctionData } from "viem"
import { sendRawTransaction } from "viem/actions"
import { bridgeEndpointAbi } from "../evmUtils/contractAbi/bridgeEndpoint"
import { evmContractAddresses } from "../evmUtils/evmContractAddresses"
import { isSupportedEVMRoute } from "../evmUtils/peggingHelpers"
import {
  getEVMTokenContractInfo,
  numberToSolidityContractNumber,
} from "../evmUtils/xlinkContractHelpers"
import { contractAssignedChainIdFromBridgeChain } from "../stacksUtils/crossContractDataMapping"
import {
  buildSupportedRoutes,
  defineRoute,
} from "../utils/buildSupportedRoutes"
import { UnsupportedBridgeRouteError } from "../utils/errors"
import { decodeHex } from "../utils/hexHelpers"
import { assertExclude, checkNever } from "../utils/typeHelpers"
import {
  KnownChainId,
  KnownTokenId,
  _allKnownEVMMainnetChains,
} from "../utils/knownIds"
import { ChainId, EVMAddress, SDKNumber, TokenId } from "./types"

export const supportedRoutes = buildSupportedRoutes(
  [
    // from mainnet
    ...defineRoute(
      // to Bitcoin
      [[..._allKnownEVMMainnetChains], [KnownChainId.Bitcoin.Mainnet]],
      [
        [KnownTokenId.EVM.WBTC, KnownTokenId.Bitcoin.BTC],
        [KnownTokenId.EVM.BTCB, KnownTokenId.Bitcoin.BTC],
        [KnownTokenId.EVM.aBTC, KnownTokenId.Bitcoin.BTC],
      ],
    ),
    ...defineRoute(
      // to Stacks
      [[..._allKnownEVMMainnetChains], [KnownChainId.Stacks.Mainnet]],
      [
        // BTCs
        [KnownTokenId.EVM.WBTC, KnownTokenId.Stacks.aBTC],
        [KnownTokenId.EVM.BTCB, KnownTokenId.Stacks.aBTC],
        [KnownTokenId.EVM.aBTC, KnownTokenId.Stacks.aBTC],
        // USDTs
        [KnownTokenId.EVM.USDT, KnownTokenId.Stacks.sUSDT],
        [KnownTokenId.EVM.sUSDT, KnownTokenId.Stacks.sUSDT],
        // others
        [KnownTokenId.EVM.SKO, KnownTokenId.Stacks.sSKO],
        [KnownTokenId.EVM.ALEX, KnownTokenId.Stacks.ALEX],
        [KnownTokenId.EVM.vLiSTX, KnownTokenId.Stacks.vLiSTX],
        [KnownTokenId.EVM.vLiALEX, KnownTokenId.Stacks.vLiALEX],
      ],
    ),
    ...defineRoute(
      // to EVM
      [[..._allKnownEVMMainnetChains], [..._allKnownEVMMainnetChains]],
      [
        // BTCs
        [KnownTokenId.EVM.WBTC, KnownTokenId.EVM.BTCB],
        [KnownTokenId.EVM.BTCB, KnownTokenId.EVM.WBTC],

        [KnownTokenId.EVM.WBTC, KnownTokenId.EVM.aBTC],
        [KnownTokenId.EVM.aBTC, KnownTokenId.EVM.WBTC],

        [KnownTokenId.EVM.BTCB, KnownTokenId.EVM.aBTC],
        [KnownTokenId.EVM.aBTC, KnownTokenId.EVM.BTCB],

        [KnownTokenId.EVM.WBTC, KnownTokenId.EVM.WBTC],
        [KnownTokenId.EVM.BTCB, KnownTokenId.EVM.BTCB],
        [KnownTokenId.EVM.aBTC, KnownTokenId.EVM.aBTC],

        // USDTs
        [KnownTokenId.EVM.sUSDT, KnownTokenId.EVM.USDT],
        [KnownTokenId.EVM.USDT, KnownTokenId.EVM.sUSDT],

        [KnownTokenId.EVM.USDT, KnownTokenId.EVM.USDT],
        [KnownTokenId.EVM.sUSDT, KnownTokenId.EVM.sUSDT],

        // others
        [KnownTokenId.EVM.SKO, KnownTokenId.EVM.SKO],
        [KnownTokenId.EVM.ALEX, KnownTokenId.EVM.ALEX],
        [KnownTokenId.EVM.vLiSTX, KnownTokenId.EVM.vLiSTX],
        [KnownTokenId.EVM.vLiALEX, KnownTokenId.EVM.vLiALEX],
      ],
    ),

    // from testnet
  ],
  {
    isSupported: isSupportedEVMRoute,
  },
)

export interface BridgeFromEVMInput {
  fromChain: ChainId
  toChain: ChainId
  fromToken: TokenId
  toToken: TokenId
  toAddress: string
  amount: SDKNumber
  signTransaction: (tx: { to: EVMAddress; data: Uint8Array }) => Promise<{
    transactionHex: string
  }>
}

export interface BridgeFromEVMOutput {
  txid: string
}

export async function bridgeFromEVM(
  info: BridgeFromEVMInput,
): Promise<BridgeFromEVMOutput> {
  const route = await supportedRoutes.checkRouteValid(info)

  if (KnownChainId.isEVMChain(route.fromChain)) {
    if (KnownChainId.isStacksChain(route.toChain)) {
      if (
        KnownTokenId.isEVMToken(route.fromToken) &&
        KnownTokenId.isStacksToken(route.toToken)
      ) {
        return bridgeFromEVM_toStacks({
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isBitcoinChain(route.toChain)) {
      if (
        KnownTokenId.isEVMToken(route.fromToken) &&
        KnownTokenId.isBitcoinToken(route.toToken)
      ) {
        return bridgeFromEVM_toBitcoinOrEVM({
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isEVMChain(route.toChain)) {
      if (
        KnownTokenId.isEVMToken(route.fromToken) &&
        KnownTokenId.isEVMToken(route.toToken)
      ) {
        return bridgeFromEVM_toBitcoinOrEVM({
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
    assertExclude(route.fromChain, assertExclude.i<KnownChainId.BitcoinChain>())
    assertExclude(route.fromChain, assertExclude.i<KnownChainId.StacksChain>())
    checkNever(route)
  }

  throw new UnsupportedBridgeRouteError(
    info.fromChain,
    info.toChain,
    info.fromToken,
    info.toToken,
  )
}

async function bridgeFromEVM_toStacks(
  info: Omit<
    BridgeFromEVMInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > & {
    fromChain: KnownChainId.EVMChain
    toChain: KnownChainId.StacksChain
    fromToken: KnownTokenId.EVMToken
    toToken: KnownTokenId.StacksToken
  },
): Promise<BridgeFromEVMOutput> {
  const bridgeEndpointAddress =
    evmContractAddresses[info.fromChain].BridgeEndpoint
  const fromTokenContractAddress = await getEVMTokenContractInfo(
    info.fromChain,
    info.fromToken,
  )
  if (bridgeEndpointAddress == null || fromTokenContractAddress == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const functionData = await encodeFunctionData({
    abi: bridgeEndpointAbi,
    functionName: "transferToWrap",
    args: [
      fromTokenContractAddress.tokenContractAddress,
      numberToSolidityContractNumber(info.amount),
      info.toAddress,
    ],
  })

  const { transactionHex } = await info.signTransaction({
    to: bridgeEndpointAddress,
    data: decodeHex(functionData),
  })

  const txid = await sendRawTransaction(fromTokenContractAddress.client, {
    serializedTransaction: transactionHex as Hex,
  })

  return { txid }
}

async function bridgeFromEVM_toBitcoinOrEVM(
  info: Omit<
    BridgeFromEVMInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > & {
    fromChain: KnownChainId.EVMChain
    toChain: KnownChainId.BitcoinChain | KnownChainId.EVMChain
    fromToken: KnownTokenId.EVMToken
    toToken: KnownTokenId.BitcoinToken | KnownTokenId.EVMToken
  },
): Promise<BridgeFromEVMOutput> {
  const bridgeEndpointAddress =
    evmContractAddresses[info.fromChain].BridgeEndpoint
  const fromTokenContractAddress = await getEVMTokenContractInfo(
    info.fromChain,
    info.fromToken,
  )
  if (bridgeEndpointAddress == null || fromTokenContractAddress == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const functionData = await encodeFunctionData({
    abi: bridgeEndpointAbi,
    functionName: "transferToCross",
    args: [
      fromTokenContractAddress.tokenContractAddress,
      numberToSolidityContractNumber(info.amount),
      info.toAddress,
      contractAssignedChainIdFromBridgeChain(info.fromChain),
    ],
  })

  const { transactionHex } = await info.signTransaction({
    to: bridgeEndpointAddress,
    data: decodeHex(functionData),
  })

  const txid = await sendRawTransaction(fromTokenContractAddress.client, {
    serializedTransaction: transactionHex as Hex,
  })

  return { txid }
}
