import { defineChain } from "viem"
import { bob as _bob, merlin as _merlin, xLayer as _xLayer } from "viem/chains"

export const coreDaoTestnet = defineChain({
  id: 1115,
  name: "Core Dao Testnet",
  nativeCurrency: {
    name: "CORE",
    symbol: "CORE",
    decimals: 18,
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 15_979_981,
    },
  },
  rpcUrls: {
    default: { http: ["https://rpc.test.btcs.network"] },
  },
  blockExplorers: {
    default: {
      name: "Core Dao Testnet Explorer",
      url: "https://scan.test.btcs.network",
    },
  },
  testnet: true,
})

export const bsquared = defineChain({
  id: 223,
  name: "B²",
  nativeCurrency: {
    name: "BTC",
    symbol: "BTC",
    decimals: 18,
  },
  contracts: {
    multicall3: {
      address: "0x648cB32CCc0253fd2D811c506F969c1611Eaa82f",
      blockCreated: 5_662_185,
    },
  },
  rpcUrls: {
    default: { http: ["https://rpc.bsquared.network"] },
    alt: { http: ["https://b2-mainnet.alt.technology"] },
    ankr: { http: ["https://rpc.ankr.com/b2"] },
  },
  blockExplorers: {
    default: {
      name: "B² Explorer",
      url: "https://explorer.bsquared.network",
    },
  },
  testnet: false,
})
export const bsquaredTestnet = defineChain({
  id: 1123,
  name: "B² Testnet",
  nativeCurrency: {
    name: "BTC",
    symbol: "BTC",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.bsquared.network"] },
    alt: { http: ["https://b2-testnet.alt.technology"] },
    ankr: { http: ["https://rpc.ankr.com/b2_testnet"] },
  },
  blockExplorers: {
    default: {
      name: "B² Testnet Explorer",
      url: "https://testnet-explorer.bsquared.network/",
    },
  },
  testnet: true,
})

export const bob = defineChain({
  ..._bob,
})
export const bobTestnet = defineChain({
  id: 111,
  name: "BOB Testnet",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://testnet.rpc.gobob.xyz/"] },
  },
  blockExplorers: {
    default: {
      name: "BOB Testnet Explorer",
      url: "https://testnet-explorer.gobob.xyz",
    },
  },
  testnet: true,
})

export const bitlayer = defineChain({
  id: 200901,
  name: "Bitlayer",
  nativeCurrency: {
    name: "BTC",
    symbol: "BTC",
    decimals: 18,
  },
  contracts: {
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      blockCreated: 3_225_645,
    },
  },
  rpcUrls: {
    default: { http: ["https://rpc.bitlayer.org"] },
  },
  blockExplorers: {
    default: {
      name: "Bitlayer Explorer",
      url: "https://www.btrscan.com",
    },
  },
  testnet: false,
})
export const bitlayerTestnet = defineChain({
  id: 200810,
  name: "Bitlayer Testnet",
  nativeCurrency: {
    name: "BTC",
    symbol: "BTC",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.bitlayer.org"] },
  },
  blockExplorers: {
    default: {
      name: "Bitlayer Testnet Explorer",
      url: "https://testnet.btrscan.com",
    },
  },
  testnet: true,
})

export const lorenzo = defineChain({
  id: 8329,
  name: "Lorenzo",
  nativeCurrency: {
    name: "stBTC",
    symbol: "stBTC",
    decimals: 18,
  },
  contracts: {
    multicall3: {
      address: "0x756e73C560Aeeb310b127F214e11e03139FC8f0a",
      blockCreated: 2_490_478,
    },
  },
  rpcUrls: {
    default: { http: ["https://rpc.lorenzo-protocol.xyz"] },
  },
  blockExplorers: {
    default: {
      name: "Lorenzo Explorer",
      url: "https://scan.lorenzo-protocol.xyz",
    },
  },
  testnet: false,
})
export const lorenzoTestnet = defineChain({
  id: 83291,
  name: "Lorenzo Testnet",
  nativeCurrency: {
    name: "stBTC",
    symbol: "stBTC",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://rpc-testnet.lorenzo-protocol.xyz"] },
  },
  blockExplorers: {
    default: {
      name: "Lorenzo Testnet Explorer",
      url: "https://scan-testnet.lorenzo-protocol.xyz",
    },
  },
  testnet: true,
})

export const merlin = defineChain({
  ..._merlin,
  contracts: {
    ..._merlin.contracts,
    multicall3: {
      address: "0x13caE7bc3C7F02FF64cB17076F289467fB133e04",
      blockCreated: 12_377_144,
    },
  },
})
export const merlinTestnet = defineChain({
  id: 686868,
  name: "Merlin Testnet",
  nativeCurrency: {
    name: "BTC",
    symbol: "BTC",
    decimals: 18,
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 4_632_260,
    },
  },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.merlinchain.io"] },
  },
  blockExplorers: {
    default: {
      name: "Merlin Testnet Explorer",
      url: "https://testnet-scan.merlinchain.io",
    },
  },
  testnet: true,
})

export const ailayer = defineChain({
  id: 2649,
  name: "AILayer",
  nativeCurrency: {
    name: "BTC",
    symbol: "BTC",
    decimals: 18,
  },
  contracts: {
    multicall3: {
      address: "0x8BDc1E8149E7259833f8776CAfDa5c55Cfb8Bbd9",
      blockCreated: 4_351_314,
    },
  },
  rpcUrls: {
    default: {
      http: ["https://mainnet-rpc.ailayer.xyz/"],
      webSocket: ["wss://mainnet-rpc.ailayer.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "AILayer Explorer",
      url: "https://mainnet-explorer.ailayer.xyz",
    },
  },
  testnet: false,
})
export const ailayerTestnet = defineChain({
  id: 2648,
  name: "AILayer Testnet",
  nativeCurrency: {
    name: "BTC",
    symbol: "BTC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.ailayer.xyz"],
      webSocket: ["wss://testnet-rpc.ailayer.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "AILayer Testnet Explorer",
      url: "https://testnet-explorer.ailayer.xyz",
    },
  },
  testnet: true,
})

export const xLayer = defineChain({
  ..._xLayer,
  contracts: {
    ..._xLayer.contracts,
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 47_416,
    },
  },
})

export const bisonTestnet = defineChain({
  id: 24767,
  name: "Bison Testnet",
  nativeCurrency: {
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["http://3.87.45.216:12345"],
    },
  },
  blockExplorers: {
    default: {
      name: "Bison Explorer",
      url: "http://3.87.45.216/",
      apiUrl: "",
    },
  },
})

export const bitboyTestnet = defineChain({
  id: 34765,
  name: "Bitboy Testnet",
  nativeCurrency: {
    name: "Bitboy Testnet",
    symbol: "BTT",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["http://54.165.133.116:12345"],
    },
  },
  blockExplorers: {
    default: {
      name: "Bitboy Testnet Explorer",
      url: "http://54.84.174.158",
      apiUrl: "",
    },
  },
})
