import { generateContracts } from "clarity-codegen/lib/generate"
import * as path from "node:path"
import { STACKS_MAINNET } from "../src/config"
import {
  stxContractDeployers,
  xlinkContractsMultisigMainnet,
} from "../src/stacksUtils/stxContractAddresses"
import { KnownChainId } from "../src/utils/types/knownIds"
;(async function main(): Promise<void> {
  await generateContracts(
    process.env.STACKS_CORE_API_URL ?? STACKS_MAINNET.coreApiUrl,
    contractName => {
      return (
        stxContractDeployers[
          contractName as keyof typeof stxContractDeployers
        ]?.[KnownChainId.Stacks.Mainnet]?.deployerAddress ??
        xlinkContractsMultisigMainnet
      )
    },
    [
      "btc-peg-in-endpoint-v2-05",
      "btc-peg-out-endpoint-v2-01",
      "cross-peg-in-endpoint-v2-04",
      "cross-peg-out-endpoint-v2-01",
      "meta-peg-in-endpoint-v2-04",
      "meta-peg-out-endpoint-v2-04",
    ],
    path.resolve(__dirname, "../generated/smartContract/"),
    "xlink",
    "../smartContractHelpers/codegenImport",
  )
})().catch(console.error)
