import { encodeFunctionData, parseAbi, toHex, zeroAddress } from "viem"
import { estimateGas } from "viem/actions"
import { BridgeEndpointAbi } from "../evmUtils/contractAbi/bridgeEndpoint"
import { isSupportedEVMRoute } from "../evmUtils/peggingHelpers"
import {
  getEVMContractCallInfo,
  getEVMTokenContractInfo,
  numberToSolidityContractNumber,
} from "../evmUtils/xlinkContractHelpers"
import { contractAssignedChainIdFromKnownChain } from "../stacksUtils/crossContractDataMapping"
import { getStacksTokenContractInfo } from "../stacksUtils/xlinkContractHelpers"
import { BigNumber } from "../utils/BigNumber"
import {
  buildSupportedRoutes,
  defineRoute,
  KnownRoute_FromEVM_ToBitcoin,
  KnownRoute_FromEVM_ToEVM,
  KnownRoute_FromEVM_ToStacks,
} from "../utils/buildSupportedRoutes"
import {
  InvalidMethodParametersError,
  UnsupportedBridgeRouteError,
} from "../utils/errors"
import { decodeHex } from "../utils/hexHelpers"
import { assertExclude, checkNever } from "../utils/typeHelpers"
import {
  _allKnownEVMMainnetChains,
  KnownChainId,
  KnownTokenId,
} from "../utils/types/knownIds"
import {
  ChainId,
  EVMAddress,
  SDKNumber,
  TokenId,
  toSDKNumberOrUndefined,
} from "./types"
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
        [KnownTokenId.EVM.uBTC, KnownTokenId.Stacks.uBTC],
        [KnownTokenId.EVM.wuBTC, KnownTokenId.Stacks.uBTC],
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

        [KnownTokenId.EVM.uBTC, KnownTokenId.EVM.uBTC],
        [KnownTokenId.EVM.wuBTC, KnownTokenId.EVM.wuBTC],
        [KnownTokenId.EVM.uBTC, KnownTokenId.EVM.wuBTC],
        [KnownTokenId.EVM.wuBTC, KnownTokenId.EVM.uBTC],
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
  fromAddress: EVMAddress
  toAddress: string
  /**
   * **Required** when `toChain` is one of bitcoin chains
   */
  toAddressScriptPubKey?: Uint8Array
  amount: SDKNumber
  sendTransaction: (tx: {
    from: EVMAddress
    to: EVMAddress
    data: Uint8Array
    recommendedGasLimit: SDKNumber
  }) => Promise<{
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
        return bridgeFromEVM_toBitcoin(ctx, {
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
        return bridgeFromEVM_toEVM(ctx, {
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

const sendMessageAbi = parseAbi([
  "function cross(uint256,address,address)",
  "function wrap(string to)",
])

async function bridgeFromEVM_toStacks(
  ctx: SDKGlobalContext,
  info: Omit<
    BridgeFromEVMInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    KnownRoute_FromEVM_ToStacks,
): Promise<BridgeFromEVMOutput> {
  const { bridgeEndpointContractAddress: bridgeEndpointAddress } =
    (await getEVMContractCallInfo(ctx, info.fromChain)) ?? {}
  const fromTokenContractInfo = await getEVMTokenContractInfo(
    ctx,
    info.fromChain,
    info.fromToken,
  )
  const toTokenContractInfo = await getStacksTokenContractInfo(
    info.toChain,
    info.toToken,
  )
  if (
    bridgeEndpointAddress == null ||
    fromTokenContractInfo == null ||
    toTokenContractInfo == null
  ) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const message = await encodeFunctionData({
    abi: sendMessageAbi,
    functionName: "wrap",
    args: [info.toAddress],
  })
  const functionData = await encodeFunctionData({
    abi: BridgeEndpointAbi,
    functionName: "sendMessageWithToken",
    args: [
      fromTokenContractInfo.tokenContractAddress,
      numberToSolidityContractNumber(info.amount),
      message,
    ],
  })

  const estimated = await estimateGas(fromTokenContractInfo.client, {
    account: info.fromAddress,
    to: bridgeEndpointAddress,
    data: functionData,
  })
    .then(n => BigNumber.round({ precision: 0 }, BigNumber.mul(n, 1.2)))
    .catch(
      // add a fallback in case estimate failed
      () => 5 * 1e5,
    )

  return await info.sendTransaction({
    from: info.fromAddress,
    to: bridgeEndpointAddress,
    data: decodeHex(functionData),
    recommendedGasLimit: toSDKNumberOrUndefined(estimated),
  })
}

async function bridgeFromEVM_toBitcoin(
  ctx: SDKGlobalContext,
  info: Omit<
    BridgeFromEVMInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    KnownRoute_FromEVM_ToBitcoin,
): Promise<BridgeFromEVMOutput> {
  const { bridgeEndpointContractAddress: bridgeEndpointAddress } =
    (await getEVMContractCallInfo(ctx, info.fromChain)) ?? {}
  const fromTokenContractInfo = await getEVMTokenContractInfo(
    ctx,
    info.fromChain,
    info.fromToken,
  )
  if (bridgeEndpointAddress == null || fromTokenContractInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  if (info.toAddressScriptPubKey == null) {
    throw new InvalidMethodParametersError(
      ["XLinkSDK", "bridgeFromEVM (to Bitcoin)"],
      [
        {
          name: "toAddressScriptPubKey",
          expected: "Uint8Array",
          received: "undefined",
        },
      ],
    )
  }

  const toAddressHex = toHex(info.toAddressScriptPubKey)

  const message = await encodeFunctionData({
    abi: sendMessageAbi,
    functionName: "cross",
    args: [
      contractAssignedChainIdFromKnownChain(info.toChain),
      zeroAddress,
      toAddressHex,
    ],
  })
  const functionData = await encodeFunctionData({
    abi: BridgeEndpointAbi,
    functionName: "sendMessageWithToken",
    args: [
      fromTokenContractInfo.tokenContractAddress,
      numberToSolidityContractNumber(info.amount),
      message,
    ],
  })

  const estimated = await estimateGas(fromTokenContractInfo.client, {
    account: info.fromAddress,
    to: bridgeEndpointAddress,
    data: functionData,
  })
    .then(n => BigNumber.round({ precision: 0 }, BigNumber.mul(n, 1.2)))
    .catch(
      // add a fallback in case estimate failed
      () =>
        // https://mainnet-explorer.ailayer.xyz/tx/0xa62dd8c3a6a3fe2dbc10b0847dcc0cae610c348a77b163134b87eb9563fd5f62
        5 * 1e5,
    )

  return await info.sendTransaction({
    from: info.fromAddress,
    to: bridgeEndpointAddress,
    data: decodeHex(functionData),
    recommendedGasLimit: toSDKNumberOrUndefined(estimated),
  })
}

async function bridgeFromEVM_toEVM(
  ctx: SDKGlobalContext,
  info: Omit<
    BridgeFromEVMInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    KnownRoute_FromEVM_ToEVM,
): Promise<BridgeFromEVMOutput> {
  const { bridgeEndpointContractAddress: bridgeEndpointAddress } =
    (await getEVMContractCallInfo(ctx, info.fromChain)) ?? {}
  const fromTokenContractInfo = await getEVMTokenContractInfo(
    ctx,
    info.fromChain,
    info.fromToken,
  )
  const toTokenContractInfo = await getEVMTokenContractInfo(
    ctx,
    info.toChain,
    info.toToken,
  )
  if (
    bridgeEndpointAddress == null ||
    fromTokenContractInfo == null ||
    toTokenContractInfo == null
  ) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const message = await encodeFunctionData({
    abi: sendMessageAbi,
    functionName: "cross",
    args: [
      contractAssignedChainIdFromKnownChain(info.toChain),
      toTokenContractInfo.tokenContractAddress,
      info.toAddress as EVMAddress,
    ],
  })
  const functionData = await encodeFunctionData({
    abi: BridgeEndpointAbi,
    functionName: "sendMessageWithToken",
    args: [
      fromTokenContractInfo.tokenContractAddress,
      numberToSolidityContractNumber(info.amount),
      message,
    ],
  })

  const estimated = await estimateGas(fromTokenContractInfo.client, {
    account: info.fromAddress,
    to: bridgeEndpointAddress,
    data: functionData,
  })
    .then(n => BigNumber.round({ precision: 0 }, BigNumber.mul(n, 1.2)))
    .catch(
      // add a fallback in case estimate failed
      () =>
        // https://mainnet-explorer.ailayer.xyz/tx/0xa62dd8c3a6a3fe2dbc10b0847dcc0cae610c348a77b163134b87eb9563fd5f62
        5 * 1e5,
    )

  return await info.sendTransaction({
    from: info.fromAddress,
    to: bridgeEndpointAddress,
    data: decodeHex(functionData),
    recommendedGasLimit: toSDKNumberOrUndefined(estimated),
  })
}
