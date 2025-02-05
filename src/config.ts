import { StacksMainnet, StacksMocknet } from "@stacks/network"

export const backendAPIPrefix = "https://sdk-api.xlink.network/"

export const STACKS_MAINNET = new StacksMainnet({
  url: "https://stacks-node-api.alexlab.co",
})
export const STACKS_TESTNET = new StacksMocknet({
  url: "https://nakamoto-dev-api.alexlab.co",
})

export const contractNameOverrides_mainnet: Record<string, string> = {
  "btc-peg-in-endpoint-v2-07": "btc-peg-in-v2-07a",
  "btc-peg-in-endpoint-v2-07-swap": "btc-peg-in-v2-07a-swap",
  "btc-peg-in-endpoint-v2-05-launchpad": "btc-peg-in-v2-05-launchpad-3c",
  "meta-peg-in-endpoint-v2-06-swap": "meta-peg-in-v2-06-swap",
  "cross-peg-in-endpoint-v2-04-launchpad": "cross-peg-in-v2-04-launchpad-3c",
}
export const contractNameOverrides_testnet: Record<string, string> = {
  "token-wliabtc": "token-wliabtc-dd",
  "token-wvliabtc": "token-wvliabtc-dd",
  "token-liabtc": "token-liabtc-dd",
  "token-vliabtc": "token-vliabtc-dd",

  // btc bridge
  "btc-peg-in-endpoint-v2-05": "btc-peg-in-endpoint-v2-05-dd",
  "btc-peg-in-endpoint-v2-07-swap": "btc-peg-in-v2-07-swap-01",
  "btc-peg-in-endpoint-v2-05-lisa": "btc-peg-in-endpoint-v2-05-lisa-dd",
  "btc-peg-in-endpoint-v2-05-launchpad": "btc-peg-in-v2-05-launchpad-dd",
  "btc-peg-out-endpoint-v2-01": "btc-peg-out-endpoint-v2-01-dd",
  // meta bridge
  "meta-peg-in-endpoint-v2-04": "meta-peg-in-endpoint-v2-04-dd",
  "meta-peg-in-endpoint-v2-06-swap": "meta-peg-in-v2-06-swap-01",
  "meta-peg-in-endpoint-v2-04-lisa": "meta-peg-in-endpoint-v2-04-lisa-dd",
  "meta-peg-out-endpoint-v2-04": "meta-peg-out-endpoint-v2-04-dd",
  // cross bridge
  "cross-peg-in-endpoint-v2-04": "cross-peg-in-endpoint-v2-04-dd",
  "cross-peg-in-endpoint-v2-04-swap": "cross-peg-in-v2-04-swap-da",
  "cross-peg-in-endpoint-v2-04-launchpad":
    "cross-peg-in-endpoint-v2-04-launchpad-dd",
  // cross router
  "cross-router-v2-03": "cross-router-v2-03-dd",
}
