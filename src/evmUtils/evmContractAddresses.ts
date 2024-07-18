import { Address, Client, createClient, http } from "viem"
import {
  bob,
  bsc,
  bscTestnet,
  coreDao,
  mainnet,
  merlin,
  sepolia,
} from "viem/chains"
import { KnownChainId, KnownTokenId } from "../utils/types.internal"
import {
  ailayer,
  ailayerTestnet,
  bitlayer,
  bitlayerTestnet,
  bobTestnet,
  bsquared,
  bsquaredTestnet,
  coreDaoTestnet,
  lorenzo,
  lorenzoTestnet,
  merlinTestnet,
} from "./evmChainInfos"

type EVMChain = KnownChainId.EVMChain
const EVMChain = KnownChainId.EVM

type EVMToken = KnownTokenId.EVMToken
const EVMToken = KnownTokenId.EVM

export type EVMEndpointContract = typeof EVMEndpointContract.BridgeEndpoint
export namespace EVMEndpointContract {
  export const BridgeEndpoint = "BridgeEndpoint" as const
}

export const evmClients: Record<EVMChain, Client> = {
  [EVMChain.Ethereum]: createClient({
    chain: mainnet,
    transport: http(),
  }),
  [EVMChain.BSC]: createClient({
    chain: bsc,
    transport: http(),
  }),
  [EVMChain.CoreDAO]: createClient({
    chain: coreDao,
    transport: http(),
  }),
  [EVMChain.Bsquared]: createClient({
    chain: bsquared,
    transport: http(),
  }),
  [EVMChain.BOB]: createClient({
    chain: bob,
    transport: http(),
  }),
  [EVMChain.Bitlayer]: createClient({
    chain: bitlayer,
    transport: http(),
  }),
  [EVMChain.Lorenzo]: createClient({
    chain: lorenzo,
    transport: http(),
  }),
  [EVMChain.Merlin]: createClient({
    chain: merlin,
    transport: http(),
  }),
  [EVMChain.AILayer]: createClient({
    chain: ailayer,
    transport: http(),
  }),

  // testnet
  [EVMChain.Sepolia]: createClient({
    chain: sepolia,
    transport: http(),
  }),
  [EVMChain.BSCTest]: createClient({
    chain: bscTestnet,
    transport: http(),
  }),
  [EVMChain.CoreDAOTest]: createClient({
    chain: coreDaoTestnet,
    transport: http(),
  }),
  [EVMChain.BsquaredTest]: createClient({
    chain: bsquaredTestnet,
    transport: http(),
  }),
  [EVMChain.BOBTest]: createClient({
    chain: bobTestnet,
    transport: http(),
  }),
  [EVMChain.BitlayerTest]: createClient({
    chain: bitlayerTestnet,
    transport: http(),
  }),
  [EVMChain.LorenzoTest]: createClient({
    chain: lorenzoTestnet,
    transport: http(),
  }),
  [EVMChain.MerlinTest]: createClient({
    chain: merlinTestnet,
    transport: http(),
  }),
  [EVMChain.AILayerTest]: createClient({
    chain: ailayerTestnet,
    transport: http(),
  }),
}

export const evmContractAddresses: Record<
  EVMChain,
  Partial<Record<EVMEndpointContract | EVMToken, Address>>
> = {
  // https://t.me/c/1599543687/54226
  [EVMChain.Ethereum]: {
    [EVMEndpointContract.BridgeEndpoint]:
      "0x1c5aC43f0b30462C5dDEB1A2152E639BbDFe38eA",
    [EVMToken.USDT]: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    [EVMToken.LUNR]: "0xA87135285Ae208e22068AcDBFf64B11Ec73EAa5A",
    [EVMToken.WBTC]: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    [EVMToken.ALEX]: "0xA831a4E181F25D3B35949E582Ff27Cc44e703F37",
  },
  // https://t.me/c/1599543687/54226
  [EVMChain.BSC]: {
    [EVMEndpointContract.BridgeEndpoint]:
      // https://t.me/c/1599543687/56568
      "0xB17192C2Ccf721830deFb489b255365d3BB369e7",
    [EVMToken.USDT]: "0x55d398326f99059fF775485246999027B3197955",
    [EVMToken.LUNR]: "0x37807D4fbEB84124347B8899Dd99616090D3e304",
    [EVMToken.BTCB]: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
    [EVMToken.ALEX]: "0xdfd0660032c2D0D38a9092a43d1669D6568cAF71",
    [EVMToken.SKO]: "0x9Bf543D8460583Ff8a669Aae01d9cDbeE4dEfE3c",
  },
  // https://t.me/c/1599543687/54380
  [EVMChain.CoreDAO]: {
    [EVMEndpointContract.BridgeEndpoint]:
      "0xcd5ED0B0b1e107D331833715932B4a596bFbA378",
    [EVMToken.aBTC]: "0x70727228DB8C7491bF0aD42C180dbf8D95B257e2",
    [EVMToken.ALEX]: "0xA831a4E181F25D3B35949E582Ff27Cc44e703F37",
    [EVMToken.vLiSTX]: "0xE67640ABD424d9456eF8A4160D5753Fe5833291d",
    // https://github.com/xlink-network/xlink/blob/87aaca8ef74dea59a322eb31c92311d2aa25d6bb/packages/libs/commons/src/lib/utils/config.ts#L199
    [EVMToken.vLiALEX]: "0x9e801CB9ce84a84a563E5a74Cc2f3Ad55F914072",
  },
  // https://t.me/c/1599543687/54380
  [EVMChain.Bsquared]: {
    [EVMEndpointContract.BridgeEndpoint]:
      "0x79d1C91053baceced5C796aB8a765E4d5aB38e8a",
    [EVMToken.aBTC]: "0x7A087e75807F2E5143C161a817E64dF6dC5EAFe0",
    [EVMToken.ALEX]: "0xdfd0660032c2D0D38a9092a43d1669D6568cAF71",
    [EVMToken.vLiSTX]: "0x70727228DB8C7491bF0aD42C180dbf8D95B257e2",
    // https://github.com/xlink-network/xlink/blob/87aaca8ef74dea59a322eb31c92311d2aa25d6bb/packages/libs/commons/src/lib/utils/config.ts#L216
    [EVMToken.vLiALEX]: "0xcd5ED0B0b1e107D331833715932B4a596bFbA378",
  },
  // https://t.me/c/1599543687/54380
  [EVMChain.BOB]: {
    [EVMEndpointContract.BridgeEndpoint]:
      "0x79d1C91053baceced5C796aB8a765E4d5aB38e8a",
    [EVMToken.aBTC]: "0x7A087e75807F2E5143C161a817E64dF6dC5EAFe0",
    [EVMToken.ALEX]: "0xdfd0660032c2D0D38a9092a43d1669D6568cAF71",
    [EVMToken.vLiSTX]: "0x70727228DB8C7491bF0aD42C180dbf8D95B257e2",
    // https://github.com/xlink-network/xlink/blob/87aaca8ef74dea59a322eb31c92311d2aa25d6bb/packages/libs/commons/src/lib/utils/config.ts#L233
    [EVMToken.vLiALEX]: "0xcd5ED0B0b1e107D331833715932B4a596bFbA378",
  },
  // https://t.me/c/1599543687/54380
  [EVMChain.Bitlayer]: {
    [EVMEndpointContract.BridgeEndpoint]:
      "0x79d1C91053baceced5C796aB8a765E4d5aB38e8a",
    [EVMToken.aBTC]: "0xdfd0660032c2D0D38a9092a43d1669D6568cAF71",
    [EVMToken.ALEX]: "0xcd5ED0B0b1e107D331833715932B4a596bFbA378",
    [EVMToken.vLiSTX]: "0xA831a4E181F25D3B35949E582Ff27Cc44e703F37",
    // https://github.com/xlink-network/xlink/blob/87aaca8ef74dea59a322eb31c92311d2aa25d6bb/packages/libs/commons/src/lib/utils/config.ts#L250
    [EVMToken.vLiALEX]: "0x70727228DB8C7491bF0aD42C180dbf8D95B257e2",
  },
  // https://t.me/c/1599543687/55593
  [EVMChain.Lorenzo]: {
    [EVMEndpointContract.BridgeEndpoint]:
      "0xFFda60ed91039Dd4dE20492934bC163e0F61e7f5",
    [EVMToken.aBTC]: "0x13b72A19e221275D3d18ed4D9235F8F859626673",
    [EVMToken.ALEX]: "0x858d1dbd14a023A905535823a77925082507D38B",
    [EVMToken.vLiSTX]: "0x4CeFE0F8FcEa50c982AAbF766e67F2B0e7845542",
    // https://github.com/xlink-network/xlink/blob/87aaca8ef74dea59a322eb31c92311d2aa25d6bb/packages/libs/commons/src/lib/utils/config.ts#L267
    [EVMToken.vLiALEX]: "0x1c5aC43f0b30462C5dDEB1A2152E639BbDFe38eA",
  },
  // https://t.me/c/1599543687/56591
  [EVMChain.Merlin]: {
    [EVMEndpointContract.BridgeEndpoint]:
      "0x79d1C91053baceced5C796aB8a765E4d5aB38e8a",
    [EVMToken.aBTC]: "0x858d1dbd14a023A905535823a77925082507D38B",
    [EVMToken.ALEX]: "0x1c5aC43f0b30462C5dDEB1A2152E639BbDFe38eA",
    [EVMToken.vLiSTX]: "0x4CeFE0F8FcEa50c982AAbF766e67F2B0e7845542",
    [EVMToken.vLiALEX]: "0x822278fb6ece06667AE5207D0af12a7F60CDf13A",
  },
  // https://t.me/c/1599543687/57439
  [EVMChain.AILayer]: {
    [EVMEndpointContract.BridgeEndpoint]:
      "0x79d1C91053baceced5C796aB8a765E4d5aB38e8a",
    [EVMToken.aBTC]: "0x7A087e75807F2E5143C161a817E64dF6dC5EAFe0",
    [EVMToken.ALEX]: "0xdfd0660032c2D0D38a9092a43d1669D6568cAF71",
    [EVMToken.vLiALEX]: "0xcd5ED0B0b1e107D331833715932B4a596bFbA378",
    [EVMToken.vLiSTX]: "0x70727228DB8C7491bF0aD42C180dbf8D95B257e2",
  },

  // testnet
  [EVMChain.Sepolia]: {
    [EVMEndpointContract.BridgeEndpoint]:
      "0x4d7d8BA7BC171578367a785f7E1eAd79Dab84825",
    [EVMToken.WBTC]: "0x9CE827b04cD5f0c20dC1ac5621120204b348B4cD",
    [EVMToken.ALEX]: "0x564e0DAd09B0e227409A703326698b68C238374b",
  },
  [EVMChain.BSCTest]: {},
  [EVMChain.CoreDAOTest]: {
    [EVMEndpointContract.BridgeEndpoint]:
      "0x78cFEbF19Cfd950A434ec3008eDE746DA45EF096",
    [EVMToken.aBTC]: "0x391c193a3268aA0A93D76EAc85B88985b5CB92da",
    [EVMToken.ALEX]: "0xd74aE62e92f0EB0D3DF986387D61f3f09E0f1954",
  },
  [EVMChain.BsquaredTest]: {},
  [EVMChain.BOBTest]: {},
  [EVMChain.BitlayerTest]: {},
  [EVMChain.LorenzoTest]: {},
  [EVMChain.MerlinTest]: {},
  [EVMChain.AILayerTest]: {},
}
