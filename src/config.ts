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
  "btc-peg-in-endpoint-v2-07-swap": "btc-peg-in-v2-07e-swap",
  "btc-peg-in-endpoint-v2-07-agg": "btc-peg-in-v2-07e-agg",
  "btc-peg-in-endpoint-v2-05-launchpad": "btc-peg-in-v2-05-launchpad-3c",
  "meta-peg-in-endpoint-v2-06-swap": "meta-peg-in-v2-06d-swap",
  "meta-peg-in-endpoint-v2-06-agg": "meta-peg-in-v2-06e-agg",
  "cross-peg-in-endpoint-v2-04-swap": "cross-peg-in-v2-04b-swap",
  "cross-peg-in-endpoint-v2-04-launchpad": "cross-peg-in-v2-04-launchpad-3c",
  "cross-peg-out-endpoint-v2-01-agg": "cross-peg-out-v2-01b-agg",
}
export const contractNameOverrides_testnet: Record<string, string> = {
  "token-wliabtc": "token-wliabtc-dk",
  "token-wvliabtc": "token-wvliabtc-dk",
  "token-liabtc": "token-liabtc-dk",
  "token-vliabtc": "token-vliabtc-dk",

  // btc bridge
  "btc-peg-in-endpoint-v2-07": "btc-peg-in-endpoint-v2-07-dk",
  "btc-peg-in-endpoint-v2-07-swap": "btc-peg-in-v2-07-swap-dk",
  "btc-peg-in-endpoint-v2-07-agg": "btc-peg-in-v2-07b-agg-dk",
  "btc-peg-in-endpoint-v2-05-lisa": "btc-peg-in-endpoint-v2-05-lisa-dk",
  "btc-peg-in-endpoint-v2-05-launchpad": "btc-peg-in-v2-05-launchpad-3c-dk",
  "btc-peg-out-endpoint-v2-01": "btc-peg-out-endpoint-v2-01-dk",
  // meta bridge
  "meta-peg-in-endpoint-v2-04": "meta-peg-in-endpoint-v2-04-dk",
  "meta-peg-in-endpoint-v2-06-swap": "meta-peg-in-v2-06-swap-01",
  "meta-peg-in-endpoint-v2-06-agg": "meta-peg-in-v2-06-agg",
  "meta-peg-in-endpoint-v2-04-lisa": "meta-peg-in-endpoint-v2-04-lisa-dk",
  "meta-peg-out-endpoint-v2-04": "meta-peg-out-endpoint-v2-04-dk",
  // cross bridge
  "cross-peg-in-endpoint-v2-04": "cross-peg-in-endpoint-v2-04-dk",
  "cross-peg-in-endpoint-v2-04-swap": "cross-peg-in-v2-04-swap-dk",
  "cross-peg-in-endpoint-v2-04-launchpad":
    "cross-peg-in-endpoint-v2-04-launchpad-3c-dk",
  "cross-peg-out-endpoint-v2-01-agg": "cross-peg-out-v2-01a-agg-dk",
  // cross router
  "cross-router-v2-03": "cross-router-v2-03-dk",
}

/**
 * Currently, we use the swap contract to retrieve fee information for the basic peg-in process.
 * This approach is temporary and will be reverted to the standard contract in the future.
 */
export const EVM_BARE_PEG_IN_USE_SWAP_CONTRACT = true
