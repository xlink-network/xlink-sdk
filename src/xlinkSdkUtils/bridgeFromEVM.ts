import { encodeFunctionData, toHex } from "viem"
import { bridgeEndpointAbi } from "../evmUtils/contractAbi/bridgeEndpoint"
import { evmContractAddresses } from "../evmUtils/evmContractAddresses"
import { isSupportedEVMRoute } from "../evmUtils/peggingHelpers"
import {
  getEVMTokenContractInfo,
  numberToSolidityContractNumber,
} from "../evmUtils/xlinkContractHelpers"
import { contractAssignedChainIdFromKnownChain } from "../stacksUtils/crossContractDataMapping"
import {
  buildSupportedRoutes,
  defineRoute,
} from "../utils/buildSupportedRoutes"
import {
  InvalidMethodParametersError,
  UnsupportedBridgeRouteError,
} from "../utils/errors"
import { decodeHex } from "../utils/hexHelpers"
import { assertExclude, checkNever } from "../utils/typeHelpers"
import {
  KnownChainId,
  KnownTokenId,
  _allKnownEVMMainnetChains,
} from "../utils/types/knownIds"
import { ChainId, EVMAddress, SDKNumber, TokenId } from "./types"
import { SDKGlobalContext } from "./types.internal"

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

export type BridgeFromEVMInput = {
  fromChain: ChainId
  toChain: ChainId
  fromToken: TokenId
  toToken: TokenId
  toAddress: string
  /**
   * **Required** when `toChain` is one of bitcoin chains
   */
  toAddressScriptPubKey?: Uint8Array
  amount: SDKNumber
  sendTransaction: (tx: { to: EVMAddress; data: Uint8Array }) => Promise<{
    txHash: string
  }>
}

export interface BridgeFromEVMOutput {
  txHash: string
}

export async function bridgeFromEVM(
  ctx: SDKGlobalContext,
  info: BridgeFromEVMInput,
): Promise<BridgeFromEVMOutput> {
  const route = await supportedRoutes.checkRouteValid(ctx, info)

  if (KnownChainId.isEVMChain(route.fromChain)) {
    if (KnownChainId.isStacksChain(route.toChain)) {
      if (
        KnownTokenId.isEVMToken(route.fromToken) &&
        KnownTokenId.isStacksToken(route.toToken)
      ) {
        return bridgeFromEVM_toStacks(ctx, {
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
        return bridgeFromEVM_toBitcoinOrEVM(ctx, {
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
        return bridgeFromEVM_toBitcoinOrEVM(ctx, {
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
  ctx: SDKGlobalContext,
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
    ctx,
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

  return await info.sendTransaction({
    to: bridgeEndpointAddress,
    data: decodeHex(functionData),
  })
}

async function bridgeFromEVM_toBitcoinOrEVM(
  ctx: SDKGlobalContext,
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
    ctx,
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

  let finalToAddressHex: string
  if (KnownChainId.isBitcoinChain(info.toChain)) {
    if (info.toAddressScriptPubKey == null) {
      throw new InvalidMethodParametersError(
        ["bridgeFromEVM (to Bitcoin)"],
        [
          {
            name: "toAddressScriptPubKey",
            expected: "Uint8Array",
            received: "undefined",
          },
        ],
      )
    }

    finalToAddressHex = toHex(info.toAddressScriptPubKey)
  } else {
    finalToAddressHex = info.toAddress
  }

  const functionData = await encodeFunctionData({
    abi: bridgeEndpointAbi,
    functionName: "transferToCross",
    args: [
      fromTokenContractAddress.tokenContractAddress,
      numberToSolidityContractNumber(info.amount),
      finalToAddressHex,
      contractAssignedChainIdFromKnownChain(info.fromChain),
    ],
  })

  return await info.sendTransaction({
    to: bridgeEndpointAddress,
    data: decodeHex(functionData),
  })
}
