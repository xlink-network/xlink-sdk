import { fromCorrespondingStacksCurrency } from "../evmUtils/peggingHelpers"
import { getEVMTokenContractInfo } from "../evmUtils/xlinkContractHelpers"
import { IsSupportedFn } from "../utils/buildSupportedRoutes"
import { checkNever } from "../utils/typeHelpers"
import { KnownChainId, KnownTokenId } from "../utils/types/knownIds"

export const isSupportedStacksRoute: IsSupportedFn = async (ctx, route) => {
  if (route.fromChain === route.toChain && route.fromToken === route.toToken) {
    return false
  }
  if (
    !KnownChainId.isStacksChain(route.fromChain) ||
    !KnownTokenId.isStacksToken(route.fromToken)
  ) {
    return false
  }
  if (!KnownChainId.isKnownChain(route.toChain)) return false

  if (KnownChainId.isStacksChain(route.toChain)) {
    return false
  }

  if (KnownChainId.isBitcoinChain(route.toChain)) {
    return (
      route.fromToken === KnownTokenId.Stacks.aBTC &&
      route.toToken === KnownTokenId.Bitcoin.BTC
    )
  }

  if (KnownChainId.isEVMChain(route.toChain)) {
    const toEVMToken = await fromCorrespondingStacksCurrency(
      route.toChain,
      route.fromToken,
    )
    if (toEVMToken == null) return false

    const toTokenInfo = await getEVMTokenContractInfo(
      ctx,
      route.toChain,
      toEVMToken,
    )
    if (toTokenInfo == null) return false

    return toEVMToken === route.toToken
  }

  checkNever(route.toChain)
  return false
}
