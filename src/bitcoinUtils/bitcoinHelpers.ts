import type { EstimationInput } from "@c4/btc-utils"
import { sum } from "../utils/bigintHelpers"
import { Address, OutScript } from "@scure/btc-signer"
import { BigNumber } from "../utils/BigNumber"

export interface UTXOBasic {
  txId: string
  index: number
  amount: bigint
}

export interface UTXOConfirmed extends UTXOBasic {
  blockHeight: bigint
}

export type UTXOSpendable = EstimationInput &
  UTXOBasic & {
    scriptPubKey: Uint8Array
  }

export interface BitcoinNetwork {
  bech32: string
  pubKeyHash: number
  scriptHash: number
  wif: number
}

export function sumUTXO(utxos: Array<UTXOBasic>): bigint {
  return sum(utxos.map(utxo => utxo.amount))
}

export function isSameUTXO(utxo1: UTXOBasic, utxo2: UTXOBasic): boolean {
  return utxo1.txId === utxo2.txId && utxo1.index === utxo2.index
}

export function addressToScriptPubKey(
  network: BitcoinNetwork,
  address: string,
): Uint8Array {
  const addr = Address(network).decode(address)
  return OutScript.encode(addr)
}

export function bitcoinToSatoshi(bitcoinAmount: string): bigint {
  return BigNumber.toBigInt({}, BigNumber.rightMoveDecimals(8, bitcoinAmount))
}

export function satoshiToBitcoin(satoshiAmount: bigint): string {
  return BigNumber.toString(BigNumber.leftMoveDecimals(8, satoshiAmount))
}
