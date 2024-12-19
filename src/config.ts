import { StacksMainnet, StacksMocknet } from "@stacks/network"

export const backendAPIPrefix = "https://sdk-api.xlink.network/"

export const STACKS_MAINNET = new StacksMainnet({
  url: "https://stacks-node-api.alexlab.co",
})
export const STACKS_TESTNET = new StacksMocknet({
  url: "https://nakamoto-dev-api.alexlab.co",
})
