import { ChainId, TokenId } from "../../xlinkSdkUtils/types"
import { checkNever } from "../typeHelpers"

const chainId = <const T extends string>(value: T): ChainId<T> => value as any
const tokenId = <const T extends string>(value: T): TokenId<T> => value as any

export namespace KnownTokenId {
  export type KnownToken = BitcoinToken | EVMToken | StacksToken
  export function isKnownToken(value: TokenId): value is KnownToken {
    return isBitcoinToken(value) || isEVMToken(value) || isStacksToken(value)
  }

  export namespace Bitcoin {
    export const BTC = tokenId("btc-btc")
  }
  export type BitcoinToken = (typeof _allKnownBitcoinTokens)[number]
  export function isBitcoinToken(value: TokenId): value is BitcoinToken {
    return _allKnownBitcoinTokens.includes(value as any)
  }

  export namespace EVM {
    export const USDT = tokenId("evm-usdt")
    export const LUNR = tokenId("evm-lunr")
    export const WBTC = tokenId("evm-wbtc")
    export const BTCB = tokenId("evm-btcb")

    // wrapped tokens
    export const aBTC = tokenId("evm-abtc")
    export const sUSDT = tokenId("evm-susdt")
    export const ALEX = tokenId("evm-alex")
    export const SKO = tokenId("evm-sko")
    export const vLiSTX = tokenId("evm-vlistx")
    export const vLiALEX = tokenId("evm-vlialex")
  }
  export type EVMToken = (typeof _allKnownEVMTokens)[number]
  export function isEVMToken(value: TokenId): value is EVMToken {
    return _allKnownEVMTokens.includes(value as any)
  }

  export namespace Stacks {
    export const sUSDT = tokenId("stx-susdt")
    export const sLUNR = tokenId("stx-slunr")

    export const aBTC = tokenId("stx-abtc")
    export const ALEX = tokenId("stx-alex")
    export const sSKO = tokenId("stx-ssko")
    export const vLiSTX = tokenId("stx-vlistx")
    export const vLiALEX = tokenId("stx-vlialex")
  }
  export type StacksToken = (typeof _allKnownStacksTokens)[number]
  export function isStacksToken(value: TokenId): value is StacksToken {
    return _allKnownStacksTokens.includes(value as any)
  }
}
export const _allKnownBitcoinTokens = Object.values(KnownTokenId.Bitcoin)
export const _allKnownEVMTokens = Object.values(KnownTokenId.EVM)
export const _allKnownStacksTokens = Object.values(KnownTokenId.Stacks)

export namespace KnownChainId {
  export type KnownChain = BitcoinChain | EVMChain | StacksChain
  export function isKnownChain(value: ChainId): value is KnownChain {
    return isBitcoinChain(value) || isEVMChain(value) || isStacksChain(value)
  }

  export namespace Bitcoin {
    export const Mainnet = chainId("bitcoin-mainnet")
    export const Testnet = chainId("bitcoin-testnet")
  }
  export type BitcoinChain = (typeof _allKnownBitcoinChains)[number]
  export function isBitcoinChain(value: ChainId): value is BitcoinChain {
    return _allKnownBitcoinChains.includes(value as any)
  }

  export namespace EVM {
    // Mainnet
    export const Ethereum = chainId("evm-ethereum")
    export const Sepolia = chainId("evm-sepolia")

    // BNB Smart Chain
    export const BSC = chainId("evm-bsc")
    export const BSCTestnet = chainId("evm-bsctestnet")

    // CoreDAO
    export const CoreDAO = chainId("evm-coredao")
    export const CoreDAOTestnet = chainId("evm-coredao-testnet")

    // B2 Bsquared
    export const Bsquared = chainId("evm-bsquared")
    export const BsquaredTestnet = chainId("evm-bsquared-testnet")

    // BOB
    export const BOB = chainId("evm-bob")
    export const BOBTestnet = chainId("evm-bob-testnet")

    // Bitlayer
    export const Bitlayer = chainId("evm-bitlayer")
    export const BitlayerTestnet = chainId("evm-bitlayer-testnet")

    // Lorenzo
    export const Lorenzo = chainId("evm-lorenzo")
    export const LorenzoTestnet = chainId("evm-lorenzo-testnet")

    // Merlin
    export const Merlin = chainId("evm-merlin")
    export const MerlinTestnet = chainId("evm-merlin-testnet")

    // AILayer
    export const AILayer = chainId("evm-ailayer")
    export const AILayerTestnet = chainId("evm-ailayer-testnet")

    // Mode
    export const Mode = chainId("evm-mode")
    export const ModeTestnet = chainId("evm-mode-testnet")

    // X Layer
    export const XLayer = chainId("evm-xlayer")
    export const XLayerTestnet = chainId("evm-xlayer-testnet")
  }

  export type EVMMainnetChain = (typeof _allKnownEVMMainnetChains)[number]
  export function isEVMMainnetChain(value: ChainId): value is EVMMainnetChain {
    return _allKnownEVMMainnetChains.includes(value as any)
  }

  export type EVMTestnetChain = (typeof _allKnownEVMTestnetChains)[number]
  export function isEVMTestnetChain(value: ChainId): value is EVMTestnetChain {
    return _allKnownEVMTestnetChains.includes(value as any)
  }

  export type EVMChain = (typeof _allKnownEVMChains)[number]
  export function isEVMChain(value: ChainId): value is EVMChain {
    return _allKnownEVMChains.includes(value as any)
  }

  export namespace Stacks {
    export const Mainnet = chainId("stacks-mainnet")
    export const Testnet = chainId("stacks-testnet")
  }
  export type StacksChain = (typeof _allKnownStacksChains)[number]
  export function isStacksChain(value: ChainId): value is StacksChain {
    return _allKnownStacksChains.includes(value as any)
  }
}
export const _allKnownBitcoinChains = Object.values(KnownChainId.Bitcoin)
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
] as const
export const _allKnownEVMTestnetChains = [
  KnownChainId.EVM.Sepolia,
  KnownChainId.EVM.BSCTestnet,
  KnownChainId.EVM.CoreDAOTestnet,
  KnownChainId.EVM.BsquaredTestnet,
  KnownChainId.EVM.BOBTestnet,
  KnownChainId.EVM.BitlayerTestnet,
  KnownChainId.EVM.LorenzoTestnet,
  KnownChainId.EVM.MerlinTestnet,
  KnownChainId.EVM.AILayerTestnet,
  KnownChainId.EVM.ModeTestnet,
  KnownChainId.EVM.XLayerTestnet,
] as const

const _restEVMChain = null as Exclude<
  (typeof _allKnownEVMChains)[number],
  | (typeof _allKnownEVMMainnetChains)[number]
  | (typeof _allKnownEVMTestnetChains)[number]
>
checkNever(_restEVMChain)
