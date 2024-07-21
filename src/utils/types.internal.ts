import { ChainId, TokenId } from "../xlinkSdkUtils/types"

export type AnyChainIdInternal = string
export namespace ChainIdInternal {
  export const toChainId = (value: AnyChainIdInternal): ChainId =>
    value as ChainId
}

export type AnyTokenIdInternal = string
export namespace TokenIdInternal {
  export const toTokenId = (value: AnyTokenIdInternal): TokenId =>
    value as TokenId
}

const chainId = <const T extends AnyChainIdInternal>(value: T): T =>
  value as any

const tokenId = <const T extends AnyTokenIdInternal>(value: T): T =>
  value as any

export namespace KnownTokenId {
  export type AllToken = BitcoinToken | EVMToken | StacksToken

  export namespace Bitcoin {
    export const BTC = tokenId("btc-btc")
  }
  export type BitcoinToken = (typeof Bitcoin)[keyof typeof Bitcoin]
  export function isBitcoinToken(
    value: AnyTokenIdInternal,
  ): value is BitcoinToken {
    return value === KnownTokenId.Bitcoin.BTC
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
  export type EVMToken = (typeof EVM)[keyof typeof EVM]
  export function isEVMToken(value: AnyTokenIdInternal): value is EVMToken {
    return (
      value === EVM.USDT ||
      value === EVM.LUNR ||
      value === EVM.WBTC ||
      value === EVM.BTCB ||
      value === EVM.aBTC ||
      value === EVM.sUSDT ||
      value === EVM.ALEX ||
      value === EVM.SKO ||
      value === EVM.vLiSTX ||
      value === EVM.vLiALEX
    )
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
  export type StacksToken = (typeof Stacks)[keyof typeof Stacks]
  export function isStacksToken(
    value: AnyTokenIdInternal,
  ): value is StacksToken {
    return (
      value === Stacks.sUSDT ||
      value === Stacks.sLUNR ||
      value === Stacks.aBTC ||
      value === Stacks.ALEX ||
      value === Stacks.sSKO ||
      value === Stacks.vLiSTX ||
      value === Stacks.vLiALEX
    )
  }
}

export namespace KnownChainId {
  export type AllChain = BitcoinChain | EVMChain | StacksChain

  export namespace Bitcoin {
    export const Mainnet = chainId("bitcoin-mainnet")
    export const Testnet = chainId("bitcoin-testnet")
  }
  const bitcoinChains = [Bitcoin.Mainnet, Bitcoin.Testnet] as const
  export type BitcoinChain = (typeof bitcoinChains)[number]
  export function isBitcoinChain(
    value: AnyChainIdInternal,
  ): value is BitcoinChain {
    return bitcoinChains.includes(value as any)
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
  }

  const evmMainnetChains = [
    EVM.Ethereum,
    EVM.BSC,
    EVM.CoreDAO,
    EVM.Bsquared,
    EVM.BOB,
    EVM.Bitlayer,
    EVM.Lorenzo,
    EVM.Merlin,
    EVM.AILayer,
  ] as const
  export type EVMMainnetChain = (typeof evmMainnetChains)[number]
  export function isEVMMainnetChain(
    value: AnyChainIdInternal,
  ): value is EVMMainnetChain {
    return evmMainnetChains.includes(value as any)
  }

  const evmTestnetChains = [
    EVM.Sepolia,
    EVM.BSCTestnet,
    EVM.CoreDAOTestnet,
    EVM.BsquaredTestnet,
    EVM.BOBTestnet,
    EVM.BitlayerTestnet,
    EVM.LorenzoTestnet,
    EVM.MerlinTestnet,
    EVM.AILayerTestnet,
  ] as const
  export type EVMTestnetChain = (typeof evmTestnetChains)[number]
  export function isEVMTestnetChain(
    value: AnyChainIdInternal,
  ): value is EVMTestnetChain {
    return evmTestnetChains.includes(value as any)
  }

  const evmChains = [...evmMainnetChains, ...evmTestnetChains] as const
  export type EVMChain = (typeof evmChains)[number]
  export function isEVMChain(value: AnyChainIdInternal): value is EVMChain {
    return evmChains.includes(value as any)
  }

  export namespace Stacks {
    export const Mainnet = chainId("stacks-mainnet")
    export const Testnet = chainId("stacks-testnet")
  }
  const stacksChains = [Stacks.Mainnet, Stacks.Testnet] as const
  export type StacksChain = (typeof stacksChains)[number]
  export function isStacksChain(
    value: AnyChainIdInternal,
  ): value is StacksChain {
    return stacksChains.includes(value as any)
  }
}
