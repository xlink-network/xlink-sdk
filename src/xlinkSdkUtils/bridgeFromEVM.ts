import { Hex, encodeFunctionData } from "viem"
import { sendRawTransaction } from "viem/actions"
import { getBTCPegInAddress } from "../bitcoinUtils/btcAddresses"
import { bridgeEndpointAbi } from "../evmUtils/contractAbi/bridgeEndpoint"
import { evmContractAddresses } from "../evmUtils/evmContractAddresses"
import {
  getEVMTokenContractInfo,
  numberToSolidityContractNumber,
} from "../evmUtils/xlinkContractHelpers"
import { contractAssignedChainIdFromBridgeChain } from "../stacksUtils/crossContractDataMapping"
import { stxTokenContractAddresses } from "../stacksUtils/stxContractAddresses"
import {
  buildSupportedRoutes,
  defineRoute,
} from "../utils/buildSupportedRoutes"
import { UnsupportedBridgeRouteError } from "../utils/errors"
import { decodeHex } from "../utils/hexHelpers"
import { checkNever } from "../utils/typeHelpers"
import { KnownChainId, KnownTokenId } from "../utils/types.internal"
import { ChainId, EVMAddress, SDKNumber, TokenId } from "./types"

export const supportedRoutes = buildSupportedRoutes(
  [
    // from mainnet
    //     Ethereum
    defineRoute(
      // to Bitcoin
      [[KnownChainId.EVM.Ethereum, KnownChainId.Bitcoin.Mainnet]],
      [[KnownTokenId.EVM.WBTC, KnownTokenId.Bitcoin.BTC]],
    ),
    defineRoute(
      // to Stacks
      [[KnownChainId.EVM.Ethereum, KnownChainId.Stacks.Mainnet]],
      [
        [KnownTokenId.EVM.WBTC, KnownTokenId.Stacks.aBTC],
        [KnownTokenId.EVM.USDT, KnownTokenId.Stacks.sUSDT],
        [KnownTokenId.EVM.ALEX, KnownTokenId.Stacks.ALEX],
      ],
    ),
    defineRoute(
      // to BSC
      [[KnownChainId.EVM.Ethereum, KnownChainId.EVM.BSC]],
      [
        [KnownTokenId.EVM.WBTC, KnownTokenId.EVM.BTCB],
        [KnownTokenId.EVM.USDT, KnownTokenId.EVM.USDT],
        [KnownTokenId.EVM.ALEX, KnownTokenId.EVM.ALEX],
      ],
    ),
    defineRoute(
      // to Other EVMs
      [
        [KnownChainId.EVM.Ethereum, KnownChainId.EVM.CoreDAO],
        [KnownChainId.EVM.Ethereum, KnownChainId.EVM.Bsquared],
        [KnownChainId.EVM.Ethereum, KnownChainId.EVM.BOB],
        [KnownChainId.EVM.Ethereum, KnownChainId.EVM.Bitlayer],
        [KnownChainId.EVM.Ethereum, KnownChainId.EVM.Lorenzo],
        [KnownChainId.EVM.Ethereum, KnownChainId.EVM.Merlin],
      ],
      [
        [KnownTokenId.EVM.WBTC, KnownTokenId.EVM.aBTC],
        [KnownTokenId.EVM.USDT, KnownTokenId.EVM.sUSDT],
        [KnownTokenId.EVM.ALEX, KnownTokenId.EVM.ALEX],
      ],
    ),
    //     BSC
    defineRoute(
      // to Bitcoin
      [[KnownChainId.EVM.BSC, KnownChainId.Bitcoin.Mainnet]],
      [[KnownTokenId.EVM.BTCB, KnownTokenId.Bitcoin.BTC]],
    ),
    defineRoute(
      // to Stacks
      [[KnownChainId.EVM.BSC, KnownChainId.Stacks.Mainnet]],
      [
        [KnownTokenId.EVM.BTCB, KnownTokenId.Stacks.aBTC],
        [KnownTokenId.EVM.USDT, KnownTokenId.Stacks.sUSDT],
        [KnownTokenId.EVM.ALEX, KnownTokenId.Stacks.ALEX],
        [KnownTokenId.EVM.SKO, KnownTokenId.Stacks.sSKO],
      ],
    ),
    defineRoute(
      // to Ethereum
      [[KnownChainId.EVM.BSC, KnownChainId.EVM.Ethereum]],
      [
        [KnownTokenId.EVM.BTCB, KnownTokenId.EVM.WBTC],
        [KnownTokenId.EVM.USDT, KnownTokenId.EVM.USDT],
        [KnownTokenId.EVM.ALEX, KnownTokenId.EVM.ALEX],
      ],
    ),
    defineRoute(
      // to Other EVMs
      [
        [KnownChainId.EVM.BSC, KnownChainId.EVM.CoreDAO],
        [KnownChainId.EVM.BSC, KnownChainId.EVM.Bsquared],
        [KnownChainId.EVM.BSC, KnownChainId.EVM.BOB],
        [KnownChainId.EVM.BSC, KnownChainId.EVM.Bitlayer],
        [KnownChainId.EVM.BSC, KnownChainId.EVM.Lorenzo],
        [KnownChainId.EVM.BSC, KnownChainId.EVM.Merlin],
      ],
      [
        [KnownTokenId.EVM.BTCB, KnownTokenId.EVM.aBTC],
        [KnownTokenId.EVM.USDT, KnownTokenId.EVM.sUSDT],
        [KnownTokenId.EVM.ALEX, KnownTokenId.EVM.ALEX],
      ],
    ),
    //      others
    defineRoute(
      // to Bitcoin
      [
        [KnownChainId.EVM.CoreDAO, KnownChainId.Bitcoin.Mainnet],
        [KnownChainId.EVM.Bsquared, KnownChainId.Bitcoin.Mainnet],
        [KnownChainId.EVM.BOB, KnownChainId.Bitcoin.Mainnet],
        [KnownChainId.EVM.Bitlayer, KnownChainId.Bitcoin.Mainnet],
        [KnownChainId.EVM.Lorenzo, KnownChainId.Bitcoin.Mainnet],
        [KnownChainId.EVM.Merlin, KnownChainId.Bitcoin.Mainnet],
      ],
      [[KnownTokenId.EVM.aBTC, KnownTokenId.Bitcoin.BTC]],
    ),
    defineRoute(
      // to Stacks
      [
        [KnownChainId.EVM.CoreDAO, KnownChainId.Stacks.Mainnet],
        [KnownChainId.EVM.Bsquared, KnownChainId.Stacks.Mainnet],
        [KnownChainId.EVM.BOB, KnownChainId.Stacks.Mainnet],
        [KnownChainId.EVM.Bitlayer, KnownChainId.Stacks.Mainnet],
        [KnownChainId.EVM.Lorenzo, KnownChainId.Stacks.Mainnet],
        [KnownChainId.EVM.Merlin, KnownChainId.Stacks.Mainnet],
      ],
      [
        [KnownTokenId.EVM.aBTC, KnownTokenId.Stacks.aBTC],
        [KnownTokenId.EVM.sUSDT, KnownTokenId.Stacks.sUSDT],
        [KnownTokenId.EVM.ALEX, KnownTokenId.Stacks.ALEX],
        [KnownTokenId.EVM.vLiSTX, KnownTokenId.Stacks.vLiSTX],
        [KnownTokenId.EVM.vLiALEX, KnownTokenId.Stacks.vLiALEX],
      ],
    ),
    defineRoute(
      // to Ethereum
      [
        [KnownChainId.EVM.CoreDAO, KnownChainId.EVM.Ethereum],
        [KnownChainId.EVM.Bsquared, KnownChainId.EVM.Ethereum],
        [KnownChainId.EVM.BOB, KnownChainId.EVM.Ethereum],
        [KnownChainId.EVM.Bitlayer, KnownChainId.EVM.Ethereum],
        [KnownChainId.EVM.Lorenzo, KnownChainId.EVM.Ethereum],
        [KnownChainId.EVM.Merlin, KnownChainId.EVM.Ethereum],
      ],
      [
        [KnownTokenId.EVM.aBTC, KnownTokenId.EVM.WBTC],
        [KnownTokenId.EVM.sUSDT, KnownTokenId.EVM.USDT],
        [KnownTokenId.EVM.ALEX, KnownTokenId.EVM.ALEX],
      ],
    ),
    defineRoute(
      // to BSC
      [
        [KnownChainId.EVM.CoreDAO, KnownChainId.EVM.BSC],
        [KnownChainId.EVM.Bsquared, KnownChainId.EVM.BSC],
        [KnownChainId.EVM.BOB, KnownChainId.EVM.BSC],
        [KnownChainId.EVM.Bitlayer, KnownChainId.EVM.BSC],
        [KnownChainId.EVM.Lorenzo, KnownChainId.EVM.BSC],
        [KnownChainId.EVM.Merlin, KnownChainId.EVM.BSC],
      ],
      [
        [KnownTokenId.EVM.aBTC, KnownTokenId.EVM.BTCB],
        [KnownTokenId.EVM.sUSDT, KnownTokenId.EVM.USDT],
        [KnownTokenId.EVM.ALEX, KnownTokenId.EVM.ALEX],
      ],
    ),
    // to Other EVMs
    ...[
      KnownChainId.EVM.CoreDAO,
      KnownChainId.EVM.Bsquared,
      KnownChainId.EVM.BOB,
      KnownChainId.EVM.Bitlayer,
      KnownChainId.EVM.Lorenzo,
      KnownChainId.EVM.Merlin,
    ].map((el, idx, ary) =>
      defineRoute(
        ary.filter(i => i !== el).map(el2 => [el, el2]),
        [
          [KnownTokenId.EVM.aBTC, KnownTokenId.EVM.aBTC],
          [KnownTokenId.EVM.sUSDT, KnownTokenId.EVM.sUSDT],
          [KnownTokenId.EVM.ALEX, KnownTokenId.EVM.ALEX],
          [KnownTokenId.EVM.vLiSTX, KnownTokenId.EVM.vLiSTX],
          [KnownTokenId.EVM.vLiALEX, KnownTokenId.EVM.vLiALEX],
        ],
      ),
    ),

    // from testnet
  ],
  {
    async isAvailable(route) {
      if (!KnownChainId.isEVMChain(route.fromChain)) return false
      if (!KnownTokenId.isEVMToken(route.fromToken)) return false
      if (evmContractAddresses[route.fromChain][route.fromToken] == null) {
        return false
      }

      if (KnownChainId.isEVMChain(route.toChain)) {
        if (!KnownTokenId.isEVMToken(route.toToken)) return false
        return evmContractAddresses[route.toChain][route.toToken] != null
      }

      if (KnownChainId.isStacksChain(route.toChain)) {
        if (!KnownTokenId.isStacksToken(route.toToken)) return false
        return stxTokenContractAddresses[route.toToken]?.[route.toChain] != null
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
  const route = await supportedRoutes.pickLeftToRightRouteOrThrow(
    info.fromChain,
    info.toChain,
    info.fromToken,
    info.toToken,
  )

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
    checkNever(route.fromChain)
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
