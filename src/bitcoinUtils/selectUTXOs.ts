import { hasAny, sortBy } from "../utils/arrayHelpers"
import { MAX_BIGINT, sum } from "../utils/bigintHelpers"
import {
  isSameUTXO,
  sumUTXO,
  UTXOBasic,
  UTXOConfirmed,
  UTXOSpendable,
} from "./bitcoinHelpers"
import { decodeHex } from "../utils/hexHelpers"
import { isNotNull } from "../utils/typeHelpers"
import { ReselectSpendableUTXOsFn } from "./prepareTransaction"

export type GetConfirmedSpendableUTXOFn = (
  utxo: UTXOBasic,
) => Promise<undefined | (UTXOSpendable & UTXOConfirmed)>

export const reselectSpendableUTXOsFactory = (
  availableUTXOs: UTXOBasic[],
  getUTXOSpendable: GetConfirmedSpendableUTXOFn,
): ReselectSpendableUTXOsFn => {
  return async (satsToSend, pinnedUTXOs, _lastTimeSelectedUTXOs) => {
    const lastTimeSelectedUTXOs = await Promise.all(
      _lastTimeSelectedUTXOs.map(getUTXOSpendable),
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

    return selectUTXOs(satsToSend, lastTimeSelectedUTXOs, otherAvailableUTXOs)
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

  return async (satsToSend, pinnedUTXOs, lastTimeSelectedUTXOs) => {
    const utxos = await reselect(satsToSend, pinnedUTXOs, lastTimeSelectedUTXOs)
    const selectedAmount = sumUTXO(utxos)

    const difference = satsToSend - selectedAmount
    if (difference > 0n) {
      return utxos.concat({
        addressType: "p2pkh",
        txId: "0000000000000000000000000000000000000000000000000000000000000000",
        index: 0,
        amount: MAX_BIGINT,
        /**
         * OutScript.bencode({
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
      })
    }

    return utxos
  }
}

export function selectUTXOs<T extends UTXOConfirmed>(
  satsToSend: bigint,
  selectedUTXOs: T[],
  otherAvailableUTXOs: T[],
): T[] {
  const inputs: Array<T> = []

  let sumValue = 0n

  otherAvailableUTXOs = otherAvailableUTXOs.slice()

  if (hasAny(selectedUTXOs)) {
    inputs.push(...selectedUTXOs)
    sumValue = sum([sumValue, ...selectedUTXOs.map(o => o.amount)])
  }

  // Sort UTXOs:
  // 1. By amount in descending order
  // 2. By block height in ascending order
  otherAvailableUTXOs = sortBy(
    [o => -o.amount, o => o.blockHeight],
    otherAvailableUTXOs,
  )

  for (const utxo of otherAvailableUTXOs) {
    inputs.push(utxo)
    sumValue = sumValue + utxo.amount

    if (sumValue >= satsToSend) {
      break
    }
  }

  return inputs
}
