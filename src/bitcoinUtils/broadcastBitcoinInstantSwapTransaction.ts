import { NETWORK, TEST_NETWORK } from "@scure/btc-signer"
import { toSDKNumberOrUndefined } from "../sdkUtils/types"
import { SDKGlobalContext } from "../sdkUtils/types.internal"
import { CreateBridgeOrderResult } from "../stacksUtils/createBridgeOrderFromBitcoin"
import { range } from "../utils/arrayHelpers"
import { BigNumber } from "../utils/BigNumber"
import { KnownRoute_FromBitcoin_ToRunes } from "../utils/buildSupportedRoutes"
import { makeBytes } from "../utils/byteHelpers"
import { UnsupportedBridgeRouteError } from "../utils/errors"
import { encodeHex } from "../utils/hexHelpers"
import { SwapRouteViaInstantSwap_WithMinimumAmountsToReceive_Public } from "../utils/SwapRouteHelpers"
import { isNotNull } from "../utils/typeHelpers"
import { getChainIdNetworkType, KnownChainId } from "../utils/types/knownIds"
import { broadcastRevealableTransaction } from "./apiHelpers/broadcastRevealableTransaction"
import { createInstantSwapTx } from "./apiHelpers/createInstantSwapTx"
import { InstantSwapOrder } from "./apiHelpers/InstantSwapOrder"
import { scriptPubKeyToAddress } from "./bitcoinHelpers"
import { EstimateBitcoinTransactionOutput } from "./broadcastBitcoinTransaction"
import { BitcoinAddress, getBTCPegInAddress } from "./btcAddresses"
import { createTransaction } from "./createTransaction"
import {
  prepareBitcoinTransaction,
  PrepareBitcoinTransactionInput,
} from "./prepareBitcoinTransaction"
import { getPlaceholderUTXO } from "./selectUTXOs"
import {
  BridgeFromBitcoinInput_sendTransactionFn,
  BridgeFromBitcoinInput_signPsbtFn,
  SignPsbtInput_SigHash,
} from "./types"
import { getOutputDustThreshold } from "@c4/btc-utils"

export async function broadcastBitcoinInstantSwapTransaction(
  sdkContext: SDKGlobalContext,
  info: Omit<
    ConstructBitcoinInstantSwapTransactionInput,
    "orderData" | "pegInAddress"
  > & {
    sendTransaction: BridgeFromBitcoinInput_sendTransactionFn
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
  const pegInAddress = getBTCPegInAddress(info.fromChain, info.toChain)
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

  const psbtInfo = await constructBitcoinInstantSwapTransaction(sdkContext, {
    ...info,
    toChain: info.toChain,
    toToken: info.toToken,
    pegInAddress,
    orderData: order.orderData.data,
  })

  // should not happen
  if (psbtInfo.revealOutput == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

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
      pegInAddress: pegInAddress,
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

type ConstructBitcoinInstantSwapTransactionInput =
  PrepareTransactionCommonInput & {
    toAddressScriptPubKey: Uint8Array
    extraOutputs: {
      address: BitcoinAddress
      satsAmount: bigint
    }[]
    signPsbt: BridgeFromBitcoinInput_signPsbtFn
    pegInAddress: BitcoinAddress
    swapRoute: SwapRouteViaInstantSwap_WithMinimumAmountsToReceive_Public
  }
async function constructBitcoinInstantSwapTransaction(
  sdkContext: SDKGlobalContext,
  info: ConstructBitcoinInstantSwapTransactionInput,
): Promise<{
  psbt: Uint8Array
  revealOutput?: {
    index: number
    satsAmount: bigint
  }
  extraOutputs: {
    index: number
    satsAmount: bigint
  }[]
}> {
  const txOptions = await prepareTransactionCommon(sdkContext, info)

  const getSighashType = (idx: number): undefined | SignPsbtInput_SigHash => {
    if (idx === 0) return
    if (idx === 1) return SignPsbtInput_SigHash.SINGLE_ANYONECANPAY
    return SignPsbtInput_SigHash.NONE_ANYONECANPAY
  }

  const tx = createTransaction(
    txOptions.inputs.map((i, idx) => {
      const sighashType = getSighashType(idx)
      return {
        ...i,
        sighashType: sighashType == null ? undefined : Number(sighashType),
      }
    }),
    txOptions.recipients.concat({
      addressScriptPubKey: info.fromAddressScriptPubKey,
      satsAmount: txOptions.changeAmount,
    }),
    txOptions.opReturnScripts ?? [],
  )

  const { psbt } = await info.signPsbt({
    psbt: tx.toPSBT(),
    signInputs: range(0, tx.inputsLength).flatMap(idx => {
      const sighashType = getSighashType(idx)
      return sighashType == null ? [] : [[idx, sighashType]]
    }),
  })

  return {
    psbt,
    revealOutput: txOptions.revealOutput,
    extraOutputs: txOptions.appendOutputs,
  }
}

type EstimateBitcoinInstantSwapTransactionInput = Omit<
  PrepareTransactionCommonInput,
  "pegInAddress"
> & {
  extraOutputs: {
    address: BitcoinAddress
    satsAmount: bigint
  }[]
  orderData: Uint8Array
  swapRoute:
    | undefined
    | SwapRouteViaInstantSwap_WithMinimumAmountsToReceive_Public
}
export async function estimateBitcoinInstantSwapTransaction(
  sdkContext: SDKGlobalContext,
  info: EstimateBitcoinInstantSwapTransactionInput,
): Promise<EstimateBitcoinTransactionOutput> {
  const pegInAddress = getBTCPegInAddress(info.fromChain, info.toChain)
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

type PrepareTransactionCommonInput = KnownRoute_FromBitcoin_ToRunes &
  Omit<
    PrepareBitcoinTransactionInput,
    | "fromChain"
    | "fromToken"
    | "toChain"
    | "toToken"
    | "hardLinkageOutput"
    | "pinnedInputs"
    | "pinnedOutputs"
    | "appendOutputs"
  > & {
    extraOutputs: {
      address: BitcoinAddress
      satsAmount: bigint
    }[]
  }
async function prepareTransactionCommon(
  sdkContext: SDKGlobalContext,
  info: PrepareTransactionCommonInput,
): ReturnType<typeof prepareBitcoinTransaction> {
  const marketMakerPlaceholderUTXO = getPlaceholderUTXO({ amount: 546n })

  return await prepareBitcoinTransaction(sdkContext, {
    ...info,
    toChain: info.toChain as any,
    toToken: info.toToken as any,
    pinnedInputs: [
      // market maker runes input placeholder
      marketMakerPlaceholderUTXO,
    ],
    pinnedOutputs: [
      // market maker runes change output placeholder
      ...(!KnownChainId.isRunesChain(info.toChain)
        ? []
        : [
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
              satsAmount: marketMakerPlaceholderUTXO.amount,
            },
          ]),
    ],
    appendOutputs: [
      ...info.extraOutputs,
      // user receive runes output
      ...(!KnownChainId.isRunesChain(info.toChain)
        ? []
        : [
            {
              address: {
                address: info.toAddress,
                scriptPubKey: info.toAddressScriptPubKey!,
              },
              satsAmount: BigInt(
                getOutputDustThreshold({
                  scriptPubKey: info.toAddressScriptPubKey!,
                }),
              ),
            },
          ]),
    ],
    opReturnScripts: [
      // runestone placeholder output
      KnownChainId.isRunesChain(info.toChain)
        ? makeBytes(
            [
              0x6a /* OP_RETURN */,
              78 /* 80 (OP_RETURN max length) - OP_RETURN byte - OP_PUSHDATA byte */,
            ],
            80,
          )
        : null,
    ].filter(isNotNull),
    hardLinkageOutput: null,
  })
}
