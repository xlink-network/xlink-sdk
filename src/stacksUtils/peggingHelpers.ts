import { getEVMSupportedRoutes } from "../evmUtils/apiHelpers/getEVMSupportedRoutes"
import { getBRC20SupportedRoutes } from "../metaUtils/apiHelpers/getBRC20SupportedRoutes"
import { getRunesSupportedRoutes } from "../metaUtils/apiHelpers/getRunesSupportedRoutes"
import { IsSupportedFn } from "../utils/buildSupportedRoutes"
import { checkNever } from "../utils/typeHelpers"
import {
  _allNoLongerSupportedEVMChains,
  KnownChainId,
  KnownTokenId,
} from "../utils/types/knownIds"

export const isSupportedStacksRoute: IsSupportedFn = async (ctx, route) => {
  const { fromChain, toChain, fromToken, toToken } = route

  if (fromChain === toChain && fromToken === toToken) {
    return false
  }

  if (!KnownChainId.isKnownChain(toChain)) return false

  if (
    (KnownChainId.isEVMChain(fromChain) &&
      _allNoLongerSupportedEVMChains.includes(fromChain)) ||
    (KnownChainId.isEVMChain(toChain) &&
      _allNoLongerSupportedEVMChains.includes(toChain))
  ) {
    return false
  }

  if (
    !KnownChainId.isStacksChain(fromChain) ||
    !KnownTokenId.isStacksToken(fromToken)
  ) {
    return false
  }

  if (KnownChainId.isStacksChain(toChain)) {
    return false
  }

  if (KnownChainId.isEVMChain(toChain)) {
    if (!KnownTokenId.isEVMToken(toToken)) return false

    const supportedRoutes = await getEVMSupportedRoutes(ctx, toChain)

    return supportedRoutes.some(
      route => route.stacksToken === fromToken && route.evmToken === toToken,
    )
  }

  if (KnownChainId.isBitcoinChain(toChain)) {
    if (!KnownTokenId.isBitcoinToken(toToken)) return false

    return (
      fromToken === KnownTokenId.Stacks.aBTC &&
      toToken === KnownTokenId.Bitcoin.BTC
    )
  }

  if (KnownChainId.isRunesChain(toChain)) {
    if (!KnownTokenId.isRunesToken(toToken)) return false

    const supportedRoutes = await getRunesSupportedRoutes(ctx, toChain)

    return supportedRoutes.some(
      route => route.stacksToken === fromToken && route.runesToken === toToken,
    )
  }

  if (KnownChainId.isBRC20Chain(toChain)) {
    if (!KnownTokenId.isBRC20Token(toToken)) return false

    const supportedRoutes = await getBRC20SupportedRoutes(ctx, toChain)

    return supportedRoutes.some(
      route => route.stacksToken === fromToken && route.brc20Token === toToken,
    )
  }

  checkNever(toChain)
  return false
}
