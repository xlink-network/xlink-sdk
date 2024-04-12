import { UnsupportedChainError } from "../utils/errors"
import { checkNever } from "../utils/typeHelpers"
import { KnownChainId } from "../utils/types.internal"

export function contractAssignedChainIdFromBridgeChain(
  chain: KnownChainId.EthereumChain,
): bigint {
  switch (chain) {
    case KnownChainId.Ethereum.Mainnet:
    case KnownChainId.Ethereum.Sepolia:
      return 1n
    case KnownChainId.Ethereum.BSC:
    case KnownChainId.Ethereum.BSCTest:
      return 2n
    default:
      checkNever(chain)
      throw new UnsupportedChainError(chain)
  }
}
