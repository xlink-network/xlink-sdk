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
      // case KnownChainId.EVM.BsquaredTestnet:
      return 4n
    case KnownChainId.EVM.BOB:
      // case KnownChainId.EVM.BOBTestnet:
      return 5n
    case KnownChainId.EVM.Bitlayer:
      // case KnownChainId.EVM.BitlayerTestnet:
      return 6n
    case KnownChainId.EVM.Lorenzo:
      // case KnownChainId.EVM.LorenzoTestnet:
      return 7n
    case KnownChainId.EVM.Merlin:
      // case KnownChainId.EVM.MerlinTestnet:
      return 8n
    case KnownChainId.EVM.AILayer:
      // case KnownChainId.EVM.AILayerTestnet:
      return 9n
    case KnownChainId.EVM.Mode:
      // case KnownChainId.EVM.ModeTestnet:
      return 10n
    case KnownChainId.EVM.XLayer:
      // case KnownChainId.EVM.XLayerTestnet:
      return 11n
    case KnownChainId.EVM.Arbitrum:
      // case KnownChainId.EVM.ArbitrumTestnet:
      return 12n
    case KnownChainId.EVM.Aurora:
      // case KnownChainId.EVM.AuroraTestnet:
      return 13n
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
    return [KnownChainId.EVM.BOB]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.BOB)
  // assertExclude(resPossibilities, KnownChainId.EVM.BOBTestnet)

  if (chainId === 6n) {
    return [KnownChainId.EVM.Bitlayer]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.Bitlayer)
  // assertExclude(resPossibilities, KnownChainId.EVM.BitlayerTestnet)

  if (chainId === 7n) {
    return [KnownChainId.EVM.Lorenzo]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.Lorenzo)
  // assertExclude(resPossibilities, KnownChainId.EVM.LorenzoTestnet)

  if (chainId === 8n) {
    return [KnownChainId.EVM.Merlin]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.Merlin)
  // assertExclude(resPossibilities, KnownChainId.EVM.MerlinTestnet)

  if (chainId === 9n) {
    return [KnownChainId.EVM.AILayer]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.AILayer)
  // assertExclude(resPossibilities, KnownChainId.EVM.AILayerTestnet)

  if (chainId === 10n) {
    return [KnownChainId.EVM.Mode]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.Mode)
  // assertExclude(resPossibilities, KnownChainId.EVM.ModeTestnet)

  if (chainId === 11n) {
    return [KnownChainId.EVM.XLayer]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.XLayer)
  // assertExclude(resPossibilities, KnownChainId.EVM.XLayerTestnet)

  if (chainId === 12n) {
    return [KnownChainId.EVM.Arbitrum]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.Arbitrum)

  if (chainId === 13n) {
    return [KnownChainId.EVM.Aurora]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.Aurora)
  // assertExclude(resPossibilities, KnownChainId.EVM.AuroraTestnet)

  checkNever(resPossibilities)
  throw new UnsupportedContractAssignedChainIdError(chainId)
}
