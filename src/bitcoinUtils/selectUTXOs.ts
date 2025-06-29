import { sortBy } from "../utils/arrayHelpers"
import { MAX_BIGINT, sum } from "../utils/bigintHelpers"
import { decodeHex } from "../utils/hexHelpers"
import { isNotNull } from "../utils/typeHelpers"
import {
  excludeUTXOs,
  isSameUTXO,
  sumUTXO,
  UTXOBasic,
  UTXOConfirmed,
  UTXOSpendable,
} from "./bitcoinHelpers"
import { ReselectSpendableUTXOsFn } from "./prepareTransaction"

export type GetConfirmedSpendableUTXOFn = (
  utxo: UTXOBasic,
) => Promise<undefined | (UTXOSpendable & UTXOConfirmed)>

export const reselectSpendableUTXOsFactory = (
  availableUTXOs: UTXOBasic[],
  getUTXOSpendable: GetConfirmedSpendableUTXOFn,
): ReselectSpendableUTXOsFn_Public => {
  return async (satsToSend, _lastTimeSelectedUTXOs) => {
    const lastTimeSelectedUTXOs = await Promise.all(
      _lastTimeSelectedUTXOs.map(fetchingUtxo =>
        getUTXOSpendable(fetchingUtxo),
      ),
    ).then(utxos => utxos.filter(isNotNull))

    const otherAvailableUTXOs = await Promise.all(
      availableUTXOs
        .filter(
          availableUTXO =>
            !lastTimeSelectedUTXOs.find(selectedUTXO =>
              isSameUTXO(availableUTXO, selectedUTXO),
            ),
        )
        .map(getUTXOSpendable),
    ).then(utxos => utxos.filter(isNotNull))

    const allUTXOSpendable = [...lastTimeSelectedUTXOs, ...otherAvailableUTXOs]
    const finalSelectedBasicUTXOs = selectUTXOs(
      satsToSend,
      lastTimeSelectedUTXOs,
      otherAvailableUTXOs,
    )
    return finalSelectedBasicUTXOs
      .map(utxo => allUTXOSpendable.find(u => isSameUTXO(u, utxo)))
      .filter(isNotNull)
  }
}

export const reselectSpendableUTXOsWithSafePadFactory = (
  availableUTXOs: UTXOBasic[],
  getUTXOSpendable: GetConfirmedSpendableUTXOFn,
): ReselectSpendableUTXOsFn => {
  const reselect = reselectSpendableUTXOsFactory(
    availableUTXOs,
    getUTXOSpendable,
  )

  return async (satsToSend, lastTimeSelectedUTXOs) => {
    const utxos = await reselect(satsToSend, lastTimeSelectedUTXOs)
    const selectedAmount = sumUTXO(utxos)

    const difference = satsToSend - selectedAmount
    if (difference > 0n) {
      return utxos.concat(getPlaceholderUTXO({ amount: MAX_BIGINT }))
    }

    return utxos
  }
}

export const getPlaceholderUTXO = (options: {
  amount: bigint
}): UTXOSpendable => {
  return {
    addressType: "p2pkh",
    txId: "0000000000000000000000000000000000000000000000000000000000000000",
    index: 0,
    amount: options.amount,
    /**
     * OutScript.encode({
     *   type: 'pkh',
     *   hash: hash160(secp256k1.getPublicKey(
     *     hex.decode('0000000000000000000000000000000000000000000000000000000000000001'),
     *     false,
     *   ))
     * })
     */
    scriptPubKey: decodeHex(
      "76a91491b24bf9f5288532960ac687abb035127b1d28a588ac",
    ),
    isPublicKeyCompressed: false,
  }
}

export function selectUTXOs(
  satsToSend: bigint,
  selectedUTXOs: UTXOBasic[],
  otherAvailableUTXOs: UTXOConfirmed[],
): UTXOBasic[] {
  const inputs: Array<UTXOBasic> = selectedUTXOs.slice()

  let sumValue = sum(selectedUTXOs.map(o => o.amount))

  // Sort UTXOs:
  // 1. By amount in descending order
  // 2. By block height in ascending order
  const otherAvailableUTXOsSorted = sortBy(
    [o => -o.amount, o => o.blockHeight],
    otherAvailableUTXOs,
  )

  for (const utxo of otherAvailableUTXOsSorted) {
    inputs.push(utxo)
    sumValue = sumValue + utxo.amount

    if (sumValue >= satsToSend) {
      break
    }
  }

  return inputs
}

export type ReselectSpendableUTXOsFn_Public = (
  satsToSend: bigint,
  lastTimeSelectedUTXOs: UTXOSpendable[],
) => Promise<UTXOSpendable[]>
export function reselectSpendableUTXOsFactory_public(
  reselectSpendableUTXOs_public: ReselectSpendableUTXOsFn_Public,
): ReselectSpendableUTXOsFn {
  return async (satsToSend, pinnedUTXOs, lastTimeSelectedUTXOs) => {
    satsToSend = satsToSend - sumUTXO(pinnedUTXOs)
    lastTimeSelectedUTXOs = lastTimeSelectedUTXOs.filter(
      excludeUTXOs(pinnedUTXOs),
    )
    const selected = await reselectSpendableUTXOs_public(
      satsToSend,
      lastTimeSelectedUTXOs,
    )
    return [...pinnedUTXOs, ...selected]
  }
}
