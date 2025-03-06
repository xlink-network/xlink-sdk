import * as btc from "@scure/btc-signer"
import { isNotNull } from "../utils/typeHelpers"
import { BitcoinNetwork, isSameUTXO, UTXOBasic } from "./bitcoinHelpers"
import { createTransaction } from "./createTransaction"
import { prepareTransaction } from "./prepareTransaction"
import {
  GetConfirmedSpendableUTXOFn,
  reselectSpendableUTXOsFactory,
} from "./selectUTXOs"

export interface InscriptionRecipient {
  inscriptionUtxo: UTXOBasic
  addressScriptPubKey: Uint8Array
}

export async function createSendInscriptionTransaction(options: {
  network: BitcoinNetwork
  inscriptionRecipients: InscriptionRecipient[]
  changeAddressScriptPubKey: Uint8Array
  opReturnData?: Uint8Array[]
  availableFeeUtxos: UTXOBasic[]
  feeRate: bigint
  getUTXOSpendable: GetConfirmedSpendableUTXOFn
}): Promise<{
  tx: btc.Transaction
  inscriptionUtxoInputIndices: number[]
  bitcoinUtxoInputIndices: number[]
}> {
  const opReturnData = options.opReturnData ?? []

  const recipients = options.inscriptionRecipients.map(r => ({
    addressScriptPubKey: r.addressScriptPubKey,
    satsAmount: r.inscriptionUtxo.amount,
  }))

  const selectedUTXOs = await Promise.all(
    options.inscriptionRecipients.map(r =>
      options.getUTXOSpendable(r.inscriptionUtxo),
    ),
  ).then(utxos => utxos.filter(isNotNull))

  const {
    inputs,
    recipients: newRecipients,
    changeAmount,
  } = await prepareTransaction({
    recipients,
    changeAddressScriptPubKey: options.changeAddressScriptPubKey,
    opReturnData,
    feeRate: options.feeRate,
    pinnedUTXOs: selectedUTXOs,
    reselectSpendableUTXOs: reselectSpendableUTXOsFactory(
      options.availableFeeUtxos.filter(
        u => !selectedUTXOs.find(_u => isSameUTXO(u, _u)),
      ),
      options.getUTXOSpendable,
    ),
  })

  const tx = createTransaction(
    inputs,
    newRecipients.concat(
      changeAmount === 0n
        ? []
        : {
            addressScriptPubKey: options.changeAddressScriptPubKey,
            satsAmount: changeAmount,
          },
    ),
    opReturnData,
  )

  const inscriptionCount = options.inscriptionRecipients.length
  return {
    tx,
    inscriptionUtxoInputIndices: inputs
      .slice(0, inscriptionCount)
      .map((_, i) => i),
    bitcoinUtxoInputIndices: inputs
      .slice(inscriptionCount)
      .map((_, i) => i + inscriptionCount),
  }
}
