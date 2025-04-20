import { KnownChainId } from "@brotocol-xyz/bro-sdk"

export const formatXLinkSDKChainName = (
  chain: KnownChainId.KnownChain,
): string => {
  if (KnownChainId.isBitcoinChain(chain)) {
    return "Bitcoin"
  }

  if (KnownChainId.isBRC20Chain(chain)) {
    return "BRC-20"
  }

  if (KnownChainId.isRunesChain(chain)) {
    return "Runes"
  }

  if (KnownChainId.isStacksChain(chain)) {
    return "Stacks"
  }

  if (KnownChainId.isEVMChain(chain)) {
    switch (chain) {
      case KnownChainId.EVM.Ethereum:
        return "Ethereum"
      case KnownChainId.EVM.Sepolia:
        return "Sepolia"
      case KnownChainId.EVM.BSC:
        return "BSC"
      case KnownChainId.EVM.BSCTestnet:
        return "BSC Testnet"
      case KnownChainId.EVM.CoreDAO:
        return "CoreDAO"
      case KnownChainId.EVM.CoreDAOTestnet:
        return "CoreDAO Testnet"
      case KnownChainId.EVM.Bsquared:
        return "B²"
      case KnownChainId.EVM.BOB:
        return "BOB"
      case KnownChainId.EVM.Bitlayer:
        return "Bitlayer"
      case KnownChainId.EVM.Lorenzo:
        return "Lorenzo"
      case KnownChainId.EVM.Merlin:
        return "Merlin"
      case KnownChainId.EVM.AILayer:
        return "AILayer"
      case KnownChainId.EVM.Mode:
        return "Mode"
      case KnownChainId.EVM.XLayer:
        return "XLayer"
      case KnownChainId.EVM.Arbitrum:
        return "Arbitrum"
      case KnownChainId.EVM.Aurora:
        return "Aurora"
      case KnownChainId.EVM.Manta:
        return "Manta"
      case KnownChainId.EVM.Linea:
        return "Linea"
      case KnownChainId.EVM.Base:
        return "Base"
      case KnownChainId.EVM.BlifeTestnet:
        return "Blife Testnet"
      case KnownChainId.EVM.BeraTestnet:
        return "Bera Testnet"
      default:
        return "Unknown EVM Chain"
    }
  }

  return chain
}
