import {
  estimateTransactionVSizeAfterSign,
  EstimationOutput,
  getOutputDustThreshold,
  UnsupportedInputTypeError,
} from "@c4/btc-utils"
import * as btc from "@scure/btc-signer"
import { InsufficientBalanceError, UnsupportedBitcoinInput } from "./errors"
import { max, sum } from "../utils/bigintHelpers"
import {
  addressToScriptPubKey,
  BitcoinNetwork,
  sumUTXO,
  UTXOSpendable,
} from "./bitcoinHelpers"
import { Recipient as _Recipient } from "./createTransaction"

export type BitcoinRecipient = _Recipient

export type ReselectSpendableUTXOsFn = (
  satsToSend: bigint,
  pinnedUTXOs: UTXOSpendable[],
  lastTimeSelectedUTXOs: UTXOSpendable[],
) => Promise<UTXOSpendable[]>

export async function prepareTransaction(txInfo: {
  network: BitcoinNetwork
  recipients: Array<BitcoinRecipient>
  changeAddress: string
  opReturnData?: Uint8Array[]
  selectedUTXOs?: Array<UTXOSpendable>
  feeRate: bigint
  reselectSpendableUTXOs: ReselectSpendableUTXOsFn
}): Promise<{
  inputs: Array<UTXOSpendable>
  recipients: Array<BitcoinRecipient>
  changeAmount: bigint
  fee: bigint
}> {
  const {
    network,
    recipients,
    changeAddress,
    opReturnData = [],
    selectedUTXOs = [],
    feeRate,
    reselectSpendableUTXOs,
  } = txInfo

  const newRecipients = await Promise.all(
    recipients.map(async (r): Promise<_Recipient> => {
      const dustThreshold = await getOutputDustThresholdForOutput(
        network,
        r.address,
      )

      return {
        ...r,
        satsAmount: max([r.satsAmount, dustThreshold]),
      }
    }),
  )
  const newRecipientAddresses = newRecipients
    .map(r => r.address)
    .concat(changeAddress)

  const satsToSend = sum(newRecipients.map(r => r.satsAmount))

  let lastSelectedUTXOs = selectedUTXOs.slice()
  let lastSelectedUTXOSatsInTotal = sumUTXO(lastSelectedUTXOs)

  // Calculate fee
  let calculatedFee = await calculateFee(
    network,
    newRecipientAddresses,
    opReturnData,
    lastSelectedUTXOs,
    feeRate,
  )

  let loopTimes = 0
  while (lastSelectedUTXOSatsInTotal < satsToSend + calculatedFee) {
    const newSatsToSend = satsToSend + calculatedFee

    const newSelectedUTXOs = await reselectSpendableUTXOs(
      newSatsToSend,
      selectedUTXOs,
      lastSelectedUTXOs,
    )

    const newSelectedUTXOSatsInTotal = sumUTXO(newSelectedUTXOs)

    // Check if selected UTXO satoshi amount has changed since last iteration
    // If it hasn't, there is insufficient balance
    if (newSelectedUTXOSatsInTotal < lastSelectedUTXOSatsInTotal) {
      throw new InsufficientBalanceError()
    }

    lastSelectedUTXOSatsInTotal = newSelectedUTXOSatsInTotal
    lastSelectedUTXOs = newSelectedUTXOs

    // Re-calculate fee
    calculatedFee = await calculateFee(
      network,
      newRecipientAddresses,
      opReturnData,
      lastSelectedUTXOs,
      feeRate,
    )

    loopTimes++
    if (loopTimes > 500) {
      // Exit after max 500 iterations
      throw new InsufficientBalanceError()
    }
  }

  const changeOutputDustThreshold = await getOutputDustThresholdForOutput(
    network,
    changeAddress,
  )
  const changeAmount =
    lastSelectedUTXOSatsInTotal - sum([satsToSend, calculatedFee])

  let finalChangeAmount: bigint
  let finalFeeAmount: bigint
  if (changeAmount < changeOutputDustThreshold) {
    finalChangeAmount = 0n
    finalFeeAmount = lastSelectedUTXOSatsInTotal - satsToSend
  } else {
    finalChangeAmount = changeAmount
    finalFeeAmount = calculatedFee
  }

  return {
    inputs: lastSelectedUTXOs,
    recipients: newRecipients,
    changeAmount: finalChangeAmount,
    fee: finalFeeAmount,
  }
}

async function getOutputDustThresholdForOutput(
  network: BitcoinNetwork,
  outputAddress: string,
): Promise<bigint> {
  return BigInt(
    Math.ceil(
      getOutputDustThreshold({
        scriptPubKey: addressToScriptPubKey(network, outputAddress),
      }),
    ),
  )
}

/**
 * https://github.com/bitcoin-dot-org/developer.bitcoin.org/blob/813ba3fb5eae85cfdfffe91d12f2df653ea8b725/devguide/transactions.rst?plain=1#L314
 * https://github.com/bitcoin/bitcoin/blob/2ffaa927023f5dc2a7b8d6cfeb4f4810e573b18c/src/policy/policy.h#L57
 */
const DEFAULT_MIN_RELAY_TX_FEE = 1000n

async function calculateFee(
  network: BitcoinNetwork,
  recipientAddresses: string[],
  opReturnData: Uint8Array[],
  selectedUTXOs: Array<UTXOSpendable>,
  feeRate: bigint,
): Promise<bigint> {
  const outputs: EstimationOutput[] = [
    ...recipientAddresses.map(r => ({
      scriptPubKey: addressToScriptPubKey(network, r),
    })),
    ...opReturnData.map(data => ({
      scriptPubKey: btc.Script.encode(["RETURN", data]),
    })),
  ]

  try {
    const txSize = BigInt(
      Math.ceil(
        estimateTransactionVSizeAfterSign({
          inputs: selectedUTXOs,
          outputs,
        }),
      ),
    )

    return max([feeRate * txSize, DEFAULT_MIN_RELAY_TX_FEE])
  } catch (e) {
    if (e instanceof UnsupportedInputTypeError) {
      const input = e.cause as UTXOSpendable
      throw new UnsupportedBitcoinInput(input.txId, input.index)
    }
    throw e
  }
}
