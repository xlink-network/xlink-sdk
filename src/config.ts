import { StacksMainnet, StacksMocknet } from "@stacks/network"
import { createClient, http } from "viem"
import { bsc, bscTestnet, mainnet, sepolia } from "viem/chains"

export const STACKS_CONTRACT_DEPLOYER_MAINNET =
  "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9"
export const STACKS_CONTRACT_DEPLOYER_TESTNET =
  "ST1J2JTYXGRMZYNKE40GM87ZCACSPSSEEQVSNB7DC"

export const STACKS_MAINNET = new StacksMainnet({
  url: "https://stacks-node-api.alexlab.co",
})
export const STACKS_TESTNET = new StacksMocknet({
  url: "https://stacks-node-api.alexgo.dev",
})

export const ETHEREUM_MAINNET_CLIENT = createClient({
  chain: mainnet,
  transport: http(),
})
export const ETHEREUM_SEPOLIA_CLIENT = createClient({
  chain: sepolia,
  transport: http(),
})
export const ETHEREUM_BSC_CLIENT = createClient({
  chain: bsc,
  transport: http(),
})
export const ETHEREUM_BSCTESTNET_CLIENT = createClient({
  chain: bscTestnet,
  transport: http(),
})
