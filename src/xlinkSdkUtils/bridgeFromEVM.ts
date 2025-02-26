import { encodeFunctionData, Hex, toHex } from "viem"
import { estimateGas } from "viem/actions"
import { nativeCurrencyAddress } from "../evmUtils/addressHelpers"
import { BridgeEndpointAbi } from "../evmUtils/contractAbi/bridgeEndpoint"
import { NativeBridgeEndpointAbi } from "../evmUtils/contractAbi/nativeBridgeEndpoint"
import { sendMessageAbi } from "../evmUtils/contractMessageHelpers"
import { isSupportedEVMRoute } from "../evmUtils/peggingHelpers"
import {
  getEVMContractCallInfo,
  getEVMTokenContractInfo,
  numberToSolidityContractNumber,
} from "../evmUtils/xlinkContractHelpers"
import { contractAssignedChainIdFromKnownChain } from "../stacksUtils/crossContractDataMapping"
import {
  addressToBuffer,
  getStacksTokenContractInfo,
} from "../stacksUtils/xlinkContractHelpers"
import { BigNumber } from "../utils/BigNumber"
import {
  buildSupportedRoutes,
  defineRoute,
  KnownRoute_FromEVM_ToBitcoin,
  KnownRoute_FromEVM_ToBRC20,
  KnownRoute_FromEVM_ToEVM,
  KnownRoute_FromEVM_ToRunes,
  KnownRoute_FromEVM_ToStacks,
} from "../utils/buildSupportedRoutes"
import {
  InvalidMethodParametersError,
  UnsupportedBridgeRouteError,
} from "../utils/errors"
import { decodeHex, encodeZeroPrefixedHex } from "../utils/hexHelpers"
import { assertExclude, checkNever } from "../utils/typeHelpers"
import {
  _allKnownEVMMainnetChains,
  _allKnownEVMTestnetChains,
  _knownChainIdToErrorMessagePart,
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
        [KnownTokenId.EVM.aBTC, KnownTokenId.Bitcoin.BTC],
        [KnownTokenId.EVM.WBTC, KnownTokenId.Bitcoin.BTC],
        [KnownTokenId.EVM.BTCB, KnownTokenId.Bitcoin.BTC],
        [KnownTokenId.EVM.cbBTC, KnownTokenId.Bitcoin.BTC],
      ],
    ),
    ...defineRoute(
      // to Stacks
      [[..._allKnownEVMMainnetChains], [KnownChainId.Stacks.Mainnet]],
      [
        // BTCs
        [KnownTokenId.EVM.aBTC, KnownTokenId.Stacks.aBTC],
        [KnownTokenId.EVM.WBTC, KnownTokenId.Stacks.aBTC],
        [KnownTokenId.EVM.BTCB, KnownTokenId.Stacks.aBTC],
        [KnownTokenId.EVM.cbBTC, KnownTokenId.Stacks.aBTC],
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
        [KnownTokenId.EVM.DB20, KnownTokenId.Stacks.DB20],
        [KnownTokenId.EVM.DOG, KnownTokenId.Stacks.DOG],
      ],
    ),
    ...defineRoute(
      // to EVM
      [[..._allKnownEVMMainnetChains], [..._allKnownEVMMainnetChains]],
      [
        // BTCs
        [KnownTokenId.EVM.WBTC, KnownTokenId.EVM.aBTC],
        [KnownTokenId.EVM.aBTC, KnownTokenId.EVM.WBTC],
        [KnownTokenId.EVM.WBTC, KnownTokenId.EVM.BTCB],
        [KnownTokenId.EVM.BTCB, KnownTokenId.EVM.WBTC],
        [KnownTokenId.EVM.WBTC, KnownTokenId.EVM.cbBTC],
        [KnownTokenId.EVM.cbBTC, KnownTokenId.EVM.WBTC],

        [KnownTokenId.EVM.BTCB, KnownTokenId.EVM.aBTC],
        [KnownTokenId.EVM.aBTC, KnownTokenId.EVM.BTCB],
        [KnownTokenId.EVM.BTCB, KnownTokenId.EVM.cbBTC],
        [KnownTokenId.EVM.cbBTC, KnownTokenId.EVM.BTCB],

        [KnownTokenId.EVM.cbBTC, KnownTokenId.EVM.aBTC],
        [KnownTokenId.EVM.aBTC, KnownTokenId.EVM.cbBTC],

        [KnownTokenId.EVM.WBTC, KnownTokenId.EVM.WBTC],
        [KnownTokenId.EVM.BTCB, KnownTokenId.EVM.BTCB],
        [KnownTokenId.EVM.aBTC, KnownTokenId.EVM.aBTC],
        [KnownTokenId.EVM.cbBTC, KnownTokenId.EVM.cbBTC],

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

        [KnownTokenId.EVM.DB20, KnownTokenId.EVM.DB20],
        [KnownTokenId.EVM.DOG, KnownTokenId.EVM.DOG],
      ],
    ),

    // from testnet
    ...defineRoute(
      // to Bitcoin
      [[..._allKnownEVMTestnetChains], [KnownChainId.Bitcoin.Testnet]],
      [
        [KnownTokenId.EVM.aBTC, KnownTokenId.Bitcoin.BTC],
        [KnownTokenId.EVM.WBTC, KnownTokenId.Bitcoin.BTC],
        [KnownTokenId.EVM.BTCB, KnownTokenId.Bitcoin.BTC],
        [KnownTokenId.EVM.cbBTC, KnownTokenId.Bitcoin.BTC],
      ],
    ),
    ...defineRoute(
      // to Stacks
      [[..._allKnownEVMTestnetChains], [KnownChainId.Stacks.Testnet]],
      [
        // BTCs
        [KnownTokenId.EVM.aBTC, KnownTokenId.Stacks.aBTC],
        [KnownTokenId.EVM.WBTC, KnownTokenId.Stacks.aBTC],
        [KnownTokenId.EVM.BTCB, KnownTokenId.Stacks.aBTC],
        [KnownTokenId.EVM.cbBTC, KnownTokenId.Stacks.aBTC],
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
        [KnownTokenId.EVM.DB20, KnownTokenId.Stacks.DB20],
        [KnownTokenId.EVM.DOG, KnownTokenId.Stacks.DOG],
      ],
    ),
    ...defineRoute(
      // to EVM
      [[..._allKnownEVMTestnetChains], [..._allKnownEVMTestnetChains]],
      [
        // BTCs
        [KnownTokenId.EVM.WBTC, KnownTokenId.EVM.aBTC],
        [KnownTokenId.EVM.aBTC, KnownTokenId.EVM.WBTC],
        [KnownTokenId.EVM.WBTC, KnownTokenId.EVM.BTCB],
        [KnownTokenId.EVM.BTCB, KnownTokenId.EVM.WBTC],
        [KnownTokenId.EVM.WBTC, KnownTokenId.EVM.cbBTC],
        [KnownTokenId.EVM.cbBTC, KnownTokenId.EVM.WBTC],

        [KnownTokenId.EVM.BTCB, KnownTokenId.EVM.aBTC],
        [KnownTokenId.EVM.aBTC, KnownTokenId.EVM.BTCB],
        [KnownTokenId.EVM.BTCB, KnownTokenId.EVM.cbBTC],
        [KnownTokenId.EVM.cbBTC, KnownTokenId.EVM.BTCB],

        [KnownTokenId.EVM.cbBTC, KnownTokenId.EVM.aBTC],
        [KnownTokenId.EVM.aBTC, KnownTokenId.EVM.cbBTC],

        [KnownTokenId.EVM.WBTC, KnownTokenId.EVM.WBTC],
        [KnownTokenId.EVM.BTCB, KnownTokenId.EVM.BTCB],
        [KnownTokenId.EVM.aBTC, KnownTokenId.EVM.aBTC],
        [KnownTokenId.EVM.cbBTC, KnownTokenId.EVM.cbBTC],

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

        [KnownTokenId.EVM.DB20, KnownTokenId.EVM.DB20],
        [KnownTokenId.EVM.DOG, KnownTokenId.EVM.DOG],
      ],
    ),
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
    value?: SDKNumber
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
    } else if (KnownChainId.isBRC20Chain(route.toChain)) {
      if (
        KnownTokenId.isEVMToken(route.fromToken) &&
        KnownTokenId.isBRC20Token(route.toToken)
      ) {
        return bridgeFromEVM_toMeta(ctx, {
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isRunesChain(route.toChain)) {
      if (
        KnownTokenId.isEVMToken(route.fromToken) &&
        KnownTokenId.isRunesToken(route.toToken)
      ) {
        return bridgeFromEVM_toMeta(ctx, {
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
    toTokenContractInfo == null ||
    fromTokenContractInfo.tokenContractAddress === nativeCurrencyAddress
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
    functionName: "transferToStacks",
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

  const fallbackGasLimit = 200_000
  const estimated = await estimateGas(fromTokenContractInfo.client, {
    account: info.fromAddress,
    to: bridgeEndpointAddress,
    data: functionData,
  })
    .then(n =>
      BigNumber.round(
        { precision: 0 },
        BigNumber.max([fallbackGasLimit, BigNumber.mul(n, 1.2)]),
      ),
    )
    .catch(
      // add a fallback in case estimate failed
      () => fallbackGasLimit,
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
  const { bridgeEndpointContractAddress, nativeBridgeEndpointContractAddress } =
    (await getEVMContractCallInfo(ctx, info.fromChain)) ?? {}

  const fromTokenContractInfo = await getEVMTokenContractInfo(
    ctx,
    info.fromChain,
    info.fromToken,
  )
  if (fromTokenContractInfo == null) {
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
    functionName: "transferToBTC",
    args: [toAddressHex],
  })
  let bridgeEndpointAddress: undefined | EVMAddress
  let functionData: Hex
  let value: undefined | SDKNumber
  if (fromTokenContractInfo.tokenContractAddress === nativeCurrencyAddress) {
    functionData = await encodeFunctionData({
      abi: NativeBridgeEndpointAbi,
      functionName: "withdraw",
      args: [
        encodeZeroPrefixedHex(addressToBuffer(info.toChain, info.toAddress)),
      ],
    })

    const nativeCurrencyDecimals =
      fromTokenContractInfo.client.chain?.nativeCurrency.decimals
    if (nativeCurrencyDecimals == null) {
      throw new UnsupportedBridgeRouteError(
        info.fromChain,
        info.toChain,
        info.fromToken,
        info.toToken,
      )
    }

    bridgeEndpointAddress = nativeBridgeEndpointContractAddress
    value = toSDKNumberOrUndefined(
      BigNumber.rightMoveDecimals(nativeCurrencyDecimals, info.amount),
    )
  } else {
    functionData = await encodeFunctionData({
      abi: BridgeEndpointAbi,
      functionName: "sendMessageWithToken",
      args: [
        fromTokenContractInfo.tokenContractAddress,
        numberToSolidityContractNumber(info.amount),
        message,
      ],
    })

    bridgeEndpointAddress = bridgeEndpointContractAddress
  }

  if (bridgeEndpointAddress == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const fallbackGasLimit = 200_000
  const estimated = await estimateGas(fromTokenContractInfo.client, {
    account: info.fromAddress,
    to: bridgeEndpointAddress,
    data: functionData,
  })
    .then(n =>
      BigNumber.round(
        { precision: 0 },
        BigNumber.max([fallbackGasLimit, BigNumber.mul(n, 1.2)]),
      ),
    )
    .catch(
      // add a fallback in case estimate failed
      () => fallbackGasLimit,
    )

  return await info.sendTransaction({
    from: info.fromAddress,
    to: bridgeEndpointAddress,
    data: decodeHex(functionData),
    value,
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
    toTokenContractInfo == null ||
    fromTokenContractInfo.tokenContractAddress === nativeCurrencyAddress
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
    functionName: "transferToEVM",
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

  const fallbackGasLimit = 200_000
  const estimated = await estimateGas(fromTokenContractInfo.client, {
    account: info.fromAddress,
    to: bridgeEndpointAddress,
    data: functionData,
  })
    .then(n =>
      BigNumber.round(
        { precision: 0 },
        BigNumber.max([fallbackGasLimit, BigNumber.mul(n, 1.2)]),
      ),
    )
    .catch(
      // add a fallback in case estimate failed
      () => fallbackGasLimit,
    )

  return await info.sendTransaction({
    from: info.fromAddress,
    to: bridgeEndpointAddress,
    data: decodeHex(functionData),
    recommendedGasLimit: toSDKNumberOrUndefined(estimated),
  })
}

async function bridgeFromEVM_toMeta(
  ctx: SDKGlobalContext,
  info: Omit<
    BridgeFromEVMInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    (KnownRoute_FromEVM_ToBRC20 | KnownRoute_FromEVM_ToRunes),
): Promise<BridgeFromEVMOutput> {
  const { bridgeEndpointContractAddress: bridgeEndpointAddress } =
    (await getEVMContractCallInfo(ctx, info.fromChain)) ?? {}
  const fromTokenContractInfo = await getEVMTokenContractInfo(
    ctx,
    info.fromChain,
    info.fromToken,
  )
  if (
    bridgeEndpointAddress == null ||
    fromTokenContractInfo == null ||
    fromTokenContractInfo.tokenContractAddress === nativeCurrencyAddress
  ) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  if (info.toAddressScriptPubKey == null) {
    throw new InvalidMethodParametersError(
      [
        "XLinkSDK",
        `bridgeFromEVM (to ${KnownChainId.isBRC20Chain(info.toChain) ? "BRC20" : "Runes"})`,
      ],
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
    functionName: KnownChainId.isBRC20Chain(info.toChain)
      ? "transferToBRC20"
      : "transferToRunes",
    args: [toAddressHex],
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

  const fallbackGasLimit = 200_000
  const estimated = await estimateGas(fromTokenContractInfo.client, {
    account: info.fromAddress,
    to: bridgeEndpointAddress,
    data: functionData,
  })
    .then(n =>
      BigNumber.round(
        { precision: 0 },
        BigNumber.max([fallbackGasLimit, BigNumber.mul(n, 1.2)]),
      ),
    )
    .catch(
      // add a fallback in case estimate failed
      () => fallbackGasLimit,
    )

  return await info.sendTransaction({
    from: info.fromAddress,
    to: bridgeEndpointAddress,
    data: decodeHex(functionData),
    recommendedGasLimit: toSDKNumberOrUndefined(estimated),
  })
}

export async function bridgeFromEVM_toLaunchpad(
  ctx: SDKGlobalContext,
  info: {
    fromChain: KnownChainId.EVMChain
    fromToken: KnownTokenId.EVMToken
    fromAddress: EVMAddress
    receiverChain: KnownChainId.KnownChain
    receiverAddress: string
    /**
     * **Required** when `receiverChain` is one of bitcoin chains
     */
    receiverAddressScriptPubKey?: Uint8Array
    launchId: SDKNumber
    amount: SDKNumber
    sendTransaction: (tx: {
      from: EVMAddress
      to: EVMAddress
      data: Uint8Array
      recommendedGasLimit: SDKNumber
    }) => Promise<{
      txHash: string
    }>
  },
): Promise<BridgeFromEVMOutput> {
  const { bridgeEndpointContractAddress: bridgeEndpointAddress } =
    (await getEVMContractCallInfo(ctx, info.fromChain)) ?? {}
  const fromTokenContractInfo = await getEVMTokenContractInfo(
    ctx,
    info.fromChain,
    info.fromToken,
  )
  if (
    bridgeEndpointAddress == null ||
    fromTokenContractInfo == null ||
    fromTokenContractInfo.tokenContractAddress === nativeCurrencyAddress
  ) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.receiverChain,
      info.fromToken,
    )
  }

  if (
    KnownChainId.isBitcoinChain(info.receiverChain) &&
    info.receiverAddressScriptPubKey == null
  ) {
    throw new InvalidMethodParametersError(
      [
        "XLinkSDK",
        `bridgeFromEVM_toLaunchpad (to ${_knownChainIdToErrorMessagePart(info.receiverChain)})`,
      ],
      [
        {
          name: "toAddressScriptPubKey",
          expected: "Uint8Array",
          received: "undefined",
        },
      ],
    )
  }

  const toAddressHex =
    info.receiverAddressScriptPubKey != null
      ? toHex(info.receiverAddressScriptPubKey)
      : toHex(addressToBuffer(info.receiverChain, info.receiverAddress))

  const message = await encodeFunctionData({
    abi: sendMessageAbi,
    functionName: "transferToLaunchpad",
    args: [
      BigNumber.toBigInt({ roundingMode: BigNumber.roundDown }, info.launchId),
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

  const fallbackGasLimit = 200_000
  const estimated = await estimateGas(fromTokenContractInfo.client, {
    account: info.fromAddress,
    to: bridgeEndpointAddress,
    data: functionData,
  })
    .then(n =>
      BigNumber.round(
        { precision: 0 },
        BigNumber.max([fallbackGasLimit, BigNumber.mul(n, 1.2)]),
      ),
    )
    .catch(
      // add a fallback in case estimate failed
      () => fallbackGasLimit,
    )

  return await info.sendTransaction({
    from: info.fromAddress,
    to: bridgeEndpointAddress,
    data: decodeHex(functionData),
    recommendedGasLimit: toSDKNumberOrUndefined(estimated),
  })
}
