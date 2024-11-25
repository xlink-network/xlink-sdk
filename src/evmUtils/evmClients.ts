import { Client, createClient, fallback, http } from "viem"
import {
  arbitrum,
  aurora,
  base,
  bob,
  bsc,
  bscTestnet,
  coreDao,
  linea,
  mainnet,
  manta,
  merlin,
  mode,
  sepolia,
} from "viem/chains"
import {
  ailayer,
  berachainTestnet,
  bitlayer,
  bsquared,
  coreDaoTestnet,
  lorenzo,
  xLayer,
} from "./evmChainInfos"
import { EVMChain } from "./evmContractAddresses"

export const defaultEvmClients: Record<
  Exclude<
    EVMChain,
    typeof EVMChain.BitboyTestnet | typeof EVMChain.BisonTestnet
  >,
  Client
> = {
  [EVMChain.Ethereum]: createClient({
    chain: mainnet,
    transport: http(),
    batch: { multicall: true },
  }),
  [EVMChain.Sepolia]: createClient({
    chain: sepolia,
    transport: http(),
    batch: { multicall: true },
  }),

  [EVMChain.BSC]: createClient({
    chain: bsc,
    transport: http(),
    batch: { multicall: true },
  }),
  [EVMChain.BSCTestnet]: createClient({
    chain: bscTestnet,
    transport: http(),
    batch: { multicall: true },
  }),

  [EVMChain.CoreDAO]: createClient({
    chain: coreDao,
    transport: http(),
    batch: { multicall: true },
  }),
  [EVMChain.CoreDAOTestnet]: createClient({
    chain: coreDaoTestnet,
    transport: http(),
    batch: { multicall: true },
  }),

  [EVMChain.Bsquared]: createClient({
    chain: bsquared,
    transport: http(),
    batch: { multicall: true },
  }),

  [EVMChain.BOB]: createClient({
    chain: bob,
    transport: http(),
    batch: { multicall: true },
  }),

  [EVMChain.Bitlayer]: createClient({
    chain: bitlayer,
    transport: http(),
    batch: { multicall: true },
  }),

  [EVMChain.Lorenzo]: createClient({
    chain: lorenzo,
    transport: http(),
    batch: { multicall: true },
  }),

  [EVMChain.Merlin]: createClient({
    chain: merlin,
    transport: http(),
    batch: { multicall: true },
  }),

  [EVMChain.AILayer]: createClient({
    chain: ailayer,
    transport: http(),
    batch: { multicall: true },
  }),

  [EVMChain.Mode]: createClient({
    chain: mode,
    transport: http(),
    batch: { multicall: true },
  }),

  [EVMChain.XLayer]: createClient({
    chain: xLayer,
    transport: fallback([http(), http("https://xlayerrpc.okx.com")]),
    batch: { multicall: true },
  }),

  [EVMChain.Arbitrum]: createClient({
    chain: arbitrum,
    transport: http(),
    batch: { multicall: true },
  }),

  [EVMChain.Aurora]: createClient({
    chain: aurora,
    transport: http(),
    batch: { multicall: true },
  }),

  [EVMChain.Manta]: createClient({
    chain: manta,
    transport: http(),
    batch: { multicall: true },
  }),

  [EVMChain.Linea]: createClient({
    chain: linea,
    transport: http(),
    batch: { multicall: true },
  }),

  [EVMChain.Base]: createClient({
    chain: base,
    transport: http(),
    batch: { multicall: true },
  }),

  [EVMChain.BeraTestnet]: createClient({
    chain: berachainTestnet,
    transport: http(),
    batch: { multicall: true },
  }),
}
