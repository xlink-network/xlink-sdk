import { StacksMainnet, StacksMocknet } from "@stacks/network"

export const backendAPIPrefix = "https://sdk-api.xlink.network/"

export const STACKS_MAINNET = new StacksMainnet({
  url: "https://stacks-node-api.alexlab.co",
})
export const STACKS_TESTNET = new StacksMocknet({
  url: "https://nakamoto-dev-api.alexlab.co",
})

export const contractNameOverrides_mainnet: Record<string, string> = {
  "btc-peg-in-endpoint-v2-07-swap": "btc-peg-in-v2-07-swap",
  "meta-peg-in-endpoint-v2-06-swap": "meta-peg-in-v2-06-swap",
}
export const contractNameOverrides_testnet: Record<string, string> = {
  "token-wliabtc": "token-wliabtc-dc",
  "token-wvliabtc": "token-wvliabtc-dc",
  "token-liabtc": "token-liabtc-dc",
  "token-vliabtc": "token-vliabtc-dc",

  // btc bridge
  "btc-peg-in-endpoint-v2-05": "btc-peg-in-endpoint-v2-05-dc",
  "btc-peg-in-endpoint-v2-05-lisa": "btc-peg-in-endpoint-v2-05-lisa-dc",
  "btc-peg-in-v2-07-swap": "btc-peg-in-v2-07-swap-01",
  "btc-peg-in-v2-05-launchpad": "btc-peg-in-v2-05-launchpad-dc",
  "btc-peg-out-endpoint-v2-01": "btc-peg-out-endpoint-v2-05-dc",
  // meta bridge
  "meta-peg-in-endpoint-v2-04": "meta-peg-in-endpoint-v2-04-dc",
  "meta-peg-in-endpoint-v2-04-lisa": "meta-peg-in-endpoint-v2-04-lisa-dc",
  "meta-peg-in-v2-06-swap": "meta-peg-in-v2-06-swap-01",
  "meta-peg-out-endpoint-v2-04": "meta-peg-out-endpoint-v2-04-dc",
  // cross bridge
  "cross-peg-in-v2-04-swap": "cross-peg-in-v2-04-swap-da",
  "cross-peg-in-v2-04-launchpad": "cross-peg-in-endpoint-v2-04-launchpad-dc",
  "cross-peg-in-endpoint-v2-04": "cross-peg-in-endpoint-v2-04-dc",
  // cross router
  "cross-router-v2-03": "cross-router-v2-03-dc",
}
