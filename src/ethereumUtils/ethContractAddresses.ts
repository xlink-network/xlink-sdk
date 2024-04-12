import { Address } from "viem"
import { KnownChainId, KnownTokenId } from "../utils/types.internal"

type ETHChain = KnownChainId.EthereumChain
const ETHChain = KnownChainId.Ethereum

const ETHToken = KnownTokenId.Ethereum

type AddressMap = Record<ETHChain, undefined | Address>

export type EndpointContractAddresses = Record<
  keyof typeof ethEndpointContractAddresses,
  AddressMap
>

export type TokenContractAddresses = Record<
  keyof typeof ethTokenContractAddresses,
  AddressMap
>

export const ethEndpointContractAddresses = {
  bridgeEndpoint: {
    [ETHChain.Mainnet]: "0xfd9F795B4C15183BDbA83dA08Da02D5f9536748f",
    [ETHChain.Sepolia]: "0x84a0cc1ab353dA6b7817947F7B116b8ea982C3D2",
    [ETHChain.BSC]: "0xb3955302E58FFFdf2da247E999Cd9755f652b13b",
    [ETHChain.BSCTest]: "0xF67734B5b137E26Df05C6Dd4B12f1bC65a0A53E7",
  },
} as const

export const ethTokenContractAddresses: Record<string, AddressMap> = {
  // [ETHCurrency.USDC]: {
  //   [ETHChain.Ethereum]: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  //   [ETHChain.Goerli]: "0x7Ffd58D5bB024A982D918B127F9AbEf2C974dFCD",
  //   [ETHChain.AVAX]: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  //   [ETHChain.BSC]: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
  //   [ETHChain.Polygon]: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  // },
  [ETHToken.USDT]: {
    [ETHChain.Mainnet]: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    [ETHChain.Sepolia]: "0xBa175fDaB00e7FCF603f43bE8f68dB7f4de9f3A9",
    [ETHChain.BSC]: "0x55d398326f99059ff775485246999027b3197955",
    [ETHChain.BSCTest]: undefined,
    // [ETHChain.Polygon]: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
    // [ETHChain.AVAX]: "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7",
  },
  [ETHToken.LUNR]: {
    [ETHChain.Mainnet]: "0xA87135285Ae208e22068AcDBFf64B11Ec73EAa5A",
    [ETHChain.Sepolia]: "0x50c99C14eD859Cde37f6badE0b3887B30D028386",
    [ETHChain.BSC]: "0x37807D4fbEB84124347B8899Dd99616090D3e304",
    [ETHChain.BSCTest]: undefined,
    // [ETHChain.Polygon]: undefined,
    // [ETHChain.AVAX]: undefined,
  },
  [ETHToken.WBTC]: {
    [ETHChain.Mainnet]: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    [ETHChain.Sepolia]: "0x5aCb7fC4b3Bbc875bEd4ebAB6CeDD79DCa17C035",
    [ETHChain.BSC]: undefined,
    [ETHChain.BSCTest]: undefined,
    // [ETHChain.Polygon]: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
    // [ETHChain.AVAX]: "0x50b7545627a5162F82A992c33b87aDc75187B218",
  },
  [ETHToken.BTCB]: {
    [ETHChain.Mainnet]: undefined,
    [ETHChain.Sepolia]: undefined,
    [ETHChain.BSC]: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
    [ETHChain.BSCTest]: undefined,
    // [ETHChain.Polygon]: undefined,
    // [ETHChain.AVAX]: undefined,
  },
  [ETHToken.ALEX]: {
    [ETHChain.Mainnet]: "0xe7c3755482d0da522678af05945062d4427e0923",
    [ETHChain.Sepolia]: "0x9369e86F99613c801D9cf7082f87B2794DAbA1C4",
    [ETHChain.BSC]: "0x43781e3533fa9b8a84823559a22d171825599b8f",
    [ETHChain.BSCTest]: undefined,
    // [ETHChain.Polygon]: undefined,
    // [ETHChain.AVAX]: undefined,
  },
  [ETHToken.SKO]: {
    [ETHChain.Mainnet]: undefined,
    [ETHChain.Sepolia]: undefined,
    [ETHChain.BSC]: "0x9Bf543D8460583Ff8a669Aae01d9cDbeE4dEfE3c",
    [ETHChain.BSCTest]: undefined,
    // [ETHChain.Polygon]: undefined,
    // [ETHChain.AVAX]: undefined,
  },
}
