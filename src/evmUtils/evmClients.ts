import { Client, createClient, http } from "viem"
import {
  bob,
  bsc,
  bscTestnet,
  coreDao,
  mainnet,
  merlin,
  mode,
  modeTestnet,
  sepolia,
} from "viem/chains"
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
  [EVMChain.BsquaredTestnet]: createClient({
    chain: bsquaredTestnet,
    transport: http(),
    batch: { multicall: true },
  }),

  [EVMChain.BOB]: createClient({
    chain: bob,
    transport: http(),
    batch: { multicall: true },
  }),
  [EVMChain.BOBTestnet]: createClient({
    chain: bobTestnet,
    transport: http(),
    batch: { multicall: true },
  }),

  [EVMChain.Bitlayer]: createClient({
    chain: bitlayer,
    transport: http(),
    batch: { multicall: true },
  }),
  [EVMChain.BitlayerTestnet]: createClient({
    chain: bitlayerTestnet,
    transport: http(),
    batch: { multicall: true },
  }),

  [EVMChain.Lorenzo]: createClient({
    chain: lorenzo,
    transport: http(),
    batch: { multicall: true },
  }),
  [EVMChain.LorenzoTestnet]: createClient({
    chain: lorenzoTestnet,
    transport: http(),
    batch: { multicall: true },
  }),

  [EVMChain.Merlin]: createClient({
    chain: merlin,
    transport: http(),
    batch: { multicall: true },
  }),
  [EVMChain.MerlinTestnet]: createClient({
    chain: merlinTestnet,
    transport: http(),
    batch: { multicall: true },
  }),

  [EVMChain.AILayer]: createClient({
    chain: ailayer,
    transport: http(),
    batch: { multicall: true },
  }),
  [EVMChain.AILayerTestnet]: createClient({
    chain: ailayerTestnet,
    transport: http(),
    batch: { multicall: true },
  }),

  [EVMChain.Mode]: createClient({
    chain: mode,
    transport: http(),
    batch: { multicall: true },
  }),
  [EVMChain.ModeTestnet]: createClient({
    chain: modeTestnet,
    transport: http(),
    batch: { multicall: true },
  }),

  [EVMChain.XLayer]: createClient({
    chain: mainnet,
    transport: http(),
    batch: { multicall: true },
  }),
  [EVMChain.XLayerTestnet]: createClient({
    chain: mainnet,
    transport: http(),
    batch: { multicall: true },
  }),
}
