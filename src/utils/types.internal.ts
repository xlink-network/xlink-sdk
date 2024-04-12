import { ChainId, TokenId } from "../xlinkSdkUtils/types"
import { oneOf } from "./arrayHelpers"

export type ChainIdInternal = string
export namespace ChainIdInternal {
  export const toChainId = (value: ChainIdInternal): ChainId => value as ChainId
}

export type TokenIdInternal = string
export namespace TokenIdInternal {
  export const toTokenId = (value: TokenIdInternal): TokenId => value as TokenId
}

const chainId = <const T extends ChainIdInternal>(value: T): T => value

const tokenId = <const T extends TokenIdInternal>(value: T): T => value

export namespace KnownTokenId {
  export namespace Bitcoin {
    export const BTC = tokenId("btc-btc")
  }

  export namespace Ethereum {
    export const WBTC = tokenId("eth-wbtc")
    export const BTCB = tokenId("eth-btcb")
    export const USDT = tokenId("eth-usdt")
    export const LUNR = tokenId("eth-lunr")
    export const ALEX = tokenId("eth-alex")
    export const SKO = tokenId("eth-sko")
  }

  export namespace Stacks {
    export const aBTC = tokenId("stx-abtc")
    export const sUSDT = tokenId("stx-susdt")
    export const sLUNR = tokenId("stx-slunr")
    export const ALEX = tokenId("stx-alex")
    export const sSKO = tokenId("stx-ssko")
  }
}

export namespace KnownChainId {
  export namespace Bitcoin {
    export const Mainnet = chainId("bitcoin-mainnet")
    export const Testnet = chainId("bitcoin-testnet")
  }
  const bitcoinChains = [Bitcoin.Mainnet, Bitcoin.Testnet] as const
  export type BitcoinChain = (typeof bitcoinChains)[number]
  export function isBitcoinChain(
    value: ChainIdInternal,
  ): value is BitcoinChain {
    return (
      value === KnownChainId.Bitcoin.Mainnet ||
      value === KnownChainId.Bitcoin.Testnet
    )
  }

  export namespace Ethereum {
    // mainnet
    export const Mainnet = chainId("ethereum-mainnet")
    export const BSC = chainId("ethereum-bsc")
    // export const AVAX = chainId("ethereum-avax")
    // export const Polygon = chainId("ethereum-polygon")
    // testnet
    export const Sepolia = chainId("ethereum-sepolia")
    export const BSCTest = chainId("ethereum-bsctestnet")
  }
  const ethereumChains = [
    Ethereum.Mainnet,
    Ethereum.BSC,
    // Ethereum.AVAX,
    // Ethereum.Polygon,
    Ethereum.Sepolia,
    Ethereum.BSCTest,
  ] as const
  export type EthereumChain = (typeof ethereumChains)[number]
  export function isEthereumChain(
    value: ChainIdInternal,
  ): value is EthereumChain {
    return oneOf(...ethereumChains)(value)
  }

  export namespace Stacks {
    export const Mainnet = chainId("stacks-mainnet")
    export const Testnet = chainId("stacks-testnet")
  }
  const stacksChains = [Stacks.Mainnet, Stacks.Testnet] as const
  export type StacksChain = (typeof stacksChains)[number]
  export function isStacksChain(value: ChainIdInternal): value is StacksChain {
    return (
      value === KnownChainId.Stacks.Mainnet ||
      value === KnownChainId.Stacks.Testnet
    )
  }
}
