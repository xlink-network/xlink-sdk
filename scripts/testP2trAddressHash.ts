import * as btc from "@scure/btc-signer"
import { hex } from "@scure/base"
import * as P from "micro-packed"
import { createRevealablePayment } from "./testP2trAddressHash.helpers"
import { getSimpleTaprootScriptAddress } from "./testP2trAddressHash.helpers2"

const equalBytes = P.utils.equalBytes

console.log(
  checkP2trAddressHash(
    // from https://mempool.space/testnet/tx/73ee8abd5e3d73b59c0b38fa7367370c6424391a0de7f349f71ac52ebfda57d0#vin=0
    "70faf88fa6105c7bbd6f0cabe2e03a778ada80f8291699a8803574cc935946e7",
    "0c0000000401630d0000000133016602000000160014eef61374297e242272dff5395b44ed785fb6233101720200000014310b11438259c6b85940094a397cb62a021539f90174061aafdcccc4f5fa365ecc28c133a7bcba51d7aa89e00a746f6b656e2d61627463",
    "5120e8ad79fd6512eaaea721945c345527b43d6de0507dbb2f41e1a8458627b7008c",
  ),
)

function checkP2trAddressHash(
  pubkeyHex: string,
  orderDataHex: string,
  _p2trAddressScriptPubKeyHex: string,
): string {
  const calced1 = calculateP2trAddressHash1(pubkeyHex, orderDataHex)
  const calced2 = calculateP2trAddressHash2(pubkeyHex, orderDataHex)
  const decoded = hex.decode(_p2trAddressScriptPubKeyHex).slice(2)

  if (!equalBytes(decoded, calced2)) {
    return "the <expected> is not same as <calced2>"
  }

  return "same"
}

function calculateP2trAddressHash2(
  pubkeyHex: string,
  orderDataHex: string,
): Uint8Array {
  const orderData = hex.decode(orderDataHex)
  const pubkey = hex.decode(pubkeyHex)
  return getSimpleTaprootScriptAddress(
    btc.TAPROOT_UNSPENDABLE_KEY,
    btc.Script.encode([orderData, "DROP", pubkey, "CHECKSIG"]),
  )
}

function calculateP2trAddressHash1(
  pubkeyHex: string,
  orderDataHex: string,
): Uint8Array {
  const orderData = hex.decode(orderDataHex)
  const p2trPayment = createRevealablePayment(
    btc.TEST_NETWORK,
    pubkeyHex,
    orderData,
  )

  return p2trPayment.script.slice(2)
}
