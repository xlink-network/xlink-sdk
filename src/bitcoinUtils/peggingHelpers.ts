import { evmTokenFromCorrespondingStacksToken } from "../evmUtils/peggingHelpers"
import { getEVMTokenContractInfo } from "../evmUtils/xlinkContractHelpers"
import {
  getBRC20SupportedRoutes,
  getRunesSupportedRoutes,
} from "../metaUtils/xlinkContractHelpers"
import {
  StacksContractName,
  stxTokenContractAddresses,
} from "../stacksUtils/stxContractAddresses"
import {
  executeReadonlyCallXLINK,
  getStacksContractCallInfo,
  numberFromStacksContractNumber,
} from "../stacksUtils/xlinkContractHelpers"
import { BigNumber } from "../utils/BigNumber"
import {
  IsSupportedFn,
  KnownRoute_FromBitcoin_ToStacks,
  KnownRoute_FromStacks_ToBitcoin,
  KnownRoute_ToStacks,
} from "../utils/buildSupportedRoutes"
import { props } from "../utils/promiseHelpers"
import {
  getFinalStepStacksTokenAddress,
  SwapRoute,
} from "../utils/SwapRouteHelpers"
import { assertExclude, checkNever } from "../utils/typeHelpers"
import {
  _allNoLongerSupportedEVMChains,
  KnownChainId,
  KnownTokenId,
} from "../utils/types/knownIds"
import { TransferProphet } from "../utils/types/TransferProphet"
import { getBTCPegInAddress } from "./btcAddresses"

export const getBtc2StacksFeeInfo = async (
  route: KnownRoute_FromBitcoin_ToStacks,
  options: {
    swapRoute: null | SwapRoute
  },
): Promise<undefined | TransferProphet> => {
  const stacksBaseContractCallInfo = getStacksContractCallInfo(
    route.toChain,
    StacksContractName.BTCPegInEndpoint,
  )
  const stacksSwapContractCallInfo = getStacksContractCallInfo(
    route.toChain,
    StacksContractName.BTCPegInEndpointSwap,
  )
  if (
    stacksBaseContractCallInfo == null ||
    stacksSwapContractCallInfo == null
  ) {
    return
  }

  const contractCallInfo =
    options.swapRoute == null
      ? stacksBaseContractCallInfo
      : stacksSwapContractCallInfo

  const resp = await props({
    isPaused: executeReadonlyCallXLINK(
      contractCallInfo.contractName,
      "is-peg-in-paused",
      {},
      contractCallInfo.executeOptions,
    ),
    feeRate: executeReadonlyCallXLINK(
      contractCallInfo.contractName,
      "get-peg-in-fee",
      {},
      contractCallInfo.executeOptions,
    ).then(numberFromStacksContractNumber),
    minFeeAmount: executeReadonlyCallXLINK(
      contractCallInfo.contractName,
      "get-peg-in-min-fee",
      {},
      contractCallInfo.executeOptions,
    ).then(numberFromStacksContractNumber),
  })

  return {
    isPaused: resp.isPaused,
    bridgeToken: route.fromToken,
    fees: [
      {
        type: "rate",
        token: route.fromToken,
        rate: resp.feeRate,
        minimumAmount: resp.minFeeAmount,
      },
    ],
    minBridgeAmount: BigNumber.isZero(resp.minFeeAmount)
      ? null
      : resp.minFeeAmount,
    maxBridgeAmount: null,
  }
}

export const getStacks2BtcFeeInfo = async (
  route: KnownRoute_FromStacks_ToBitcoin,
  options: {
    swappedFromRoute: null | KnownRoute_ToStacks
  },
): Promise<undefined | TransferProphet> => {
  const stacksContractCallInfo = getStacksContractCallInfo(
    route.fromChain,
    StacksContractName.BTCPegOutEndpoint,
  )
  const btcPegInSwapContractCallInfo = getStacksContractCallInfo(
    route.fromChain,
    StacksContractName.BTCPegInEndpointSwap,
  )
  const metaPegInSwapContractCallInfo = getStacksContractCallInfo(
    route.fromChain,
    StacksContractName.MetaPegInEndpointSwap,
  )
  if (
    stacksContractCallInfo == null ||
    btcPegInSwapContractCallInfo == null ||
    metaPegInSwapContractCallInfo == null
  ) {
    return
  }

  let feeInfo:
    | undefined
    | {
        feeRate: Promise<BigNumber>
        minFeeAmount: Promise<BigNumber>
      }
  if (options.swappedFromRoute != null) {
    if (KnownChainId.isBitcoinChain(options.swappedFromRoute.fromChain)) {
      feeInfo = {
        feeRate: executeReadonlyCallXLINK(
          btcPegInSwapContractCallInfo.contractName,
          "get-btc-peg-out-fee",
          {},
          btcPegInSwapContractCallInfo.executeOptions,
        ).then(numberFromStacksContractNumber),
        minFeeAmount: executeReadonlyCallXLINK(
          btcPegInSwapContractCallInfo.contractName,
          "get-btc-peg-out-min-fee",
          {},
          btcPegInSwapContractCallInfo.executeOptions,
        ).then(numberFromStacksContractNumber),
      }
    } else if (
      KnownChainId.isBRC20Chain(options.swappedFromRoute.fromChain) ||
      KnownChainId.isRunesChain(options.swappedFromRoute.fromChain)
    ) {
      feeInfo = {
        feeRate: executeReadonlyCallXLINK(
          metaPegInSwapContractCallInfo.contractName,
          "get-btc-peg-out-fee",
          {},
          metaPegInSwapContractCallInfo.executeOptions,
        ).then(numberFromStacksContractNumber),
        minFeeAmount: executeReadonlyCallXLINK(
          metaPegInSwapContractCallInfo.contractName,
          "get-btc-peg-out-min-fee",
          {},
          metaPegInSwapContractCallInfo.executeOptions,
        ).then(numberFromStacksContractNumber),
      }
    } else {
      assertExclude(
        options.swappedFromRoute.fromChain,
        assertExclude.i<KnownChainId.EVMChain>(),
      )
      checkNever(options.swappedFromRoute)
    }
  }
  if (feeInfo == null) {
    feeInfo = {
      feeRate: executeReadonlyCallXLINK(
        stacksContractCallInfo.contractName,
        "get-peg-out-fee",
        {},
        stacksContractCallInfo.executeOptions,
      ).then(numberFromStacksContractNumber),
      minFeeAmount: executeReadonlyCallXLINK(
        stacksContractCallInfo.contractName,
        "get-peg-out-min-fee",
        {},
        stacksContractCallInfo.executeOptions,
      ).then(numberFromStacksContractNumber),
    }
  }

  const resp = await props({
    ...feeInfo,
    isPaused: executeReadonlyCallXLINK(
      stacksContractCallInfo.contractName,
      "is-peg-out-paused",
      {},
      stacksContractCallInfo.executeOptions,
    ),
  })

  return {
    isPaused: resp.isPaused,
    bridgeToken: route.fromToken,
    fees: [
      {
        type: "rate",
        token: route.fromToken,
        rate: resp.feeRate,
        minimumAmount: resp.minFeeAmount,
      },
    ],
    minBridgeAmount: BigNumber.isZero(resp.minFeeAmount)
      ? null
      : resp.minFeeAmount,
    maxBridgeAmount: null,
  }
}

export const isSupportedBitcoinRoute: IsSupportedFn = async (ctx, route) => {
  const { fromChain, toChain, fromToken, toToken } = route

  if (fromChain === toChain && fromToken === toToken) {
    return false
  }

  if (
    KnownChainId.isEVMChain(fromChain) &&
    _allNoLongerSupportedEVMChains.includes(fromChain)
  ) {
    return false
  }
  if (
    KnownChainId.isEVMChain(toChain) &&
    _allNoLongerSupportedEVMChains.includes(toChain)
  ) {
    return false
  }

  if (
    !KnownChainId.isBitcoinChain(fromChain) ||
    !KnownTokenId.isBitcoinToken(fromToken)
  ) {
    return false
  }
  if (!KnownChainId.isKnownChain(toChain)) return false

  const pegInAddress = getBTCPegInAddress(fromChain, toChain)
  if (pegInAddress == null) return false

  if (KnownChainId.isBitcoinChain(toChain)) {
    return false
  }

  const finalStepStacksToken =
    route.swapRoute == null
      ? KnownTokenId.Stacks.aBTC
      : await getFinalStepStacksTokenAddress(ctx, {
          swap: route.swapRoute,
          stacksChain:
            fromChain === KnownChainId.Bitcoin.Mainnet
              ? KnownChainId.Stacks.Mainnet
              : KnownChainId.Stacks.Testnet,
        })

  if (KnownChainId.isStacksChain(toChain)) {
    if (!KnownTokenId.isStacksToken(toToken)) return false

    if (fromToken !== KnownTokenId.Bitcoin.BTC) return false
    if (stxTokenContractAddresses[toToken]?.[toChain] == null) return false

    return toToken === finalStepStacksToken
  }

  if (KnownChainId.isEVMChain(toChain)) {
    if (!KnownTokenId.isEVMToken(toToken)) return false

    const info = await getEVMTokenContractInfo(ctx, toChain, toToken)
    if (info == null) return false

    if (finalStepStacksToken == null) return false

    return evmTokenFromCorrespondingStacksToken(
      toChain,
      finalStepStacksToken,
    ).then(toEVMTokens => toEVMTokens.includes(toToken))
  }

  if (KnownChainId.isRunesChain(toChain)) {
    const routes = await getRunesSupportedRoutes(ctx, toChain)
    return routes.some(
      route =>
        route.runesToken === toToken &&
        route.stacksToken === finalStepStacksToken,
    )
  }

  if (KnownChainId.isBRC20Chain(toChain)) {
    const routes = await getBRC20SupportedRoutes(ctx, toChain)
    return routes.some(
      route =>
        route.brc20Token === toToken &&
        route.stacksToken === finalStepStacksToken,
    )
  }

  checkNever(toChain)
  return false
}
