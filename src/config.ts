import { StacksMainnet, StacksMocknet } from "@stacks/network"

export const STACKS_CONTRACT_DEPLOYER_MAINNET =
  "SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK"
export const STACKS_CONTRACT_DEPLOYER_TESTNET =
  "ST2QXSK64YQX3CQPC530K79XWQ98XFAM9W3XKEH3N"

export const STACKS_MAINNET = new StacksMainnet({
  url: "https://stacks-node-api.alexlab.co",
})
export const STACKS_TESTNET = new StacksMocknet({
  url: "https://stacks-node-api.alexgo.dev",
})
