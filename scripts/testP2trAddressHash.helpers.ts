import * as btc from "@scure/btc-signer"
import { hex } from "@scure/base"
import { P2TROut, TaprootScriptTree } from "@scure/btc-signer/lib/payment"
import * as P from "micro-packed"

const equalBytes = P.utils.equalBytes

export type OutXlinkBridgeRevealType = {
  type: "tr_xlink_bridge_reveal"
  pubkey: Uint8Array
  orderData: Uint8Array
}

export function p2tr_xlink_bridge_reveal(
  pubkey: Uint8Array,
  orderData: Uint8Array,
): TaprootScriptTree {
  return {
    type: "tr_xlink_bridge_reveal",
    script: P.apply(btc.Script, P.coders.match([OutXlinkBridgeReveal])).encode({
      type: "tr_xlink_bridge_reveal",
      pubkey,
      orderData,
    }),
  }
}

export function createRevealablePayment(
  bitcoinNetwork: typeof btc.TEST_NETWORK,
  revealerSchnorrPubKey: string,
  orderData: Uint8Array,
): P2TROut {
  return btc.p2tr(
    undefined, // internalPubKey
    p2tr_xlink_bridge_reveal(hex.decode(revealerSchnorrPubKey), orderData), // TaprootScriptTree
    bitcoinNetwork, // mainnet or testnet
    false, // allowUnknownOutputs, safety feature
    [OutXlinkBridgeReveal], // how to handle custom scripts
  )
}

export const OutXlinkBridgeReveal: P.Coder<
  btc.OptScript,
  OutXlinkBridgeRevealType | undefined
> &
  btc.CustomScript = {
  encode(from: btc.ScriptType): OutXlinkBridgeRevealType | undefined {
    const res: Partial<OutXlinkBridgeRevealType> = {
      type: "tr_xlink_bridge_reveal",
    }
    try {
      res.orderData = from[0] as Uint8Array
      // OP_DROP = from[1]
      res.pubkey = from[2] as Uint8Array
    } catch (e) {
      return
    }
    return res as OutXlinkBridgeRevealType
  },
  decode: (to: OutXlinkBridgeRevealType): btc.OptScript => {
    if (to.type !== "tr_xlink_bridge_reveal") return
    const out: btc.ScriptType = [to.orderData, "DROP", to.pubkey, "CHECKSIG"]
    return out as any
  },
  finalizeTaproot: (script: any, parsed: any, signatures: any) => {
    if (signatures.length !== 1) {
      throw new Error("tr_xlink_bridge_reveal/finalize: wrong signatures array")
    }
    const [{ pubKey }, sig] = signatures[0]
    if (!equalBytes(pubKey, parsed.pubkey)) return
    return [sig, script]
  },
}
