import { Address, Hex, encodeFunctionData } from "viem"
import { sendRawTransaction } from "viem/actions"
import { bridgeEndpointAbi } from "../ethereumUtils/contractAbi/bridgeEndpoint"
import {
  ethEndpointContractAddresses,
  ethTokenContractAddresses,
} from "../ethereumUtils/ethContractAddresses"
import {
  getContractCallInfo,
  getTokenContractInfo,
  numberToSolidityContractNumber,
} from "../ethereumUtils/xlinkContractHelpers"
import {
  buildSupportedRoutes,
  defineRoute,
} from "../utils/buildSupportedRoutes"
import { decodeHex } from "../utils/hexHelpers"
import { UnsupportedBridgeRouteError } from "../utils/errors"
import { checkNever } from "../utils/typeHelpers"
import { KnownChainId, KnownTokenId } from "../utils/types.internal"
import { ChainId, TokenId } from "./types"

export const supportedRoutes = buildSupportedRoutes(
  [
    // from mainnet
    defineRoute(
      [KnownChainId.Ethereum.Mainnet, KnownChainId.Stacks.Mainnet],
      [
        [KnownTokenId.Ethereum.WBTC, KnownTokenId.Stacks.aBTC],
        [KnownTokenId.Ethereum.USDT, KnownTokenId.Stacks.sUSDT],
        [KnownTokenId.Ethereum.LUNR, KnownTokenId.Stacks.sLUNR],
        [KnownTokenId.Ethereum.ALEX, KnownTokenId.Stacks.ALEX],
      ],
    ),
    // defineRoute(
    //   [KnownChainId.Ethereum.Mainnet, KnownChainId.Bitcoin.Mainnet],
    //   [[KnownTokenId.Ethereum.WBTC, KnownTokenId.Bitcoin.BTC]],
    // ),
    defineRoute(
      [KnownChainId.Ethereum.BSC, KnownChainId.Stacks.Mainnet],
      [
        [KnownTokenId.Ethereum.BTCB, KnownTokenId.Stacks.aBTC],
        [KnownTokenId.Ethereum.USDT, KnownTokenId.Stacks.sUSDT],
        [KnownTokenId.Ethereum.LUNR, KnownTokenId.Stacks.sLUNR],
        [KnownTokenId.Ethereum.ALEX, KnownTokenId.Stacks.ALEX],
      ],
    ),
    // defineRoute(
    //   [KnownChainId.Ethereum.BSCTest, KnownChainId.Bitcoin.Mainnet],
    //   [[KnownTokenId.Ethereum.BTCB, KnownTokenId.Bitcoin.BTC]],
    // ),

    // from testnet
    defineRoute(
      [KnownChainId.Ethereum.Sepolia, KnownChainId.Stacks.Testnet],
      [
        [KnownTokenId.Ethereum.WBTC, KnownTokenId.Stacks.aBTC],
        [KnownTokenId.Ethereum.USDT, KnownTokenId.Stacks.sUSDT],
        [KnownTokenId.Ethereum.LUNR, KnownTokenId.Stacks.sLUNR],
        [KnownTokenId.Ethereum.ALEX, KnownTokenId.Stacks.ALEX],
      ],
    ),
    // defineRoute(
    //   [KnownChainId.Ethereum.Sepolia, KnownChainId.Bitcoin.Testnet],
    //   [[KnownTokenId.Ethereum.WBTC, KnownTokenId.Bitcoin.BTC]],
    // ),
    defineRoute(
      [KnownChainId.Ethereum.BSCTest, KnownChainId.Stacks.Testnet],
      [
        [KnownTokenId.Ethereum.BTCB, KnownTokenId.Stacks.aBTC],
        [KnownTokenId.Ethereum.USDT, KnownTokenId.Stacks.sUSDT],
        [KnownTokenId.Ethereum.LUNR, KnownTokenId.Stacks.sLUNR],
        [KnownTokenId.Ethereum.ALEX, KnownTokenId.Stacks.ALEX],
      ],
    ),
    // defineRoute(
    //   [KnownChainId.Ethereum.BNBTestnet, KnownChainId.Bitcoin.Testnet],
    //   [[KnownTokenId.Ethereum.BTCB, KnownTokenId.Bitcoin.BTC]],
    // ),
  ],
  {
    async isAvailable(route) {
      if (
        route.fromChain === KnownChainId.Ethereum.Mainnet ||
        route.fromChain === KnownChainId.Ethereum.BSC ||
        route.fromChain === KnownChainId.Ethereum.Sepolia ||
        route.fromChain === KnownChainId.Ethereum.BSCTest
      ) {
        return (
          ethTokenContractAddresses[route.fromToken][route.fromChain] != null
        )
      }

      if (
        route.toChain === KnownChainId.Ethereum.Mainnet ||
        route.toChain === KnownChainId.Ethereum.BSC ||
        route.toChain === KnownChainId.Ethereum.Sepolia ||
        route.toChain === KnownChainId.Ethereum.BSCTest
      ) {
        return ethTokenContractAddresses[route.toToken][route.toChain] != null
      }

      checkNever(route)
      return false
    },
  },
)

export interface BridgeFromEthereumInput {
  fromChain: ChainId
  toChain: ChainId
  fromToken: TokenId
  toToken: TokenId
  toAddress: string
  amount: string
  signTransaction: (tx: { to: Address; data: Uint8Array }) => Promise<{
    transactionHex: string
  }>
}

export interface BridgeFromEthereumOutput {
  txid: string
}

export async function bridgeFromEthereum(
  info: BridgeFromEthereumInput,
): Promise<BridgeFromEthereumOutput> {
  const route = await supportedRoutes.pickLeftToRightRouteOrThrow(
    info.fromChain,
    info.toChain,
    info.fromToken,
    info.toToken,
  )

  if (
    route.fromChain === KnownChainId.Ethereum.Mainnet ||
    route.fromChain === KnownChainId.Ethereum.BSC ||
    route.fromChain === KnownChainId.Ethereum.Sepolia ||
    route.fromChain === KnownChainId.Ethereum.BSCTest
  ) {
    if (
      route.toChain === KnownChainId.Stacks.Mainnet ||
      route.toChain === KnownChainId.Stacks.Testnet
    ) {
      return bridgeFromEthereum_toStacks({
        ...info,
        fromChain: route.fromChain,
        toChain: route.toChain,
      })
    }

    // if (KnownChainId.isBitcoinChain(route.toChain)) {
    //   return bridgeFromEthereum_toBitcoin({
    //     ...info,
    //     fromChain: route.fromChain,
    //     toChain: route.toChain,
    //   })
    // }

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

async function bridgeFromEthereum_toStacks(
  info: Omit<BridgeFromEthereumInput, "fromChain" | "toChain"> & {
    fromChain: KnownChainId.EthereumChain
    toChain: KnownChainId.StacksChain
  },
): Promise<BridgeFromEthereumOutput> {
  const bridgeEndpointAddress =
    ethEndpointContractAddresses.bridgeEndpoint[info.fromChain]
  const contractCallInfo = getContractCallInfo(info.fromChain)
  const fromTokenContractAddress = getTokenContractInfo(
    info.fromChain,
    info.fromToken,
  )
  if (contractCallInfo == null || fromTokenContractAddress == null) {
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
      fromTokenContractAddress.contractAddress,
      numberToSolidityContractNumber(info.amount),
      info.toAddress,
    ],
  })

  const { transactionHex } = await info.signTransaction({
    to: bridgeEndpointAddress,
    data: decodeHex(functionData),
  })

  const txid = await sendRawTransaction(contractCallInfo.client, {
    serializedTransaction: transactionHex as Hex,
  })

  return { txid }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function bridgeFromEthereum_toBitcoin(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  info: Omit<BridgeFromEthereumInput, "fromChain" | "toChain"> & {
    fromChain: KnownChainId.EthereumChain
    toChain: KnownChainId.BitcoinChain
  },
): Promise<BridgeFromEthereumOutput> {
  // TODO
  return { txid: "" }
}
