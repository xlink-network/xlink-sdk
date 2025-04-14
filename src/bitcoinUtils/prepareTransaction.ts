import {
  estimateTransactionVSizeAfterSign,
  EstimationOutput,
  getOutputDustThreshold,
  UnsupportedInputTypeError,
} from "@c4/btc-utils"
import { max, sum } from "../utils/bigintHelpers"
import { sumUTXO, UTXOSpendable } from "./bitcoinHelpers"
import { Recipient as _Recipient } from "./createTransaction"
import {
  InsufficientBitcoinBalanceError,
  UnsupportedBitcoinInput,
} from "./errors"

export type BitcoinRecipient = _Recipient

export type ReselectSpendableUTXOsFn = (
  satsToSend: bigint,
  pinnedUTXOs: UTXOSpendable[],
  lastTimeSelectedUTXOs: UTXOSpendable[],
) => Promise<UTXOSpendable[]>

export interface BitcoinTransactionPrepareResult {
  inputs: Array<UTXOSpendable>
  recipients: Array<BitcoinRecipient>
  opReturnScripts?: Uint8Array[]
  changeAmount: bigint
  fee: bigint
  estimatedVSize: number
}

export async function prepareTransaction(txInfo: {
  recipients: Array<BitcoinRecipient>
  changeAddressScriptPubKey: Uint8Array
  opReturnScripts?: Uint8Array[]
  pinnedUTXOs?: Array<UTXOSpendable>
  feeRate: bigint
  reselectSpendableUTXOs: ReselectSpendableUTXOsFn
}): Promise<BitcoinTransactionPrepareResult> {
  const {
    recipients,
    changeAddressScriptPubKey,
    opReturnScripts = [],
    pinnedUTXOs = [],
    feeRate,
    reselectSpendableUTXOs,
  } = txInfo

  const newRecipients = await Promise.all(
    recipients.map(async (r): Promise<_Recipient> => {
      const dustThreshold = await getOutputDustThresholdForOutput(
        r.addressScriptPubKey,
      )

      return {
        ...r,
        satsAmount: max([r.satsAmount, dustThreshold]),
      }
    }),
  )
  const newRecipientAddresses = newRecipients
    .map(r => r.addressScriptPubKey)
    .concat(changeAddressScriptPubKey)

  const satsToSend = sum(newRecipients.map(r => r.satsAmount))

  let lastSelectedUTXOs = pinnedUTXOs.slice()
  let lastSelectedUTXOSatsInTotal = sumUTXO(lastSelectedUTXOs)

  // Calculate fee
  let calculatedFee = await calculateFee({
    recipientAddressScriptPubKeys: newRecipientAddresses,
    opReturnScripts,
    selectedUTXOs: lastSelectedUTXOs,
    feeRate,
  })

  let loopTimes = 0
  while (lastSelectedUTXOSatsInTotal < satsToSend + calculatedFee.fee) {
    const newSatsToSend = satsToSend + calculatedFee.fee

    const newSelectedUTXOs = await reselectSpendableUTXOs(
      newSatsToSend,
      pinnedUTXOs,
      lastSelectedUTXOs,
    )

    const newSelectedUTXOSatsInTotal = sumUTXO(newSelectedUTXOs)

    // Check if selected UTXO satoshi amount has changed since last iteration
    // If it hasn't, there is insufficient balance
    if (newSelectedUTXOSatsInTotal < lastSelectedUTXOSatsInTotal) {
      throw new InsufficientBitcoinBalanceError()
    }

    lastSelectedUTXOSatsInTotal = newSelectedUTXOSatsInTotal
    lastSelectedUTXOs = newSelectedUTXOs

    // Re-calculate fee
    calculatedFee = await calculateFee({
      recipientAddressScriptPubKeys: newRecipientAddresses,
      opReturnScripts,
      selectedUTXOs: newSelectedUTXOs,
      feeRate,
    })

    loopTimes++
    if (loopTimes > 500) {
      // Exit after max 500 iterations
      throw new InsufficientBitcoinBalanceError()
    }
  }

  const changeOutputDustThreshold = await getOutputDustThresholdForOutput(
    changeAddressScriptPubKey,
  )
  const changeAmount =
    lastSelectedUTXOSatsInTotal - sum([satsToSend, calculatedFee.fee])

  let finalChangeAmount: bigint
  let finalFeeAmount: bigint
  if (changeAmount < changeOutputDustThreshold) {
    finalChangeAmount = 0n
    finalFeeAmount = lastSelectedUTXOSatsInTotal - satsToSend
  } else {
    finalChangeAmount = changeAmount
    finalFeeAmount = calculatedFee.fee
  }

  return {
    inputs: lastSelectedUTXOs,
    recipients: newRecipients,
    opReturnScripts: txInfo.opReturnScripts,
    changeAmount: finalChangeAmount,
    fee: finalFeeAmount,
    estimatedVSize: calculatedFee.estimatedVSize,
  }
}

async function getOutputDustThresholdForOutput(
  outputAddressScriptPubKey: Uint8Array,
): Promise<bigint> {
  return BigInt(
    Math.ceil(
      getOutputDustThreshold({
        scriptPubKey: outputAddressScriptPubKey,
      }),
    ),
  )
}

/**
 * https://github.com/bitcoin-dot-org/developer.bitcoin.org/blob/813ba3fb5eae85cfdfffe91d12f2df653ea8b725/devguide/transactions.rst?plain=1#L314
 * https://github.com/bitcoin/bitcoin/blob/2ffaa927023f5dc2a7b8d6cfeb4f4810e573b18c/src/policy/policy.h#L57
 */
const DEFAULT_MIN_RELAY_TX_FEE = 1000n

export async function calculateFee(info: {
  recipientAddressScriptPubKeys: Uint8Array[]
  opReturnScripts: Uint8Array[]
  selectedUTXOs: Array<UTXOSpendable>
  feeRate: bigint
  extraSize?: number
}): Promise<{
  fee: bigint
  estimatedVSize: number
}> {
  const outputs: EstimationOutput[] = [
    ...info.recipientAddressScriptPubKeys.map(r => ({
      scriptPubKey: r,
    })),
    ...info.opReturnScripts.map(script => ({
      scriptPubKey: script,
    })),
  ]

  try {
    const vSize = estimateTransactionVSizeAfterSign({
      inputs: info.selectedUTXOs,
      outputs,
    })

    const txSize = BigInt(Math.ceil(vSize))

    return {
      estimatedVSize: vSize,
      fee: max([info.feeRate * txSize, DEFAULT_MIN_RELAY_TX_FEE]),
    }
  } catch (e) {
    if (e instanceof UnsupportedInputTypeError) {
      const input = e.cause as UTXOSpendable
      throw new UnsupportedBitcoinInput(input.txId, input.index)
    }
    throw e
  }
}
