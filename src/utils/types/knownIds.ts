import { ChainId, TokenId } from "../../xlinkSdkUtils/types"
import { checkNever } from "../typeHelpers"

const chainId = <const T extends string>(value: T): ChainId<T> => value as any
const tokenId = <const T extends string>(value: T): TokenId<T> => value as any

/**
 * The `KnownTokenId` namespace provides types of tokens supported by the SDK,
 * including Bitcoin, EVM-compatible tokens, and Stacks tokens.
 */
export namespace KnownTokenId {
  /** Represents a known token supported by the SDK. */
  export type KnownToken =
    | BitcoinToken
    | BRC20Token
    | RunesToken
    | EVMToken
    | StacksToken
  export function isKnownToken(value: TokenId): value is KnownToken {
    return (
      isBitcoinToken(value) ||
      isBRC20Token(value) ||
      isRunesToken(value) ||
      isEVMToken(value) ||
      isStacksToken(value)
    )
  }

  /** A namespace that contains constants and types for Bitcoin tokens. */
  export namespace Bitcoin {
    /** Represents the Bitcoin token ID (BTC). */
    export const BTC = tokenId("btc-btc")
  }
  /** This type includes all known Bitcoin tokens. */
  export type BitcoinToken = (typeof _allKnownBitcoinTokens)[number]
  export function isBitcoinToken(value: TokenId): value is BitcoinToken {
    return _allKnownBitcoinTokens.includes(value as any)
  }

  export type BRC20Token = TokenId<"a brc20 token">
  export function isBRC20Token(value: TokenId): value is BRC20Token {
    return value.startsWith("brc20-")
  }

  export type RunesToken = TokenId<"a runes token">
  export function isRunesToken(value: TokenId): value is RunesToken {
    return value.startsWith("runes-")
  }

  /** A namespace that contains constants and types for EVM-compatible tokens. */
  export namespace EVM {
    // USD[X]s
    /** Represents the sUSDT token ID on EVM-compatible blockchains. */
    export const sUSDT = tokenId("evm-susdt")
    /** Represents the USDT token ID on EVM-compatible blockchains. */
    export const USDT = tokenId("evm-usdt")
    /** Represents the USDC token ID on EVM-compatible blockchains. */
    export const USDC = tokenId("evm-usdc")

    // BTC
    /** Represents the aBTC token ID on EVM-compatible blockchains. */
    export const aBTC = tokenId("evm-abtc")
    /** Represents the WBTC token ID on EVM-compatible blockchains. */
    export const WBTC = tokenId("evm-wbtc")
    /** Represents the BTCB token ID on EVM-compatible blockchains. */
    export const BTCB = tokenId("evm-btcb")
    /** Represents the cbBTC token ID on EVM-compatible blockchains. */
    export const cbBTC = tokenId("evm-cbbtc")

    /** Represents the LUNR token ID on EVM-compatible blockchains. */
    export const LUNR = tokenId("evm-lunr")
    /** Represents the ALEX token ID on EVM-compatible blockchains. */
    export const ALEX = tokenId("evm-alex")
    /** Represents the SKO token ID on EVM-compatible blockchains. */
    export const SKO = tokenId("evm-sko")
    /** Represents the vLiSTX token ID on EVM-compatible blockchains. */
    export const vLiSTX = tokenId("evm-vlistx")
    /** Represents the vLiALEX token ID on EVM-compatible blockchains. */
    export const vLiALEX = tokenId("evm-vlialex")
    export const uBTC = tokenId("evm-ubtc")
    export const wuBTC = tokenId("evm-wubtc")
    export const DB20 = tokenId("evm-db20")
    export const DOG = tokenId("evm-dog")
  }
  /** This type includes all known tokens on EVM-compatible blockchains. */
  export type EVMToken = (typeof _allKnownEVMTokens)[number]
  export function isEVMToken(value: TokenId): value is EVMToken {
    return _allKnownEVMTokens.includes(value as any)
  }
  /** A namespace that contains constants and types for Stacks tokens. */
  export namespace Stacks {
    /** Represents the sUSDT token ID on the Stacks blockchain. */
    export const sUSDT = tokenId("stx-susdt")
    /** Represents the sLUNR token ID on the Stacks blockchain. */
    export const sLUNR = tokenId("stx-slunr")

    /** Represents the aBTC token ID on the Stacks blockchain. */
    export const aBTC = tokenId("stx-abtc")
    /** Represents the ALEX token ID on the Stacks blockchain. */
    export const ALEX = tokenId("stx-alex")
    /** Represents the sSKO token ID on the Stacks blockchain. */
    export const sSKO = tokenId("stx-ssko")
    /** Represents the vLiSTX token ID on the Stacks blockchain. */
    export const vLiSTX = tokenId("stx-vlistx")
    /** Represents the vLiALEX token ID on the Stacks blockchain. */
    export const vLiALEX = tokenId("stx-vlialex")
    export const vLiaBTC = tokenId("stx-vliabtc")
    export const uBTC = tokenId("stx-ubtc")
    export const DB20 = tokenId("stx-db20")
    export const DOG = tokenId("stx-dog")
  }
  export type StacksToken = TokenId<`stx-${string}`>
  export function isStacksToken(value: TokenId): value is StacksToken {
    return value.startsWith("stx-")
  }
}
export const createStacksToken = (
  stacksTokenId: string,
): KnownTokenId.StacksToken => {
  return `stx-${stacksTokenId}` as any
}
export const createBRC20Token = (
  brc20tick: string,
): KnownTokenId.BRC20Token => {
  return `brc20-${brc20tick}` as any
}
export const createRunesToken = (
  runeId: `${number}:${number}`,
): KnownTokenId.RunesToken => {
  return `runes-${runeId}` as any
}
export const _allKnownBitcoinTokens = Object.values(KnownTokenId.Bitcoin)
export const _allKnownEVMTokens = Object.values(KnownTokenId.EVM)

/**
 * The `KnownChainId` namespace provides types of blockchain networks
 * supported by the SDK, including Bitcoin, EVM-compatible chains, and Stacks.
 */
export namespace KnownChainId {
  /** Represents a known blockchain network supported by the SDK. */
  export type KnownChain =
    | BitcoinChain
    | BRC20Chain
    | RunesChain
    | EVMChain
    | StacksChain
  export function isKnownChain(value: ChainId): value is KnownChain {
    return (
      isBitcoinChain(value) ||
      isBRC20Chain(value) ||
      isRunesChain(value) ||
      isEVMChain(value) ||
      isStacksChain(value)
    )
  }

  /** A namespace that contains constants and types for Bitcoin networks. */
  export namespace Bitcoin {
    /** Represents the Bitcoin mainnet chain ID. */
    export const Mainnet = chainId("bitcoin-mainnet")
    /** Represents the Bitcoin testnet chain ID. */
    export const Testnet = chainId("bitcoin-testnet")
  }
  /** Represents a Bitcoin blockchain network. */
  export type BitcoinChain = (typeof _allKnownBitcoinChains)[number]
  export function isBitcoinChain(value: ChainId): value is BitcoinChain {
    return _allKnownBitcoinChains.includes(value as any)
  }

  export namespace Runes {
    /** Represents the Runes mainnet chain ID. */
    export const Mainnet = chainId("runes-mainnet")
    /** Represents the Runes testnet chain ID. */
    export const Testnet = chainId("runes-testnet")
  }
  /** Represents a Runes blockchain network. */
  export type RunesChain = (typeof _allKnownRunesChains)[number]
  export function isRunesChain(value: ChainId): value is RunesChain {
    return _allKnownRunesChains.includes(value as any)
  }

  export namespace BRC20 {
    /** Represents the BRC20 mainnet chain ID. */
    export const Mainnet = chainId("brc20-mainnet")
    /** Represents the BRC20 testnet chain ID. */
    export const Testnet = chainId("brc20-testnet")
  }
  /** Represents a BRC20 blockchain network. */
  export type BRC20Chain = (typeof _allKnownBRC20Chains)[number]
  export function isBRC20Chain(value: ChainId): value is BRC20Chain {
    return _allKnownBRC20Chains.includes(value as any)
  }

  /** A namespace that contains constants and types for EVM-compatible networks. */
  export namespace EVM {
    // Mainnet
    /** Represents the Ethereum mainnet chain ID. */
    export const Ethereum = chainId("evm-ethereum")
    /** Represents the Ethereum testnet chain ID. */
    export const Sepolia = chainId("evm-sepolia")

    // BNB Smart Chain
    /** Represents the BNB Smart Chain mainnet chain ID. */
    export const BSC = chainId("evm-bsc")
    /** Represents the BNB Smart Chain testnet chain ID. */
    export const BSCTestnet = chainId("evm-bsctestnet")

    // CoreDAO
    /** Represents the CoreDAO mainnet chain ID. */
    export const CoreDAO = chainId("evm-coredao")
    /** Represents the CoreDAO testnet chain ID. */
    export const CoreDAOTestnet = chainId("evm-coredao-testnet")

    // B2 Bsquared
    /** Represents the Bsquared mainnet chain ID. */
    export const Bsquared = chainId("evm-bsquared")
    /** Represents the Bsquared testnet chain ID. */
    // export const BsquaredTestnet = chainId("evm-bsquared-testnet")

    // BOB
    /** Represents the BOB mainnet chain ID. */
    export const BOB = chainId("evm-bob")
    /** Represents the BOB testnet chain ID. */
    // export const BOBTestnet = chainId("evm-bob-testnet")

    // Bitlayer
    /** Represents the Bitlayer mainnet chain ID. */
    export const Bitlayer = chainId("evm-bitlayer")
    /** Represents the Bitlayer testnet chain ID. */
    // export const BitlayerTestnet = chainId("evm-bitlayer-testnet")

    // Lorenzo
    /** Represents the Lorenzo mainnet chain ID. */
    export const Lorenzo = chainId("evm-lorenzo")
    /** Represents the Lorenzo testnet chain ID. */
    // export const LorenzoTestnet = chainId("evm-lorenzo-testnet")

    // Merlin
    /** Represents the Merlin mainnet chain ID. */
    export const Merlin = chainId("evm-merlin")
    /** Represents the Merlin testnet chain ID. */
    // export const MerlinTestnet = chainId("evm-merlin-testnet")

    // AILayer
    /** Represents the AILayer mainnet chain ID. */
    export const AILayer = chainId("evm-ailayer")
    /** Represents the AILayer testnet chain ID. */
    // export const AILayerTestnet = chainId("evm-ailayer-testnet")

    // Mode
    /** Represents the Mode mainnet chain ID. */
    export const Mode = chainId("evm-mode")
    /** Represents the Mode testnet chain ID. */
    // export const ModeTestnet = chainId("evm-mode-testnet")

    // X Layer
    /** Represents the XLayer mainnet chain ID. */
    export const XLayer = chainId("evm-xlayer")
    /** Represents the XLayer testnet chain ID. */
    // export const XLayerTestnet = chainId("evm-xlayer-testnet")

    // Arbitrum
    /** Represents the Arbitrum mainnet chain ID. */
    export const Arbitrum = chainId("evm-arbitrum")
    // export const ArbitrumTestnet = chainId("evm-arbitrum-testnet")

    // Aurora
    /** Represents the Aurora mainnet chain ID. */
    export const Aurora = chainId("evm-aurora")
    // export const AuroraTestnet = chainId("evm-aurora-testnet")

    // Blife
    /** Represents the Blife mainnet chain ID. */
    // export const Blife = chainId("evm-blife")
    export const BlifeTestnet = chainId("evm-blife-testnet")

    // Bitboy
    /** Represents the Bitboy mainnet chain ID. */
    // export const Bitboy = chainId("evm-bitboy")
    export const BitboyTestnet = chainId("evm-bitboy-testnet")

    // Manta
    /** Represents the Manta mainnet chain ID. */
    export const Manta = chainId("evm-manta")
    /** Represents the Manta testnet chain ID. */
    // export const MantaTestnet = chainId("evm-manta-testnet")

    // Linea
    /** Represents the Linea mainnet chain ID. */
    export const Linea = chainId("evm-linea")
    /** Represents the Linea testnet chain ID. */
    // export const LineaTestnet = chainId("evm-linea-testnet")

    // Base
    /** Represents the Base mainnet chain ID. */
    export const Base = chainId("evm-base")
    /** Represents the Base testnet chain ID. */
    // export const BaseTestnet = chainId("evm-base-testnet")

    // Bera
    /** Represents the Bera mainnet chain ID. */
    // export const Bera = chainId("evm-bera")
    /** Represents the Bera testnet chain ID. */
    export const BeraTestnet = chainId("evm-bera-testnet")
  }
  /** Represents a mainnet EVM-compatible blockchain network. */
  export type EVMMainnetChain = (typeof _allKnownEVMMainnetChains)[number]
  export function isEVMMainnetChain(value: ChainId): value is EVMMainnetChain {
    return _allKnownEVMMainnetChains.includes(value as any)
  }
  /** Represents a testnet EVM-compatible blockchain network. */
  export type EVMTestnetChain = (typeof _allKnownEVMTestnetChains)[number]
  export function isEVMTestnetChain(value: ChainId): value is EVMTestnetChain {
    return _allKnownEVMTestnetChains.includes(value as any)
  }
  /** Represents an EVM-compatible blockchain network. */
  export type EVMChain = (typeof _allKnownEVMChains)[number]
  export function isEVMChain(value: ChainId): value is EVMChain {
    return _allKnownEVMChains.includes(value as any)
  }

  /** A namespace that contains constants and types for Stacks blockchain networks. */
  export namespace Stacks {
    /** Represents the Stacks mainnet chain ID. */
    export const Mainnet = chainId("stacks-mainnet")
    /** Represents the Stacks testnet chain ID. */
    export const Testnet = chainId("stacks-testnet")
  }
  /** Represents a Stacks blockchain network. */
  export type StacksChain = (typeof _allKnownStacksChains)[number]
  export function isStacksChain(value: ChainId): value is StacksChain {
    return _allKnownStacksChains.includes(value as any)
  }
}
export const _allKnownBitcoinChains = Object.values(KnownChainId.Bitcoin)
export const _allKnownRunesChains = Object.values(KnownChainId.Runes)
export const _allKnownBRC20Chains = Object.values(KnownChainId.BRC20)
export const _allKnownEVMChains = Object.values(KnownChainId.EVM)
export const _allKnownStacksChains = Object.values(KnownChainId.Stacks)

export const _allKnownEVMMainnetChains = [
  KnownChainId.EVM.Ethereum,
  KnownChainId.EVM.BSC,
  KnownChainId.EVM.CoreDAO,
  KnownChainId.EVM.Bsquared,
  KnownChainId.EVM.BOB,
  KnownChainId.EVM.Bitlayer,
  KnownChainId.EVM.Lorenzo,
  KnownChainId.EVM.Merlin,
  KnownChainId.EVM.AILayer,
  KnownChainId.EVM.Mode,
  KnownChainId.EVM.XLayer,
  KnownChainId.EVM.Arbitrum,
  KnownChainId.EVM.Aurora,
  KnownChainId.EVM.Manta,
  KnownChainId.EVM.Linea,
  KnownChainId.EVM.Base,
] as const
export const _allKnownEVMTestnetChains = [
  KnownChainId.EVM.Sepolia,
  KnownChainId.EVM.BSCTestnet,
  KnownChainId.EVM.CoreDAOTestnet,
  KnownChainId.EVM.BlifeTestnet,
  KnownChainId.EVM.BitboyTestnet,
  KnownChainId.EVM.BeraTestnet,
] as const
export const _allNoLongerSupportedEVMChains: ChainId[] = [
  KnownChainId.EVM.Lorenzo,
]

const _restEVMChain = null as Exclude<
  (typeof _allKnownEVMChains)[number],
  | (typeof _allKnownEVMMainnetChains)[number]
  | (typeof _allKnownEVMTestnetChains)[number]
>
checkNever(_restEVMChain)

export const _knownChainIdToErrorMessagePart = (chainId: ChainId): string => {
  const unknownCase = `Unknown chain (${chainId})`

  if (!KnownChainId.isKnownChain(chainId)) {
    return unknownCase
  }

  if (KnownChainId.isBitcoinChain(chainId)) {
    return "Bitcoin"
  } else if (KnownChainId.isBRC20Chain(chainId)) {
    return "BRC-20"
  } else if (KnownChainId.isRunesChain(chainId)) {
    return "Runes"
  } else if (KnownChainId.isStacksChain(chainId)) {
    return "Stacks"
  } else if (KnownChainId.isEVMChain(chainId)) {
    return "EVM"
  }

  checkNever(chainId)
  return unknownCase
}
