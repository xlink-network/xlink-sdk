import { generateContracts } from "clarity-codegen/lib/generate"
import * as path from "node:path"
import { STACKS_CONTRACT_DEPLOYER_MAINNET, STACKS_MAINNET } from "../src/config"
;(async function main(): Promise<void> {
  await generateContracts(
    STACKS_MAINNET.coreApiUrl,
    STACKS_CONTRACT_DEPLOYER_MAINNET,
    [
      "btc-peg-in-endpoint-v2-02",
      "btc-peg-out-endpoint-v2-01",
      "cross-bridge-registry-v2-01",
      "cross-peg-in-endpoint-v2-01",
      "cross-peg-out-endpoint-v2-01",
    ],
    path.resolve(__dirname, "../generated/smartContract/"),
    "xlink",
    "../smartContractHelpers/codegenImport",
  )
})().catch(console.error)
