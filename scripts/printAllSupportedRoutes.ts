import { XLinkSDK } from "../src"
import { KnownRoute } from "../src/utils/buildSupportedRoutes"

async function print(matchers: {
  debug: boolean
  op: "swap" | "bridge"
  chain: string[]
  token: string[]
}): Promise<void> {
  const sdk = new XLinkSDK({
    debugLog: matchers.debug,
  })
  const supportedRoutes = await sdk
    .getSupportedRoutes({
      includeUnpredictableSwapPossibilities: matchers.op === "swap",
    })
    .then(routes => {
      const isChainMatch: (r: KnownRoute) => boolean =
        matchers.chain.length === 0
          ? () => true
          : r =>
              matchers.chain.some(
                c => r.fromChain.includes(c) || r.toChain.includes(c),
              )

      const isTokenMatch: (r: KnownRoute) => boolean =
        matchers.token.length === 0
          ? () => true
          : r =>
              matchers.token.some(
                t => r.fromToken.includes(t) || r.toToken.includes(t),
              )

      return routes.filter(r => isChainMatch(r) && isTokenMatch(r))
    })

  const group: Record<string, KnownRoute[]> = {}
  for (const route of supportedRoutes) {
    const key = `${route.fromChain} -> ${route.toChain}`
    if (!group[key]) group[key] = []
    group[key].push(route)
  }

  const groupEntries = Object.entries(group)
  for (const [group, routes] of groupEntries) {
    const matchedRoutes = routes.filter(r => runMatchers(r))
    if (matchedRoutes.length === 0) continue

    console.log(group)
    for (const route of matchedRoutes) {
      console.log(`    ${route.fromToken} -> ${route.toToken}`)
    }
  }

  function runMatchers(route: KnownRoute): boolean {
    if (matchers.chain.length === 0 && matchers.token.length === 0) return true

    return (
      matchers.chain.some(
        c => route.fromChain.includes(c) || route.toChain.includes(c),
      ) ||
      matchers.token.some(
        t => route.fromToken.includes(t) || route.toToken.includes(t),
      )
    )
  }
}

async function main(command: string[], args: string[]): Promise<void> {
  if (args.some(a => a === "-h" || a === "--help")) {
    console.log(
      `Usage: ${command.join(" ")} [op:debug] [op:swap] [chain:<chain>] [token:<token>]`,
    )
    process.exit(0)
  }

  const matchers = {
    debug: args.includes("op:debug"),
    op: args.includes("op:swap") ? ("swap" as const) : ("bridge" as const),
    chain: [] as string[],
    token: [] as string[],
  }
  args.forEach(arg => {
    if (arg.startsWith("chain:")) {
      matchers.chain.push(arg.split(":")[1])
    } else if (arg.startsWith("token:")) {
      matchers.token.push(arg.split(":")[1])
    }
  })

  await print(matchers).catch(console.error)
}

main(process.argv.slice(0, 2), process.argv.slice(2)).catch(console.error)
