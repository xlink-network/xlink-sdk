import {
  UnsupportedChainError,
  UnsupportedContractAssignedChainIdError,
} from "../utils/errors"
import { assertExclude, checkNever } from "../utils/typeHelpers"
import { KnownChainId } from "../utils/types.internal"

export type KnownChainIdWithAssignedId =
  | KnownChainId.EVMChain
  | KnownChainId.BitcoinChain

export function contractAssignedChainIdFromBridgeChain(
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
    case KnownChainId.EVM.BSCTest:
      return 2n
    case KnownChainId.EVM.CoreDAO:
    case KnownChainId.EVM.CoreDAOTest:
      return 3n
    case KnownChainId.EVM.Bsquared:
    case KnownChainId.EVM.BsquaredTest:
      return 4n
    case KnownChainId.EVM.BOB:
    case KnownChainId.EVM.BOBTest:
      return 5n
    case KnownChainId.EVM.Bitlayer:
    case KnownChainId.EVM.BitlayerTest:
      return 6n
    case KnownChainId.EVM.Lorenzo:
    case KnownChainId.EVM.LorenzoTest:
      return 7n
    case KnownChainId.EVM.Merlin:
    case KnownChainId.EVM.MerlinTest:
      return 8n
    case KnownChainId.EVM.AILayer:
    case KnownChainId.EVM.AILayerTest:
      return 9n
    default:
      checkNever(chain)
      throw new UnsupportedChainError(chain)
  }
}

export function contractAssignedChainIdToBridgeChain(
  chainId: bigint,
): [mainnet: KnownChainIdWithAssignedId, testnet: KnownChainIdWithAssignedId] {
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
    return [KnownChainId.EVM.BSC, KnownChainId.EVM.BSCTest]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.BSC)
  assertExclude(resPossibilities, KnownChainId.EVM.BSCTest)

  if (chainId === 3n) {
    return [KnownChainId.EVM.CoreDAO, KnownChainId.EVM.CoreDAOTest]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.CoreDAO)
  assertExclude(resPossibilities, KnownChainId.EVM.CoreDAOTest)

  if (chainId === 4n) {
    return [KnownChainId.EVM.Bsquared, KnownChainId.EVM.BsquaredTest]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.Bsquared)
  assertExclude(resPossibilities, KnownChainId.EVM.BsquaredTest)

  if (chainId === 5n) {
    return [KnownChainId.EVM.BOB, KnownChainId.EVM.BOBTest]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.BOB)
  assertExclude(resPossibilities, KnownChainId.EVM.BOBTest)

  if (chainId === 6n) {
    return [KnownChainId.EVM.Bitlayer, KnownChainId.EVM.BitlayerTest]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.Bitlayer)
  assertExclude(resPossibilities, KnownChainId.EVM.BitlayerTest)

  if (chainId === 7n) {
    return [KnownChainId.EVM.Lorenzo, KnownChainId.EVM.LorenzoTest]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.Lorenzo)
  assertExclude(resPossibilities, KnownChainId.EVM.LorenzoTest)

  if (chainId === 8n) {
    return [KnownChainId.EVM.Merlin, KnownChainId.EVM.MerlinTest]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.Merlin)
  assertExclude(resPossibilities, KnownChainId.EVM.MerlinTest)

  if (chainId === 9n) {
    return [KnownChainId.EVM.AILayer, KnownChainId.EVM.AILayerTest]
  }
  assertExclude(resPossibilities, KnownChainId.EVM.AILayer)
  assertExclude(resPossibilities, KnownChainId.EVM.AILayerTest)

  checkNever(resPossibilities)
  throw new UnsupportedContractAssignedChainIdError(chainId)
}
