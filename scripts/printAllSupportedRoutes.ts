import { XLinkSDK } from "../src"
import { KnownRoute } from "../src/utils/buildSupportedRoutes"

async function main(): Promise<void> {
  const sdk = new XLinkSDK()
  const supportedRoutes = await sdk.getSupportedRoutes()

  const group: Record<string, KnownRoute[]> = {}
  for (const route of supportedRoutes) {
    const key = `${route.fromChain} -> ${route.toChain}`
    if (!group[key]) group[key] = []
    group[key].push(route)
  }

  const groupEntries = Object.entries(group)
  for (const [group, routes] of groupEntries) {
    console.log(group)
    for (const route of routes) {
      console.log(`    ${route.fromToken} -> ${route.toToken}`)
    }
  }
}

main().catch(console.error)
