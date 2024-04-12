import { checkNever } from "../utils/typeHelpers"
import { KnownChainId } from "../utils/types.internal"

export interface BitcoinAddress {
  address: string
}

export function getBTCPegInAddress(
  network: KnownChainId.BitcoinChain,
): undefined | BitcoinAddress {
  let addr: undefined | string
  switch (network) {
    case KnownChainId.Bitcoin.Mainnet:
      addr = "bc1pylrcm2ym9spaszyrwzhhzc2qf8c3xq65jgmd8udqtd5q73a2fulsztxqyy"
      break
    case KnownChainId.Bitcoin.Testnet:
      addr = "tb1qeprcndv9n8luumegjsnljjcf68e7ay62n5a667"
      break
    default:
      checkNever(network)
  }

  if (addr == null) return undefined

  return {
    address: addr,
  }
}
