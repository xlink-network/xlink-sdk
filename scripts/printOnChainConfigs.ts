import { XLinkSDK } from "../src"
import { getAllAddresses } from "../src/evmUtils/contractHelpers"
import { getXLinkSDKContext } from "../src/lowlevelUnstableInfos"
import { _allKnownEVMChains } from "../src/utils/types/knownIds"

async function print(matchers: { chain: string[] }): Promise<void> {
  const chainIds = _allKnownEVMChains.filter(c =>
    matchers.chain.some(m => c.includes(m)),
  )

  const sdk = new XLinkSDK()
  const ctx = getXLinkSDKContext(sdk)

  await Promise.all(
    chainIds.map(chainId =>
      getAllAddresses(ctx, chainId).then(resp => {
        console.log(chainId, resp?.onChainAddresses ?? "undefined")
        return resp
      }),
    ),
  )
}

async function main(command: string[], args: string[]): Promise<void> {
  if (args.some(a => a === "-h" || a === "--help")) {
    console.log(`Usage: ${command.join(" ")} [chain:<chain>] [token:<token>]`)
    process.exit(0)
  }

  const matchers = {
    chain: [] as string[],
  }
  args.forEach(arg => {
    if (arg.startsWith("chain:")) {
      matchers.chain.push(arg.split(":")[1])
    }
  })

  await print(matchers).catch(console.error)
}

main(process.argv.slice(0, 2), process.argv.slice(2)).catch(console.error)
