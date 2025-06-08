import { NETWORK, TEST_NETWORK } from "@scure/btc-signer"
import { bitcoinToSatoshi, createTransaction } from "../bitcoinHelpers"
import { broadcastRevealableTransaction } from "../bitcoinUtils/apiHelpers/broadcastRevealableTransaction"
import { createInstantSwapTx } from "../bitcoinUtils/apiHelpers/createInstantSwapTx"
import { InstantSwapOrder } from "../bitcoinUtils/apiHelpers/InstantSwapOrder"
import { scriptPubKeyToAddress } from "../bitcoinUtils/bitcoinHelpers"
import { EstimateBitcoinTransactionOutput } from "../bitcoinUtils/broadcastBitcoinTransaction"
import { BitcoinAddress } from "../bitcoinUtils/btcAddresses"
import { getPlaceholderUTXO } from "../bitcoinUtils/selectUTXOs"
import { SignPsbtInput_SigHash } from "../bitcoinUtils/types"
import { KnownRoute_FromRunes_ToBitcoin } from "../lowlevelUnstableInfos"
import { toSDKNumberOrUndefined } from "../sdkUtils/types"
import { SDKGlobalContext } from "../sdkUtils/types.internal"
import { CreateBridgeOrderResult } from "../stacksUtils/createBridgeOrderFromBitcoin"
import { range } from "../utils/arrayHelpers"
import { BigNumber } from "../utils/BigNumber"
import { KnownRoute_FromRunes_ToRunes } from "../utils/buildSupportedRoutes"
import { UnsupportedBridgeRouteError } from "../utils/errors"
import { encodeHex } from "../utils/hexHelpers"
import { SwapRouteViaInstantSwap_WithMinimumAmountsToReceive_Public } from "../utils/SwapRouteHelpers"
import { getChainIdNetworkType } from "../utils/types/knownIds"
import { getMetaPegInAddress } from "./btcAddresses"
import {
  prepareRunesTransaction,
  PrepareRunesTransactionInput,
} from "./prepareRunesTransaction"
import {
  BridgeFromRunesInput_sendTransactionFn,
  BridgeFromRunesInput_signPsbtFn,
} from "./types"

export async function broadcastRunesInstantSwapTransaction(
  sdkContext: SDKGlobalContext,
  info: Omit<
    ConstructRunesInstantSwapTransactionInput,
    "orderData" | "pegInAddress"
  > & {
    sendTransaction: BridgeFromRunesInput_sendTransactionFn
  },
  order: {
    orderData: CreateBridgeOrderResult
    swapRoute: SwapRouteViaInstantSwap_WithMinimumAmountsToReceive_Public
  },
): Promise<{
  txid: string
  extraOutputs: {
    index: number
    satsAmount: bigint
  }[]
}> {
  const pegInAddress = getMetaPegInAddress(info.fromChain, info.toChain)
  if (pegInAddress == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const instantSwapOrder: InstantSwapOrder = {
    fromChain: info.fromChain,
    fromAddress: info.fromAddressScriptPubKey,
    fromTokenId: info.fromToken,
    fromAmount: BigNumber.from(info.amount),
    toChain: info.toChain,
    toAddress: info.toAddressScriptPubKey,
    toTokenId: info.toToken,
    toAmountMinimum: BigNumber.from(order.swapRoute.minimumAmountsToReceive),
  }

  const psbtInfo = await constructRunesInstantSwapTransaction(sdkContext, {
    ...info,
    toChain: info.toChain as any,
    toToken: info.toToken as any,
    pegInAddress,
    orderData: order.orderData.data,
  })

  const tx = await createInstantSwapTx(sdkContext, {
    fromChain: info.fromChain,
    instantSwapOrder,
    psbt: psbtInfo.psbt,
  })
  const txHex = encodeHex(tx.tx)

  const { txid: apiBroadcastedTxId } = await broadcastRevealableTransaction(
    sdkContext,
    {
      fromChain: info.fromChain,
      transactionHex: `0x${txHex}`,
      orderData: order.orderData.data,
      orderOutputIndex: psbtInfo.revealOutput.index,
      orderOutputSatsAmount: psbtInfo.revealOutput.satsAmount,
      pegInAddress,
    },
  )

  const { txid: delegateBroadcastedTxId } = await info.sendTransaction({
    hex: txHex,
    pegInOrderOutput: {
      index: psbtInfo.revealOutput.index,
      amount: psbtInfo.revealOutput.satsAmount,
      orderData: order.orderData.data,
    },
  })

  if (apiBroadcastedTxId !== delegateBroadcastedTxId) {
    console.warn(
      "[bro-sdk] Transaction id broadcasted by API and delegatee are different:",
      `API: ${apiBroadcastedTxId}, `,
      `Delegatee: ${delegateBroadcastedTxId}`,
    )
  }

  return {
    txid: delegateBroadcastedTxId,
    extraOutputs: psbtInfo.extraOutputs,
  }
}

type ConstructRunesInstantSwapTransactionInput = Omit<
  PrepareTransactionCommonInput,
  "pegInAddress"
> &
  (KnownRoute_FromRunes_ToBitcoin | KnownRoute_FromRunes_ToRunes) & {
    toAddressScriptPubKey: Uint8Array
    signPsbt: BridgeFromRunesInput_signPsbtFn
    pegInAddress: BitcoinAddress
    swapRoute: SwapRouteViaInstantSwap_WithMinimumAmountsToReceive_Public
  }
async function constructRunesInstantSwapTransaction(
  sdkContext: SDKGlobalContext,
  info: ConstructRunesInstantSwapTransactionInput,
): Promise<{
  psbt: Uint8Array
  revealOutput: {
    index: number
    satsAmount: bigint
  }
  extraOutputs: {
    index: number
    satsAmount: bigint
  }[]
}> {
  const txOptions = await prepareTransactionCommon(sdkContext, info)

  const recipients = txOptions.recipients.concat({
    addressScriptPubKey: info.networkFeeChangeAddressScriptPubKey,
    satsAmount:
      txOptions.changeAmount +
      bitcoinToSatoshi(info.swapRoute.minimumAmountsToReceive),
  })

  const tx = createTransaction(
    txOptions.inputs,
    recipients,
    txOptions.opReturnScripts ?? [],
  )

  const getSignHashType = (idx: number): SignPsbtInput_SigHash => {
    if (idx === 0) return SignPsbtInput_SigHash.SINGLE_ANYONECANPAY
    if (idx === 1) return SignPsbtInput_SigHash.SINGLE_ANYONECANPAY
    return SignPsbtInput_SigHash.NONE_ANYONECANPAY
  }
  const { psbt } = await info.signPsbt({
    psbt: tx.toPSBT(),
    signRunesInputs: range(0, info.inputRuneUTXOs.length).map(idx => [
      idx,
      getSignHashType(idx),
    ]),
    signBitcoinInputs: range(info.inputRuneUTXOs.length, tx.inputsLength).map(
      idx => [idx, getSignHashType(idx)],
    ),
  })

  return {
    psbt,
    revealOutput: txOptions.revealOutput,
    extraOutputs: txOptions.appendOutputs,
  }
}

type EstimateRunesInstantSwapTransactionInput = Omit<
  PrepareTransactionCommonInput,
  "pegInAddress"
> & {
  orderData: Uint8Array
  swapRoute:
    | undefined
    | SwapRouteViaInstantSwap_WithMinimumAmountsToReceive_Public
}
export async function estimateRunesInstantSwapTransaction(
  sdkContext: SDKGlobalContext,
  info: EstimateRunesInstantSwapTransactionInput,
): Promise<EstimateBitcoinTransactionOutput> {
  const pegInAddress = getMetaPegInAddress(info.fromChain, info.toChain)
  if (pegInAddress == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const resp = await prepareTransactionCommon(sdkContext, {
    ...info,
    pegInAddress,
  })

  return {
    fee: toSDKNumberOrUndefined(resp.fee),
    estimatedVSize: toSDKNumberOrUndefined(resp.estimatedVSize),
    revealTransactionSatoshiAmount: toSDKNumberOrUndefined(
      resp.revealOutput.satsAmount,
    ),
  }
}

type PrepareTransactionCommonInput = Omit<
  PrepareRunesTransactionInput,
  | "fromChain"
  | "fromToken"
  | "toChain"
  | "toToken"
  | "hardLinkageOutput"
  | "pinnedInputs"
  | "appendInputs"
  | "pinnedOutputs"
  | "appendOutputs"
> &
  KnownRoute_FromRunes_ToBitcoin & {
    extraOutputs: {
      address: BitcoinAddress
      satsAmount: bigint
    }[]
  }
async function prepareTransactionCommon(
  sdkContext: SDKGlobalContext,
  info: PrepareTransactionCommonInput,
): ReturnType<typeof prepareRunesTransaction> {
  const marketMakerPlaceholderUTXO = getPlaceholderUTXO({ amount: 546n })

  return await prepareRunesTransaction(sdkContext, "bridgeFromRunes", {
    ...info,
    hardLinkageOutput: null,
    pinnedInputs: [],
    appendInputs: [
      // market maker placeholder bitcoin input
      marketMakerPlaceholderUTXO,
    ],
    pinnedOutputs: [],
    appendOutputs: [
      ...info.extraOutputs,
      // market maker placeholder bitcoin change output
      {
        address: {
          address: scriptPubKeyToAddress(
            getChainIdNetworkType(info.fromChain) === "mainnet"
              ? NETWORK
              : TEST_NETWORK,
            marketMakerPlaceholderUTXO.scriptPubKey,
          ),
          scriptPubKey: marketMakerPlaceholderUTXO.scriptPubKey,
        },
        satsAmount: 546n,
      },
    ],
  })
}
