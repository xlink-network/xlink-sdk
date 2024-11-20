import { NETWORK, TEST_NETWORK } from "@scure/btc-signer"
import { addressToScriptPubKey } from "../bitcoinUtils/bitcoinHelpers"
import { BitcoinAddress } from "../bitcoinUtils/btcAddresses"
import { checkNever } from "../utils/typeHelpers"
import { KnownChainId } from "../utils/types/knownIds"

export function getMetaPegInAddress(
  fromChain: KnownChainId.RunesChain | KnownChainId.BRC20Chain,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toChain: KnownChainId.KnownChain,
): undefined | BitcoinAddress {
  let addr: undefined | string
  switch (fromChain) {
    case KnownChainId.Runes.Mainnet:
    case KnownChainId.BRC20.Mainnet:
      // https://t.me/c/1599543687/50898
      // addr = "bc1pngxflzuqe5vevtc8fgmxzl69pw74x36dc9pmv5rye6nhwty0c0hsh5tyr3"
      // https://t.me/c/1599543687/57026
      // addr = "bc1py8wmtw38gnurk3utvzc3mshzq6hk4ype5unda2644chyhmktncuqdfj55x"
      // https://t.me/c/1599543687/60511
      addr = "bc1p7aerd2nfgx7uzj2yld3mwsyyv3lcnpnxflcp629q7zwpp7kg20psmjsn5e"
      break
    case KnownChainId.Runes.Testnet:
    case KnownChainId.BRC20.Testnet:
      addr = "tb1qeprcndv9n8luumegjsnljjcf68e7ay62n5a667"
      break
    default:
      checkNever(fromChain)
  }

  if (addr == null) return undefined

  const script = addressToScriptPubKey(
    fromChain === KnownChainId.Runes.Mainnet ||
      fromChain === KnownChainId.BRC20.Mainnet
      ? NETWORK
      : TEST_NETWORK,
    addr,
  )

  return {
    address: addr,
    scriptPubKey: script,
  }
}
