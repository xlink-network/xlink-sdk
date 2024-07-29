import * as btc from "@scure/btc-signer"
import { UTXOBasic } from "./bitcoinHelpers"
import { Recipient, createTransaction } from "./createTransaction"
import { prepareTransaction } from "./prepareTransaction"
import {
  GetConfirmedSpendableUTXOFn,
  reselectSpendableUTXOsFactory,
} from "./selectUTXOs"

export async function createSendBitcoinTransaction(options: {
  recipients: Recipient[]
  changeAddressScriptKey: Uint8Array
  opReturnData?: Uint8Array[]
  feeRate: bigint
  availableFeeUtxos: UTXOBasic[]
  getUTXOSpendable: GetConfirmedSpendableUTXOFn
}): Promise<{
  tx: btc.Transaction
}> {
  const opReturnData = options.opReturnData ?? []

  const {
    inputs,
    recipients: newRecipients,
    changeAmount,
  } = await prepareTransaction({
    recipients: options.recipients,
    changeAddressScriptPubKey: options.changeAddressScriptKey,
    feeRate: options.feeRate,
    opReturnData,
    reselectSpendableUTXOs: reselectSpendableUTXOsFactory(
      options.availableFeeUtxos,
      options.getUTXOSpendable,
    ),
  })

  const tx = createTransaction(
    inputs,
    newRecipients.concat(
      changeAmount === 0n
        ? []
        : {
            addressScriptPubKey: options.changeAddressScriptKey,
            satsAmount: changeAmount,
          },
    ),
    opReturnData,
  )

  return { tx }
}
