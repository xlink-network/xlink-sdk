import { StacksNetwork } from "@stacks/network"
import { callReadOnlyFunction } from "@stacks/transactions"
import { CallReadOnlyFunctionFn } from "clarity-codegen"
import {
  executeReadonlyCallXLINK,
  numberFromStacksContractNumber,
} from "../stacksUtils/xlinkContractHelpers"
import { BigNumber } from "../utils/BigNumber"
import { props } from "../utils/promiseHelpers"
import { TransferProphet } from "../utils/feeRateHelpers"

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
    minFee: resp.minFeeAmount,
    minAmount: BigNumber.isZero(resp.minFeeAmount) ? null : resp.minFeeAmount,
    maxAmount: null,
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
    minFee: resp.minFeeAmount,
    minAmount: BigNumber.isZero(resp.minFeeAmount) ? null : resp.minFeeAmount,
    maxAmount: null,
  }
}
