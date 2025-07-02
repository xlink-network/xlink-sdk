import { getOutputDustThreshold } from "@c4/btc-utils"
import { bitcoinToSatoshi, createTransaction } from "../bitcoinHelpers"
import { broadcastRevealableTransaction } from "../bitcoinUtils/apiHelpers/broadcastRevealableTransaction"
import { createInstantSwapTx } from "../bitcoinUtils/apiHelpers/createInstantSwapTx"
import { InstantSwapOrder } from "../bitcoinUtils/apiHelpers/InstantSwapOrder"
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
import { getMetaPegInAddress } from "./btcAddresses"
import {
  prepareRunesTransaction,
  PrepareRunesTransactionInput,
} from "./prepareRunesTransaction"
import {
  BridgeFromRunesInput_sendTransactionFn,
  BridgeFromRunesInput_signPsbtFn,
} from "./types"
import { entries } from "../utils/objectHelper"
import { parseRuneId } from "../runesHelpers"
import { Edict } from "../utils/RunesProtocol/RunesProtocol.types"
import { getChainIdNetworkType, KnownChainId } from "../utils/types/knownIds"
import { NETWORK, TEST_NETWORK } from "@scure/btc-signer"
import { scriptPubKeyToAddress } from "../bitcoinUtils/bitcoinHelpers"

export interface BroadcastRunesInstantSwapTransactionResponse {
  txid: string
  extraOutputs: {
    index: number
    satsAmount: bigint
  }[]
}
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
): Promise<BroadcastRunesInstantSwapTransactionResponse> {
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

type ConstructRunesInstantSwapTransactionInput = (
  | KnownRoute_FromRunes_ToBitcoin
  | KnownRoute_FromRunes_ToRunes
) &
  Omit<PrepareTransactionCommonInput, "pegInAddress"> & {
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

  const getSighashType = (idx: number): SignPsbtInput_SigHash => {
    if (idx === 0) return SignPsbtInput_SigHash.SINGLE_ANYONECANPAY
    if (idx === 1) return SignPsbtInput_SigHash.SINGLE_ANYONECANPAY
    return SignPsbtInput_SigHash.NONE_ANYONECANPAY
  }

  const tx = createTransaction(
    txOptions.inputs.map((i, idx) => ({
      ...i,
      sighashType: Number(getSighashType(idx)),
    })),
    recipients,
    txOptions.opReturnScripts ?? [],
  )

  const { psbt } = await info.signPsbt({
    psbt: tx.toPSBT(),
    signRunesInputs: range(0, info.inputRuneUTXOs.length).map(idx => [
      idx,
      getSighashType(idx),
    ]),
    signBitcoinInputs: range(info.inputRuneUTXOs.length, tx.inputsLength).map(
      idx => [idx, getSighashType(idx)],
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
  "fromChain" | "fromToken" | "toChain" | "toToken" | "hardLinkageOutput"
> &
  KnownRoute_FromRunes_ToBitcoin
async function prepareTransactionCommon(
  sdkContext: SDKGlobalContext,
  info: PrepareTransactionCommonInput,
): ReturnType<typeof prepareRunesTransaction> {
  return await prepareRunesTransaction(sdkContext, "bridgeFromRunes", {
    ...info,
    hardLinkageOutput: null,
  })
}

export type Runes2BitcoinInstantSwapTransactionParams = Pick<
  ConstructRunesInstantSwapTransactionInput,
  | "pinnedInputs"
  | "appendInputs"
  | "pinnedOutputs"
  | "appendOutputs"
  | "buildRunestone"
>
export async function getRunes2BitcoinInstantSwapTransactionParams(
  sdkContext: SDKGlobalContext,
  info: {
    fromChain: KnownChainId.RunesChain
    extraOutputs: {
      address: BitcoinAddress
      satsAmount: bigint
    }[]
  },
): Promise<{
  params: Runes2BitcoinInstantSwapTransactionParams
  transformResponse: (
    resp: BroadcastRunesInstantSwapTransactionResponse,
  ) => Promise<BroadcastRunesInstantSwapTransactionResponse>
}> {
  const marketMakerPlaceholderUTXO = getPlaceholderUTXO({ amount: 546n })

  const transformResponse = async (
    resp: BroadcastRunesInstantSwapTransactionResponse,
  ): Promise<BroadcastRunesInstantSwapTransactionResponse> => {
    return resp
  }

  /**
   * Transaction Structure:
   *
   * inputs:
   *   * USER runes input (SIGHASH_SINGLE | SIGHASH_ANYONECANPAY) // for swap
   *   * ...USER runes input (SIGHASH_SINGLE | SIGHASH_ANYONECANPAY)
   *   * USER bitcoin input (SIGHASH_SINGLE or SIGHASH_NONE | SIGHASH_ANYONECANPAY) // for network fee
   *   * ...USER bitcoin input (SIGHASH_NONE | SIGHASH_ANYONECANPAY)
   *   * MARKET MAKER bitcoin input PLACEHOLDER
   * outputs:
   *   * USER runes change (sealed)
   *   * peg-in order data (sealed) // this is the proof of user intent, should be sealed by user and not be tampered by the market maker
   *   * bridge fee (optional)
   *   * MARKET MAKER receive rune tokens PLACEHOLDER // a.k.a. peg-in rune token output
   *   * ...extra outputs (optional)
   *   * USER bitcoin change + receive bitcoin output
   *   * runestone
   *   * MARKET MAKER bitcoin change PLACEHOLDER
   */
  const params: Runes2BitcoinInstantSwapTransactionParams = {
    pinnedInputs: [],
    appendInputs: [
      // market maker bitcoin input placeholder
      marketMakerPlaceholderUTXO,
    ],
    pinnedOutputs: [],
    appendOutputs: [
      ...(info.extraOutputs ?? []),
      // market maker bitcoin change output placeholder
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
  }

  return {
    params,
    transformResponse,
  }
}

export type Runes2RunesInstantSwapTransactionParams = Pick<
  ConstructRunesInstantSwapTransactionInput,
  | "pinnedInputs"
  | "appendInputs"
  | "pinnedOutputs"
  | "appendOutputs"
  | "buildRunestone"
>
export async function getRunes2RunesInstantSwapTransactionParams(
  sdkContext: SDKGlobalContext,
  info: {
    toAddress: string
    toAddressScriptPubKey: Uint8Array
    extraOutputs: {
      address: BitcoinAddress
      satsAmount: bigint
    }[]
  },
): Promise<{
  params: Runes2RunesInstantSwapTransactionParams
  transformResponse: (
    resp: BroadcastRunesInstantSwapTransactionResponse,
  ) => Promise<BroadcastRunesInstantSwapTransactionResponse>
}> {
  const marketMakerPlaceholderUTXO = getPlaceholderUTXO({ amount: 546n })

  const transformResponse = async (
    resp: BroadcastRunesInstantSwapTransactionResponse,
  ): Promise<BroadcastRunesInstantSwapTransactionResponse> => {
    return {
      ...resp,
      extraOutputs: resp.extraOutputs.slice(1),
    }
  }

  /**
   * Transaction Structure:
   *
   * inputs:
   *   * USER runes input (SIGHASH_NONE | SIGHASH_ANYONECANPAY) // for swap
   *   * ...USER runes input (SIGHASH_SINGLE | SIGHASH_ANYONECANPAY)
   *   * USER bitcoin input (SIGHASH_SINGLE or SIGHASH_NONE | SIGHASH_ANYONECANPAY) // for network fee
   *   * ...USER bitcoin input (SIGHASH_NONE | SIGHASH_ANYONECANPAY)
   *   * MARKET MAKER runes input PLACEHOLDER
   * outputs:
   *   * MARKET MAKER runes change PLACEHOLDER + receive rune tokens
   *   * peg-in order data (sealed) // this is the proof of user intent, should be sealed by user and not be tampered by the market maker
   *   * bridge fee (optional)
   *   * USER receive rune tokens
   *   * ...extra outputs (optional)
   *   * USER bitcoin change
   *   * runestone
   */
  const params: Runes2RunesInstantSwapTransactionParams = {
    pinnedInputs: [],
    appendInputs: [
      // market maker runes input placeholder
      marketMakerPlaceholderUTXO,
    ],
    pinnedOutputs: [],
    appendOutputs: [
      {
        address: {
          address: info.toAddress,
          scriptPubKey: info.toAddressScriptPubKey,
        },
        satsAmount: BigInt(
          getOutputDustThreshold({
            scriptPubKey: info.toAddressScriptPubKey,
          }),
        ),
      },
      ...(info.extraOutputs ?? []),
    ],
    buildRunestone: info => {
      const userRunesChangeOutputIndex = info.extraOutputsStartIndex

      return {
        ...info.originalRunestone,
        edicts: entries(info.runeRawAmountsInTotal).flatMap(
          ([runeId, runeRawAmount]): Edict[] => {
            if (runeRawAmount == null || runeRawAmount === 0n) return []

            return [
              {
                id: parseRuneId(runeId),
                amount:
                  info.sendingRuneInfo.id !== runeId
                    ? runeRawAmount
                    : runeRawAmount - info.runeRawAmountToPegIn,
                output: BigInt(userRunesChangeOutputIndex),
              },
            ]
          },
        ),
      }
    },
  }

  return {
    params,
    transformResponse,
  }
}
