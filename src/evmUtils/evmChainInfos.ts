import { defineChain } from "viem"

export const coreDaoTestnet = defineChain({
  id: 1115,
  name: "Core Dao Testnet",
  nativeCurrency: {
    name: "CORE",
    symbol: "CORE",
    decimals: 18,
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
  id: 60808,
  name: "BOB",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://rpc.gobob.xyz/"] },
  },
  blockExplorers: {
    default: {
      name: "BOB Explorer",
      url: "https://explorer.gobob.xyz",
    },
  },
  testnet: false,
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
  id: 4200,
  name: "Merlin",
  nativeCurrency: {
    name: "BTC",
    symbol: "BTC",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://rpc.merlinchain.io"] },
    blockpi: { http: ["https://merlin.blockpi.network/v1/rpc/public"] },
  },
  blockExplorers: {
    default: {
      name: "Merlin Explorer",
      url: "https://scan.merlinchain.io",
    },
  },
  testnet: false,
})
export const merlinTestnet = defineChain({
  id: 686868,
  name: "Merlin Testnet",
  nativeCurrency: {
    name: "BTC",
    symbol: "BTC",
    decimals: 18,
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
