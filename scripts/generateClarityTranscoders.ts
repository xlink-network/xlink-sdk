import { generateContracts } from "clarity-codegen/lib/generate"
import * as path from "node:path"
import { STACKS_TESTNET } from "../src/config"
import { xlinkContractsDeployerTestnet } from "../src/stacksUtils/stxContractAddresses"
;(async function main(): Promise<void> {
  await generateContracts(
    process.env.STACKS_CORE_API_URL ?? STACKS_TESTNET.coreApiUrl,
    xlinkContractsDeployerTestnet,
    [
      "btc-peg-in-endpoint-v2-03",
      "btc-peg-out-endpoint-v2-01",
      "cross-peg-in-endpoint-v2-03",
      "cross-peg-out-endpoint-v2-01",
    ],
    path.resolve(__dirname, "../generated/smartContract/"),
    "xlink",
    "../smartContractHelpers/codegenImport",
  )
})().catch(console.error)
