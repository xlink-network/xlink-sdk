import {
  KnownChainId,
  KnownRoute,
  KnownTokenId,
  XLinkSDK,
} from "@xlink-network/xlink-sdk"

export const getAvailableRoutes = async (
  xlinkSDK: XLinkSDK,
): Promise<(KnownRoute & { fromTokenName: string; toTokenName: string })[]> => {
  const routes = await _getAvailableRoutes(xlinkSDK)
  return routes.map(
    (route): KnownRoute & { fromTokenName: string; toTokenName: string } =>
      ({
        fromChain: route[0][0],
        fromToken: route[0][1],
        fromTokenName: route[0][2],
        toChain: route[1][0],
        toToken: route[1][1],
        toTokenName: route[1][2],
      }) as any,
  )
}

type ChainTokenPair = readonly [
  chain: KnownChainId.KnownChain,
  token: KnownTokenId.KnownToken,
  tokenName: string,
]

type AvailableRoute = readonly [from: ChainTokenPair, to: ChainTokenPair]

const _getAvailableRoutes = async (
  xlinkSDK: XLinkSDK,
): Promise<AvailableRoute[]> => {
  const alexBrc20 = await xlinkSDK.brc20TickToBRC20Token(
    KnownChainId.BRC20.Mainnet,
    "alex$",
  )

  const ausdBrc20 = await xlinkSDK.brc20TickToBRC20Token(
    KnownChainId.BRC20.Mainnet,
    "ausd$",
  )

  const result: [from: ChainTokenPair, to: ChainTokenPair][] = []
  if (alexBrc20 != null) {
    result.push([
      [KnownChainId.Bitcoin.Mainnet, KnownTokenId.Bitcoin.BTC, "BTC"],
      [KnownChainId.BRC20.Mainnet, alexBrc20, "alex$"],
    ])
    result.push([
      [KnownChainId.BRC20.Mainnet, alexBrc20, "alex$"],
      [KnownChainId.Bitcoin.Mainnet, KnownTokenId.Bitcoin.BTC, "BTC"],
    ])
  }
  if (ausdBrc20 != null) {
    result.push([
      [KnownChainId.Bitcoin.Mainnet, KnownTokenId.Bitcoin.BTC, "BTC"],
      [KnownChainId.BRC20.Mainnet, ausdBrc20, "ausd$"],
    ])
    result.push([
      [KnownChainId.BRC20.Mainnet, ausdBrc20, "ausd$"],
      [KnownChainId.Bitcoin.Mainnet, KnownTokenId.Bitcoin.BTC, "BTC"],
    ])
  }
  return result
}
