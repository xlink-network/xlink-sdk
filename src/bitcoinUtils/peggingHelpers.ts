import { StacksNetwork } from "@stacks/network"
import { callReadOnlyFunction } from "@stacks/transactions"
import { CallReadOnlyFunctionFn } from "clarity-codegen"
import { fromCorrespondingStacksCurrency } from "../evmUtils/peggingHelpers"
import { getEVMTokenContractInfo } from "../evmUtils/xlinkContractHelpers"
import { stxTokenContractAddresses } from "../stacksUtils/stxContractAddresses"
import {
  executeReadonlyCallXLINK,
  numberFromStacksContractNumber,
} from "../stacksUtils/xlinkContractHelpers"
import { BigNumber } from "../utils/BigNumber"
import { IsSupportedFn } from "../utils/buildSupportedRoutes"
import { TransferProphet } from "../utils/feeRateHelpers"
import { props } from "../utils/promiseHelpers"
import { checkNever } from "../utils/typeHelpers"
import { KnownChainId, KnownTokenId } from "../utils/knownIds"

export const getBtc2StacksFeeInfo = async (contractCallInfo: {
  network: StacksNetwork
  endpointDeployerAddress: string
}): Promise<TransferProphet> => {
  const executeOptions = {
    deployerAddress: contractCallInfo.endpointDeployerAddress,
    callReadOnlyFunction: (callOptions =>
      callReadOnlyFunction({
        ...callOptions,
        network: contractCallInfo.network,
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
    minFeeAmount: resp.minFeeAmount,
    minBridgeAmount: BigNumber.isZero(resp.minFeeAmount)
      ? null
      : resp.minFeeAmount,
    maxBridgeAmount: null,
  }
}

export const getStacks2BtcFeeInfo = async (contractCallInfo: {
  network: StacksNetwork
  endpointDeployerAddress: string
}): Promise<TransferProphet> => {
  const executeOptions = {
    deployerAddress: contractCallInfo.endpointDeployerAddress,
    callReadOnlyFunction: (callOptions =>
      callReadOnlyFunction({
        ...callOptions,
        network: contractCallInfo.network,
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
    minFeeAmount: resp.minFeeAmount,
    minBridgeAmount: BigNumber.isZero(resp.minFeeAmount)
      ? null
      : resp.minFeeAmount,
    maxBridgeAmount: null,
  }
}

export const isSupportedBitcoinRoute: IsSupportedFn = async route => {
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

    const info = await getEVMTokenContractInfo(route.toChain, toEVMToken)
    if (info == null) return false

    return toEVMToken === route.toToken
  }

  checkNever(route.toChain)
  return false
}
