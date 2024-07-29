import { callReadOnlyFunction } from "@stacks/transactions"
import { CallReadOnlyFunctionFn } from "clarity-codegen"
import { fromCorrespondingStacksCurrency } from "../evmUtils/peggingHelpers"
import { getEVMTokenContractInfo } from "../evmUtils/xlinkContractHelpers"
import { stxTokenContractAddresses } from "../stacksUtils/stxContractAddresses"
import {
  executeReadonlyCallXLINK,
  getStacksContractCallInfo,
  numberFromStacksContractNumber,
} from "../stacksUtils/xlinkContractHelpers"
import { BigNumber } from "../utils/BigNumber"
import { IsSupportedFn } from "../utils/buildSupportedRoutes"
import { props } from "../utils/promiseHelpers"
import { checkNever } from "../utils/typeHelpers"
import { TransferProphet } from "../utils/types/TransferProphet"
import { KnownChainId, KnownTokenId } from "../utils/types/knownIds"
import { getBTCPegInAddress } from "./btcAddresses"

export const getBtc2StacksFeeInfo = async (route: {
  fromChain: KnownChainId.BitcoinChain
  fromToken: KnownTokenId.BitcoinToken
  toChain: KnownChainId.StacksChain
  toToken: KnownTokenId.StacksToken
}): Promise<undefined | TransferProphet> => {
  const stacksContractCallInfo = getStacksContractCallInfo(route.toChain)
  if (stacksContractCallInfo == null) return

  const executeOptions = {
    deployerAddress: stacksContractCallInfo.deployerAddress,
    callReadOnlyFunction: (callOptions =>
      callReadOnlyFunction({
        ...callOptions,
        network: stacksContractCallInfo.network,
      })) satisfies CallReadOnlyFunctionFn,
  }

  const resp = await props({
    isPaused: executeReadonlyCallXLINK(
      "btc-peg-in-endpoint-v2-01",
      "is-peg-in-paused",
      {},
      executeOptions,
    ),
    feeRate: executeReadonlyCallXLINK(
      "btc-peg-in-endpoint-v2-01",
      "get-peg-in-fee",
      {},
      executeOptions,
    ).then(numberFromStacksContractNumber),
    minFeeAmount: executeReadonlyCallXLINK(
      "btc-peg-in-endpoint-v2-01",
      "get-peg-in-min-fee",
      {},
      executeOptions,
    ).then(numberFromStacksContractNumber),
  })

  return {
    isPaused: resp.isPaused,
    feeRate: resp.feeRate,
    feeToken: route.fromToken,
    minFeeAmount: resp.minFeeAmount,
    minBridgeAmount: BigNumber.isZero(resp.minFeeAmount)
      ? null
      : resp.minFeeAmount,
    maxBridgeAmount: null,
  }
}

export const getStacks2BtcFeeInfo = async (route: {
  fromChain: KnownChainId.StacksChain
  fromToken: KnownTokenId.StacksToken
  toChain: KnownChainId.BitcoinChain
  toToken: KnownTokenId.BitcoinToken
}): Promise<undefined | TransferProphet> => {
  const stacksContractCallInfo = getStacksContractCallInfo(route.fromChain)
  if (stacksContractCallInfo == null) return

  const executeOptions = {
    deployerAddress: stacksContractCallInfo.deployerAddress,
    callReadOnlyFunction: (callOptions =>
      callReadOnlyFunction({
        ...callOptions,
        network: stacksContractCallInfo.network,
      })) satisfies CallReadOnlyFunctionFn,
  }

  const resp = await props({
    isPaused: executeReadonlyCallXLINK(
      "btc-peg-out-endpoint-v2-01",
      "is-peg-out-paused",
      {},
      executeOptions,
    ),
    feeRate: executeReadonlyCallXLINK(
      "btc-peg-out-endpoint-v2-01",
      "get-peg-out-fee",
      {},
      executeOptions,
    ).then(numberFromStacksContractNumber),
    minFeeAmount: executeReadonlyCallXLINK(
      "btc-peg-out-endpoint-v2-01",
      "get-peg-out-min-fee",
      {},
      executeOptions,
    ).then(numberFromStacksContractNumber),
  })

  return {
    isPaused: resp.isPaused,
    feeRate: resp.feeRate,
    feeToken: route.fromToken,
    minFeeAmount: resp.minFeeAmount,
    minBridgeAmount: BigNumber.isZero(resp.minFeeAmount)
      ? null
      : resp.minFeeAmount,
    maxBridgeAmount: null,
  }
}

export const isSupportedBitcoinRoute: IsSupportedFn = async (ctx, route) => {
  if (route.fromChain === route.toChain && route.fromToken === route.toToken) {
    return false
  }
  if (
    !KnownChainId.isBitcoinChain(route.fromChain) ||
    !KnownTokenId.isBitcoinToken(route.fromToken)
  ) {
    return false
  }
  if (!KnownChainId.isKnownChain(route.toChain)) return false

  const pegInAddress = getBTCPegInAddress(route.fromChain, route.toChain)
  if (pegInAddress == null) return false

  if (KnownChainId.isBitcoinChain(route.toChain)) {
    return false
  }

  if (KnownChainId.isStacksChain(route.toChain)) {
    if (!KnownTokenId.isStacksToken(route.toToken)) return false

    return (
      route.fromToken === KnownTokenId.Bitcoin.BTC &&
      route.toToken === KnownTokenId.Stacks.aBTC &&
      stxTokenContractAddresses[route.toToken]?.[route.toChain] != null
    )
  }

  if (KnownChainId.isEVMChain(route.toChain)) {
    const toEVMToken = await fromCorrespondingStacksCurrency(
      route.toChain,
      KnownTokenId.Stacks.aBTC,
    )
    if (toEVMToken == null) return false

    const info = await getEVMTokenContractInfo(ctx, route.toChain, toEVMToken)
    if (info == null) return false

    return toEVMToken === route.toToken
  }

  checkNever(route.toChain)
  return false
}
