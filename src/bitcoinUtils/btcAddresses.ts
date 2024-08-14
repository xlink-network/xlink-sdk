import { NETWORK, TEST_NETWORK } from "@scure/btc-signer"
import { checkNever } from "../utils/typeHelpers"
import { KnownChainId } from "../utils/types/knownIds"
import { addressToScriptPubKey } from "./bitcoinHelpers"

export interface BitcoinAddress {
  address: string
  scriptPubKey: Uint8Array
}

export function getBTCPegInAddress(
  fromChain: KnownChainId.BitcoinChain,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toChain: KnownChainId.KnownChain,
): undefined | BitcoinAddress {
  let addr: undefined | string
  switch (fromChain) {
    case KnownChainId.Bitcoin.Mainnet:
      // /**
      //  * https://t.me/c/1599543687/51386
      //  */
      // addr = "bc1qlhkfxlzzzcc25z95v7c0v7svlp5exegxn0tf58"
      /**
       * https://t.me/c/1599543687/54621
       */
      addr = "bc1q9hs56nskqsxmgend4w0823lmef33sux6p8rzlp"
      break
    case KnownChainId.Bitcoin.Testnet:
      addr = "tb1qeprcndv9n8luumegjsnljjcf68e7ay62n5a667"
      break
    default:
      checkNever(fromChain)
  }

  if (addr == null) return undefined

  const script = addressToScriptPubKey(
    fromChain === KnownChainId.Bitcoin.Mainnet ? NETWORK : TEST_NETWORK,
    addr,
  )

  return {
    address: addr,
    scriptPubKey: script,
  }
}
