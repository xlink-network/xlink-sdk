import { generateContracts } from "clarity-codegen/lib/generate"
import * as path from "node:path"
import { STACKS_CONTRACT_DEPLOYER_MAINNET, STACKS_MAINNET } from "../src/config"
;(async function main(): Promise<void> {
  await generateContracts(
    STACKS_MAINNET.coreApiUrl,
    STACKS_CONTRACT_DEPLOYER_MAINNET,
    ["btc-bridge-endpoint-v1-11", "cross-bridge-endpoint-v1-03"],
    path.resolve(__dirname, "../generated/smartContract/"),
    "xlink",
    "../smartContractHelpers/codegenImport",
  )
})().catch(console.error)
