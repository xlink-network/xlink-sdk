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
import { checkNever, isNotNull } from "../utils/typeHelpers"
import { TransferProphet } from "../utils/types/TransferProphet"
import { KnownChainId, KnownTokenId } from "../utils/types/knownIds"
import { getBTCPegInAddress } from "./btcAddresses"
import { hasAny } from "../utils/arrayHelpers"

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
      "btc-peg-in-endpoint-v2-02",
      "is-peg-in-paused",
      {},
      executeOptions,
    ),
    feeRate: executeReadonlyCallXLINK(
      "btc-peg-in-endpoint-v2-02",
      "get-peg-in-fee",
      {},
      executeOptions,
    ).then(numberFromStacksContractNumber),
    minFeeAmount: executeReadonlyCallXLINK(
      "btc-peg-in-endpoint-v2-02",
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
  const { fromChain, toChain, fromToken, toToken } = route

  if (fromChain === toChain && fromToken === toToken) {
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

  if (KnownChainId.isStacksChain(toChain)) {
    if (!KnownTokenId.isStacksToken(toToken)) return false

    return (
      fromToken === KnownTokenId.Bitcoin.BTC &&
      toToken === KnownTokenId.Stacks.aBTC &&
      stxTokenContractAddresses[toToken]?.[toChain] != null
    )
  }

  if (KnownChainId.isEVMChain(toChain)) {
    const toEVMTokens = await fromCorrespondingStacksCurrency(
      toChain,
      KnownTokenId.Stacks.aBTC,
    )
    if (!hasAny(toEVMTokens)) return false

    const infos = (
      await Promise.all(
        toEVMTokens.map(token => getEVMTokenContractInfo(ctx, toChain, token)),
      )
    ).filter(isNotNull)
    if (!hasAny(infos)) return false

    return toEVMTokens.includes(toToken as any)
  }

  checkNever(toChain)
  return false
}
