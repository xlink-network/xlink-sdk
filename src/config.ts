import { StacksMainnet, StacksMocknet } from "@stacks/network"

export const backendAPIPrefix = "https://sdk-api.xlink.network/"

export const STACKS_MAINNET = new StacksMainnet({
  url: "https://stacks-node-api.alexlab.co",
})
export const STACKS_TESTNET = new StacksMocknet({
  url: "https://nakamoto-dev-api.alexlab.co",
})

export const envName = process.env.ENV_NAME === "dev" ? "dev" : "prod"
export const contractNameOverrides: Record<string, string> =
  envName === "prod"
    ? {
        "btc-peg-in-endpoint-v2-05-swap": "btc-peg-in-v2-05-swap",
        "meta-peg-in-endpoint-v2-04-swap": "meta-peg-in-v2-04-swap",
      }
    : {
        "btc-peg-in-endpoint-v2-05-swap": "btc-peg-in-endpoint-v2-05-swap-da",
        "meta-peg-in-endpoint-v2-04-swap": "meta-peg-in-endpoint-v2-04-swap-da",
        "meta-peg-out-endpoint-v2-04": "meta-peg-out-endpoint-v2-04-da",
        "token-wvliabtc": "token-wvliabtc-da",
      }
