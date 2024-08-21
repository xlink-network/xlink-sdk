import { Client, createClient, fallback, http } from "viem"
import {
  bob,
  bsc,
  bscTestnet,
  coreDao,
  mainnet,
  merlin,
  mode,
  sepolia,
  xLayer,
} from "viem/chains"
import {
  ailayer,
  bitlayer,
  bsquared,
  coreDaoTestnet,
  lorenzo,
} from "./evmChainInfos"
import { EVMChain } from "./evmContractAddresses"

export const evmClients: Record<EVMChain, Client> = {
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
}
