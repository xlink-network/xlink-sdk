import { Address } from "viem"
import { KnownChainId, KnownTokenId } from "../utils/types/knownIds"

export type EVMChain = KnownChainId.EVMChain
export const EVMChain = KnownChainId.EVM

type EVMToken = KnownTokenId.EVMToken
const EVMToken = KnownTokenId.EVM

export type EVMEndpointContract =
  | typeof EVMEndpointContract.BridgeEndpoint
  | typeof EVMEndpointContract.BridgeConfig
  | typeof EVMEndpointContract.TimeLock
  | typeof EVMEndpointContract.Registry
export namespace EVMEndpointContract {
  export const BridgeEndpoint = "BridgeEndpoint"
  export const BridgeConfig = "BridgeConfig"
  export const TimeLock = "TimeLock"
  export const Registry = "Registry"
}

export type EVMOnChainAddresses = Partial<
  Record<EVMEndpointContract | EVMToken, Address>
>

export const evmContractAddresses: Record<EVMChain, EVMOnChainAddresses> = {
  [EVMChain.Ethereum]: {
    // https://t.me/c/1599543687/57297
    [EVMEndpointContract.BridgeConfig]:
      "0x79d1C91053baceced5C796aB8a765E4d5aB38e8a",
  },
  [EVMChain.BSC]: {
    // https://t.me/c/1599543687/57297
    [EVMEndpointContract.BridgeConfig]:
      "0x7062dB5dcaECDb355878a0BAB00A6941345D8711",
  },
  [EVMChain.CoreDAO]: {
    // https://t.me/c/1599543687/57297
    [EVMEndpointContract.BridgeConfig]:
      "0x7062dB5dcaECDb355878a0BAB00A6941345D8711",
  },
  [EVMChain.Bsquared]: {
    // https://t.me/c/1599543687/57297
    [EVMEndpointContract.BridgeConfig]:
      "0xf99f62475F50BE59393dbdc148E6627E4E88Fc24",
  },
  [EVMChain.BOB]: {
    // https://t.me/c/1599543687/57297
    [EVMEndpointContract.BridgeConfig]:
      "0xf99f62475F50BE59393dbdc148E6627E4E88Fc24",
  },
  [EVMChain.Bitlayer]: {
    // https://t.me/c/1599543687/57297
    [EVMEndpointContract.BridgeConfig]:
      "0xf99f62475F50BE59393dbdc148E6627E4E88Fc24",
  },
  [EVMChain.Lorenzo]: {
    // https://t.me/c/1599543687/57297
    [EVMEndpointContract.BridgeConfig]:
      "0xf99f62475F50BE59393dbdc148E6627E4E88Fc24",
  },
  [EVMChain.Merlin]: {
    // https://t.me/c/1599543687/57297
    [EVMEndpointContract.BridgeConfig]:
      "0xf99f62475F50BE59393dbdc148E6627E4E88Fc24",
  },
  [EVMChain.AILayer]: {
    // https://t.me/c/1599543687/57439
    [EVMEndpointContract.BridgeConfig]:
      "0xf99f62475F50BE59393dbdc148E6627E4E88Fc24",
  },
  [EVMChain.Mode]: {
    // https://t.me/c/1599543687/57779
    [EVMEndpointContract.BridgeConfig]:
      "0xf99f62475F50BE59393dbdc148E6627E4E88Fc24",
  },
  [EVMChain.XLayer]: {
    // https://t.me/c/1599543687/58186
    [EVMEndpointContract.BridgeConfig]:
      "0xf99f62475F50BE59393dbdc148E6627E4E88Fc24",
  },
  [EVMChain.Arbitrum]: {
    // https://t.me/c/1599543687/58824
    [EVMEndpointContract.BridgeConfig]:
      "0xf99f62475F50BE59393dbdc148E6627E4E88Fc24",
  },
  [EVMChain.Aurora]: {
    // https://t.me/c/1599543687/59145
    [EVMEndpointContract.BridgeConfig]:
      "0xf99f62475F50BE59393dbdc148E6627E4E88Fc24",
  },
  [EVMChain.Manta]: {
    // https://t.me/c/1599543687/60487
    [EVMEndpointContract.BridgeConfig]:
      "0xf99f62475F50BE59393dbdc148E6627E4E88Fc24",
  },

  // testnet
  [EVMChain.Sepolia]: {
    [EVMEndpointContract.BridgeEndpoint]:
      "0x27c2Ad8da9487AD17970a57D32972BD707B700A2",
    [EVMToken.WBTC]: "0xE1a512f9D89fdDcD2105Df4dB32ede4bc2ade33B",
    [EVMToken.ALEX]: "0xA1c1f6D111339E26c9Fe61256c4751F539b40bd6",
  },
  [EVMChain.BSCTestnet]: {},
  [EVMChain.CoreDAOTestnet]: {},
  [EVMChain.BisonTestnet]: {
    [EVMEndpointContract.BridgeEndpoint]:
      "0xf9dFCEDf0D4eCe3c9F7CD2F3C0c70556EfAA1665",
    [EVMToken.sUSDT]: "0x8EcfD0a81c2965d16b78e86b8E4Dc71D0109e0e1",
    [EVMToken.aBTC]: "0xC64DC7855F0FC571578D6226C058798AE86DCb77",
    [EVMToken.ALEX]: "0x6c74Bc8c54114b8Fed89686cC345eBCd838Fa0b9",
  },
  [EVMChain.BitboyTestnet]: {
    [EVMEndpointContract.BridgeEndpoint]:
      "0x3114671EefE856B32851DF4bc5b6278d5A74b86b",
    [EVMToken.sUSDT]: "0x0d05e721F127AF25bDa0FE8836F1A2127028ad01",
    [EVMToken.aBTC]: "0xEf33A9Afa67bad73b8df4beBD4C5Adc678D70528",
    [EVMToken.ALEX]: "0x1DcD5BE312cc70c1e86218D2aC86EDDf79a851E4",
  },
  [EVMChain.BeraTestnet]: {
    // https://t.me/c/1599543687/60509
    [EVMEndpointContract.BridgeConfig]:
      "0xBa175fDaB00e7FCF603f43bE8f68dB7f4de9f3A9",
    // https://t.me/c/1599543687/60499
    [EVMEndpointContract.Registry]:
      "0x6c74Bc8c54114b8Fed89686cC345eBCd838Fa0b9",
    [EVMToken.aBTC]: "0xD66FEeb23463f99f56363a7de7acEd7d04F3356e",
    [EVMToken.ALEX]: "0x3114671EefE856B32851DF4bc5b6278d5A74b86b",
    [EVMToken.vLiALEX]: "0x8EcfD0a81c2965d16b78e86b8E4Dc71D0109e0e1",
    [EVMToken.vLiSTX]: "0x2e3149230f98e7474AAAB3c1F6323BADfC4A66F8",
    [EVMToken.sUSDT]: "0x8F4eB4dB1493D800Bf476137A25dC3c3cD58952C",
    [EVMToken.wuBTC]: "0x391c193a3268aA0A93D76EAc85B88985b5CB92da",
  },
}
