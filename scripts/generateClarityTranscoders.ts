import { generateContracts } from "clarity-codegen/lib/generate"
import * as path from "node:path"
import { STACKS_MAINNET } from "../src/config"
import { xlinkContractsDeployerMainnet } from "../src/stacksUtils/stxContractAddresses"
;(async function main(): Promise<void> {
  await generateContracts(
    STACKS_MAINNET.coreApiUrl,
    xlinkContractsDeployerMainnet,
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
