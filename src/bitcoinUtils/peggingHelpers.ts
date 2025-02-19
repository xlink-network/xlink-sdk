import { evmTokenFromCorrespondingStacksToken } from "../evmUtils/peggingHelpers"
import { getEVMTokenContractInfo } from "../evmUtils/xlinkContractHelpers"
import {
  getBRC20SupportedRoutes,
  getRunesSupportedRoutes,
} from "../metaUtils/xlinkContractHelpers"
import { StacksContractName } from "../stacksUtils/stxContractAddresses"
import {
  executeReadonlyCallXLINK,
  getStacksContractCallInfo,
  getStacksTokenContractInfo,
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
  getSpecialFeeDetailsForSwapRoute,
  SpecialFeeDetailsForSwapRoute,
  SwapRoute,
  SwapRouteViaEVMDexAggregator,
} from "../utils/SwapRouteHelpers"
import { checkNever, isNotNull } from "../utils/typeHelpers"
import {
  _allNoLongerSupportedEVMChains,
  KnownChainId,
  KnownTokenId,
} from "../utils/types/knownIds"
import {
  TransferProphet,
  TransferProphet_Fee_Fixed,
  TransferProphet_Fee_Rate,
} from "../utils/types/TransferProphet"
import { SDKGlobalContext } from "../xlinkSdkUtils/types.internal"
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
  ctx: SDKGlobalContext,
  route: KnownRoute_FromStacks_ToBitcoin,
  options: {
    /**
     * the initial route step
     */
    initialRoute: null | KnownRoute_ToStacks
    /**
     * the swap step between the previous route and the current one
     */
    swapRoute: null | SwapRoute | SwapRouteViaEVMDexAggregator
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

  const feeDetails = await getSpecialFeeDetailsForSwapRoute(ctx, route, {
    initialRoute: options.initialRoute,
    swapRoute: options.swapRoute,
  }).then(
    async (info): Promise<SpecialFeeDetailsForSwapRoute> =>
      info ??
      props({
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
      }),
  )

  const resp = await props({
    ...feeDetails,
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
      } satisfies TransferProphet_Fee_Rate,
      feeDetails.gasFee == null
        ? null
        : ({
            type: "fixed",
            token: feeDetails.gasFee.token,
            amount: feeDetails.gasFee.amount,
          } satisfies TransferProphet_Fee_Fixed),
    ].filter(isNotNull),
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
          via: route.swapRoute.via,
          swap: route.swapRoute,
          stacksChain:
            fromChain === KnownChainId.Bitcoin.Mainnet
              ? KnownChainId.Stacks.Mainnet
              : KnownChainId.Stacks.Testnet,
        })

  if (KnownChainId.isStacksChain(toChain)) {
    if (!KnownTokenId.isStacksToken(toToken)) return false

    if (fromToken !== KnownTokenId.Bitcoin.BTC) return false

    const stacksTokenContractInfo = await getStacksTokenContractInfo(
      ctx,
      toChain,
      toToken,
    )
    if (stacksTokenContractInfo == null) return false

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
