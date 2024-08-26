import { StacksMainnet, StacksMocknet } from "@stacks/network"

export const STACKS_MAINNET = new StacksMainnet({
  url: "https://stacks-node-api.alexlab.co",
})
export const STACKS_TESTNET = new StacksMocknet({
  url: "https://stacks-node-api.alexgo.dev",
})
