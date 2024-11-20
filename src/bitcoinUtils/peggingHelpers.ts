import { callReadOnlyFunction } from "@stacks/transactions"
import { CallReadOnlyFunctionFn } from "clarity-codegen"
import { fromCorrespondingStacksToken } from "../evmUtils/peggingHelpers"
import { getEVMTokenContractInfo } from "../evmUtils/xlinkContractHelpers"
import { stxTokenContractAddresses } from "../stacksUtils/stxContractAddresses"
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
} from "../utils/buildSupportedRoutes"
import { props } from "../utils/promiseHelpers"
import { checkNever, isNotNull } from "../utils/typeHelpers"
import { TransferProphet } from "../utils/types/TransferProphet"
import {
  _allNoLongerSupportedEVMChains,
  KnownChainId,
  KnownTokenId,
} from "../utils/types/knownIds"
import { getBTCPegInAddress } from "./btcAddresses"
import { hasAny } from "../utils/arrayHelpers"

export const getBtc2StacksFeeInfo = async (
  route: KnownRoute_FromBitcoin_ToStacks,
): Promise<undefined | TransferProphet> => {
  const stacksContractCallInfo = getStacksContractCallInfo(
    route.toChain,
    "btc-peg-in-endpoint-v2-05",
  )
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
      stacksContractCallInfo.contractName,
      "is-peg-in-paused",
      {},
      executeOptions,
    ),
    feeRate: executeReadonlyCallXLINK(
      stacksContractCallInfo.contractName,
      "get-peg-in-fee",
      {},
      executeOptions,
    ).then(numberFromStacksContractNumber),
    minFeeAmount: executeReadonlyCallXLINK(
      stacksContractCallInfo.contractName,
      "get-peg-in-min-fee",
      {},
      executeOptions,
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
): Promise<undefined | TransferProphet> => {
  const stacksContractCallInfo = getStacksContractCallInfo(
    route.fromChain,
    "btc-peg-out-endpoint-v2-01",
  )
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
      stacksContractCallInfo.contractName,
      "is-peg-out-paused",
      {},
      executeOptions,
    ),
    feeRate: executeReadonlyCallXLINK(
      stacksContractCallInfo.contractName,
      "get-peg-out-fee",
      {},
      executeOptions,
    ).then(numberFromStacksContractNumber),
    minFeeAmount: executeReadonlyCallXLINK(
      stacksContractCallInfo.contractName,
      "get-peg-out-min-fee",
      {},
      executeOptions,
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
  if (KnownChainId.isRunesChain(toChain)) {
    return false
  }
  if (KnownChainId.isBRC20Chain(toChain)) {
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
    const toEVMTokens = await fromCorrespondingStacksToken(
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
