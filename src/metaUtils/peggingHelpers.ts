import { toCorrespondingStacksToken } from "../evmUtils/peggingHelpers"
import { getEVMTokenContractInfo } from "../evmUtils/xlinkContractHelpers"
import { BigNumber } from "../utils/BigNumber"
import {
  _KnownRoute_FromBRC20_ToStacks,
  _KnownRoute_FromRunes_ToStacks,
  IsSupportedFn,
  KnownRoute_FromStacks_ToBRC20,
  KnownRoute_FromStacks_ToRunes,
} from "../utils/buildSupportedRoutes"
import { checkNever, isNotNull } from "../utils/typeHelpers"
import { TransferProphet } from "../utils/types/TransferProphet"
import {
  _allNoLongerSupportedEVMChains,
  KnownChainId,
  KnownTokenId,
} from "../utils/types/knownIds"
import { SDKGlobalContext } from "../xlinkSdkUtils/types.internal"
import { getMetaPegInAddress } from "./btcAddresses"
import {
  BRC20SupportedRoute,
  getBRC20SupportedRoutes,
  getRunesSupportedRoutes,
  RunesSupportedRoute,
} from "./xlinkContractHelpers"

export const getMeta2StacksFeeInfo = async (
  ctx: SDKGlobalContext,
  route: _KnownRoute_FromBRC20_ToStacks | _KnownRoute_FromRunes_ToStacks,
): Promise<undefined | TransferProphet> => {
  const filteredRoutes = KnownChainId.isBRC20Chain(route.fromChain)
    ? await getBRC20SupportedRoutes(ctx, route.fromChain).then(routes =>
        routes.filter(
          _route =>
            _route.brc20Token === route.fromToken &&
            _route.stacksToken === route.toToken,
        ),
      )
    : await getRunesSupportedRoutes(ctx, route.fromChain).then(routes =>
        routes.filter(
          _route =>
            _route.runesToken === route.fromToken &&
            _route.stacksToken === route.toToken,
        ),
      )
  const filteredRoute = filteredRoutes[0]
  if (filteredRoute == null) return

  return {
    isPaused: filteredRoute.pegInPaused,
    bridgeToken: route.fromToken,
    fees: [
      {
        type: "rate" as const,
        token: route.fromToken,
        rate: filteredRoute.pegInFeeRate,
        minimumAmount: BigNumber.ZERO,
      },
      filteredRoute.pegInFeeBitcoinAmount == null
        ? null
        : {
            type: "fixed" as const,
            token: KnownTokenId.Stacks.aBTC,
            amount: filteredRoute.pegInFeeBitcoinAmount,
          },
    ].filter(isNotNull),
    minBridgeAmount: BigNumber.ZERO,
    maxBridgeAmount: null,
  }
}

export const getStacks2MetaFeeInfo = async (
  ctx: SDKGlobalContext,
  route: KnownRoute_FromStacks_ToBRC20 | KnownRoute_FromStacks_ToRunes,
): Promise<undefined | TransferProphet> => {
  const filteredRoutes = KnownChainId.isBRC20Chain(route.toChain)
    ? await getBRC20SupportedRoutes(ctx, route.toChain).then(routes =>
        routes.filter(
          _route =>
            _route.stacksToken === route.fromToken &&
            _route.brc20Token === route.toToken,
        ),
      )
    : await getRunesSupportedRoutes(ctx, route.toChain).then(routes =>
        routes.filter(
          _route =>
            _route.stacksToken === route.fromToken &&
            _route.runesToken === route.toToken,
        ),
      )
  const filteredRoute = filteredRoutes[0]
  if (filteredRoute == null) return

  return {
    isPaused: filteredRoute.pegOutPaused,
    bridgeToken: route.fromToken,
    fees: [
      {
        type: "rate" as const,
        token: route.fromToken,
        rate: filteredRoute.pegOutFeeRate,
        minimumAmount: BigNumber.ZERO,
      },
      filteredRoute.pegOutFeeBitcoinAmount == null
        ? null
        : {
            type: "fixed" as const,
            token: KnownTokenId.Stacks.aBTC,
            amount: filteredRoute.pegOutFeeBitcoinAmount,
          },
    ].filter(isNotNull),
    minBridgeAmount: BigNumber.ZERO,
    maxBridgeAmount: null,
  }
}

export const isSupportedMetaRoute: IsSupportedFn = async (ctx, route) => {
  const { fromChain, toChain, fromToken, toToken } = route

  if (fromChain === toChain && fromToken === toToken) {
    return false
  }

  if (!KnownChainId.isKnownChain(toChain)) return false

  if (
    KnownChainId.isEVMChain(fromChain) &&
    _allNoLongerSupportedEVMChains.includes(fromChain)
  ) {
    return false
  }
  if (
    KnownChainId.isEVMChain(toChain) &&
    _allNoLongerSupportedEVMChains.includes(toChain)
  ) {
    return false
  }

  if (KnownChainId.isBitcoinChain(toChain)) {
    return false
  }

  if (
    !KnownChainId.isRunesChain(fromChain) &&
    !KnownChainId.isBRC20Chain(fromChain)
  ) {
    return false
  }

  const pegInAddress = getMetaPegInAddress(fromChain, toChain)
  if (pegInAddress == null) return false

  if (KnownChainId.isBitcoinChain(toChain)) {
    return false
  }

  if (KnownChainId.isStacksChain(toChain)) {
    if (!KnownTokenId.isStacksToken(toToken)) return false

    if (KnownChainId.isRunesChain(fromChain)) {
      const runesRoutes = await getRunesSupportedRoutes(ctx, fromChain)
      return runesRoutes.some(route => route.stacksToken === toToken)
    }

    if (KnownChainId.isBRC20Chain(fromChain)) {
      const brc20Routes = await getBRC20SupportedRoutes(ctx, fromChain)
      return brc20Routes.some(route => route.stacksToken === toToken)
    }

    checkNever(fromChain)
    return false
  }

  if (KnownChainId.isEVMChain(toChain)) {
    if (!KnownTokenId.isEVMToken(toToken)) return false

    const info = await getEVMTokenContractInfo(ctx, toChain, toToken)
    if (info == null) return false

    const transitStacksToken = await toCorrespondingStacksToken(toToken)
    if (transitStacksToken == null) return false

    if (KnownChainId.isRunesChain(fromChain)) {
      const runesRoutes = await getRunesSupportedRoutes(ctx, fromChain)
      return runesRoutes.some(route => route.stacksToken === transitStacksToken)
    }

    if (KnownChainId.isBRC20Chain(fromChain)) {
      const brc20Routes = await getBRC20SupportedRoutes(ctx, fromChain)
      return brc20Routes.some(route => route.stacksToken === transitStacksToken)
    }

    checkNever(fromChain)
    return false
  }

  if (KnownChainId.isRunesChain(toChain)) {
    if (!KnownTokenId.isRunesToken(toToken)) return false

    // TODO: runes -> runes (swap) is not supported yet
    if (KnownChainId.isRunesChain(fromChain)) return false

    const brc20Routes = await getBRC20SupportedRoutes(ctx, fromChain)
    const runesRoutes = await getRunesSupportedRoutes(ctx, toChain)
    return getRoutesOverlapping(brc20Routes, runesRoutes) != null
  }

  if (KnownChainId.isBRC20Chain(toChain)) {
    if (!KnownTokenId.isBRC20Token(toToken)) return false

    // TODO: brc20 -> brc20 (swap) is not supported yet
    if (KnownChainId.isBRC20Chain(fromChain)) return false

    const brc20Routes = await getBRC20SupportedRoutes(ctx, toChain)
    const runesRoutes = await getRunesSupportedRoutes(ctx, fromChain)
    return getRoutesOverlapping(brc20Routes, runesRoutes) != null
  }

  checkNever(toChain)
  return false
}

const getRoutesOverlapping = (
  brc20Routes: BRC20SupportedRoute[],
  runesRoutes: RunesSupportedRoute[],
): null | [BRC20SupportedRoute, RunesSupportedRoute] => {
  for (const brc20Route of brc20Routes) {
    for (const runesRoute of runesRoutes) {
      if (brc20Route.stacksToken === runesRoute.stacksToken) {
        return [brc20Route, runesRoute]
      }
    }
  }
  return null
}

export async function metaTokenToCorrespondingStacksToken(
  ctx: SDKGlobalContext,
  route:
    | { chain: KnownChainId.BRC20Chain; token: KnownTokenId.BRC20Token }
    | { chain: KnownChainId.RunesChain; token: KnownTokenId.RunesToken },
): Promise<undefined | KnownTokenId.StacksToken> {
  if (KnownChainId.isBRC20Chain(route.chain)) {
    const routes = await getBRC20SupportedRoutes(ctx, route.chain)
    return routes.find(r => r.brc20Token === route.token)?.stacksToken
  } else if (KnownChainId.isRunesChain(route.chain)) {
    const routes = await getRunesSupportedRoutes(ctx, route.chain)
    return routes.find(r => r.runesToken === route.token)?.stacksToken
  } else {
    checkNever(route.chain)
    return
  }
}
