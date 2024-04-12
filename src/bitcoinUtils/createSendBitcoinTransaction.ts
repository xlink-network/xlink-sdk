import * as btc from "@scure/btc-signer"
import { BitcoinNetwork, UTXOBasic } from "./bitcoinHelpers"
import { Recipient, createTransaction } from "./createTransaction"
import { prepareTransaction } from "./prepareTransaction"
import {
  GetConfirmedSpendableUTXOFn,
  reselectSpendableUTXOsFactory,
} from "./selectUTXOs"

export async function createSendBitcoinTransaction(options: {
  network: BitcoinNetwork
  recipients: Recipient[]
  changeAddress: string
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
    changeAddress: options.changeAddress,
    feeRate: options.feeRate,
    opReturnData,
    network: options.network,
    reselectSpendableUTXOs: reselectSpendableUTXOsFactory(
      options.availableFeeUtxos,
      options.getUTXOSpendable,
    ),
  })

  const tx = createTransaction(
    options.network,
    inputs,
    newRecipients.concat(
      changeAmount === 0n
        ? []
        : {
            address: options.changeAddress,
            satsAmount: changeAmount,
          },
    ),
    opReturnData,
  )

  return { tx }
}
