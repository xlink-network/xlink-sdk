import { checkNever } from "../utils/typeHelpers"
import { KnownChainId } from "../utils/types/knownIds"

export interface BitcoinAddress {
  address: string
}

export function getBTCPegInAddress(
  fromChain: KnownChainId.BitcoinChain,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toChain: KnownChainId.KnownChain,
): undefined | BitcoinAddress {
  let addr: undefined | string
  switch (fromChain) {
    case KnownChainId.Bitcoin.Mainnet:
      addr = "bc1pylrcm2ym9spaszyrwzhhzc2qf8c3xq65jgmd8udqtd5q73a2fulsztxqyy"
      break
    case KnownChainId.Bitcoin.Testnet:
      addr = "tb1qeprcndv9n8luumegjsnljjcf68e7ay62n5a667"
      break
    default:
      checkNever(fromChain)
  }

  if (addr == null) return undefined

  return {
    address: addr,
  }
}
