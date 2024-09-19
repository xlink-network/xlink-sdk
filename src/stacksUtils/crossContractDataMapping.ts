import {
  UnsupportedChainError,
  UnsupportedContractAssignedChainIdError,
} from "../utils/errors"
import { assertExclude, checkNever } from "../utils/typeHelpers"
import { KnownChainId } from "../utils/types/knownIds"

export type KnownChainIdWithAssignedId =
  | KnownChainId.EVMChain
  | KnownChainId.BitcoinChain

export function contractAssignedChainIdFromKnownChain(
  chain: KnownChainIdWithAssignedId,
): bigint {
  switch (chain) {
    case KnownChainId.Bitcoin.Mainnet:
    case KnownChainId.Bitcoin.Testnet:
      return 0n
    case KnownChainId.EVM.Ethereum:
    case KnownChainId.EVM.Sepolia:
      return 1n
    case KnownChainId.EVM.BSC:
    case KnownChainId.EVM.BSCTestnet:
      return 2n
    case KnownChainId.EVM.CoreDAO:
    case KnownChainId.EVM.CoreDAOTestnet:
      return 3n
    case KnownChainId.EVM.Bsquared:
      return 4n
    case KnownChainId.EVM.BOB:
    case KnownChainId.EVM.BisonTestnet:
      return 5n
    case KnownChainId.EVM.Bitlayer:
    case KnownChainId.EVM.BitboyTestnet:
      return 6n
    case KnownChainId.EVM.Lorenzo:
    case KnownChainId.EVM.BeraTestnet:
      return 7n
    case KnownChainId.EVM.Merlin:
      return 8n
    case KnownChainId.EVM.AILayer:
      return 9n
    case KnownChainId.EVM.Mode:
      return 10n
    case KnownChainId.EVM.XLayer:
      return 11n
    case KnownChainId.EVM.Arbitrum:
      return 12n
    case KnownChainId.EVM.Aurora:
      return 13n
    case KnownChainId.EVM.Manta:
      return 14n
    default:
      checkNever(chain)
      throw new UnsupportedChainError(chain)
  }
}

export function contractAssignedChainIdToKnownChain(
  chainId: bigint,
): [mainnet: KnownChainIdWithAssignedId, testnet?: KnownChainIdWithAssignedId] {
  const resPossibilities = assertExclude.i<KnownChainIdWithAssignedId>()

  if (chainId === 0n) {
    return [KnownChainId.Bitcoin.Mainnet, KnownChainId.Bitcoin.Testnet]
  }
  assertExclude(resPossibilities, KnownChainId.Bitcoin.Mainnet)
  assertExclude(resPossibilities, KnownChainId.Bitcoin.Testnet)

  if (chainId === 1n) {
    return [KnownChainId.EVM.Ethereum, KnownChainId.EVM.Sepolia]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.Ethereum)
  assertExclude(resPossibilities, KnownChainId.EVM.Sepolia)

  if (chainId === 2n) {
    return [KnownChainId.EVM.BSC, KnownChainId.EVM.BSCTestnet]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.BSC)
  assertExclude(resPossibilities, KnownChainId.EVM.BSCTestnet)

  if (chainId === 3n) {
    return [KnownChainId.EVM.CoreDAO, KnownChainId.EVM.CoreDAOTestnet]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.CoreDAO)
  assertExclude(resPossibilities, KnownChainId.EVM.CoreDAOTestnet)

  if (chainId === 4n) {
    return [KnownChainId.EVM.Bsquared]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.Bsquared)
  // assertExclude(resPossibilities, KnownChainId.EVM.BsquaredTestnet)

  if (chainId === 5n) {
    return [KnownChainId.EVM.BOB, KnownChainId.EVM.BisonTestnet]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.BOB)
  assertExclude(resPossibilities, KnownChainId.EVM.BisonTestnet)

  if (chainId === 6n) {
    return [KnownChainId.EVM.Bitlayer, KnownChainId.EVM.BitboyTestnet]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.Bitlayer)
  assertExclude(resPossibilities, KnownChainId.EVM.BitboyTestnet)

  if (chainId === 7n) {
    return [KnownChainId.EVM.Lorenzo, KnownChainId.EVM.BeraTestnet]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.Lorenzo)
  assertExclude(resPossibilities, KnownChainId.EVM.BeraTestnet)

  if (chainId === 8n) {
    return [KnownChainId.EVM.Merlin]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.Merlin)

  if (chainId === 9n) {
    return [KnownChainId.EVM.AILayer]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.AILayer)

  if (chainId === 10n) {
    return [KnownChainId.EVM.Mode]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.Mode)

  if (chainId === 11n) {
    return [KnownChainId.EVM.XLayer]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.XLayer)

  if (chainId === 12n) {
    return [KnownChainId.EVM.Arbitrum]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.Arbitrum)

  if (chainId === 13n) {
    return [KnownChainId.EVM.Aurora]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.Aurora)

  if (chainId === 14n) {
    return [KnownChainId.EVM.Manta]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.Manta)

  checkNever(resPossibilities)
  throw new UnsupportedContractAssignedChainIdError(chainId)
}
