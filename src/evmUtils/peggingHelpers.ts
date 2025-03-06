import { unwrapResponse } from "clarity-codegen"
import { readContract } from "viem/actions"
import { getBRC20SupportedRoutes } from "../metaUtils/apiHelpers/getBRC20SupportedRoutes"
import { getRunesSupportedRoutes } from "../metaUtils/apiHelpers/getRunesSupportedRoutes"
import { contractAssignedChainIdFromKnownChain } from "../stacksUtils/crossContractDataMapping"
import { StacksContractName } from "../stacksUtils/stxContractAddresses"
import {
  executeReadonlyCallXLINK,
  getStacksContractCallInfo,
  getStacksTokenContractInfo,
  numberFromStacksContractNumber,
} from "../stacksUtils/xlinkContractHelpers"
import { BigNumber } from "../utils/BigNumber"
import { getAndCheckTransitStacksTokens } from "../utils/SwapRouteHelpers"
import {
  IsSupportedFn,
  KnownRoute_FromEVM_ToStacks,
  KnownRoute_FromStacks_ToEVM,
} from "../utils/buildSupportedRoutes"
import { props } from "../utils/promiseHelpers"
import { checkNever } from "../utils/typeHelpers"
import { TransferProphet } from "../utils/types/TransferProphet"
import {
  _allNoLongerSupportedEVMChains,
  KnownChainId,
  KnownTokenId,
} from "../utils/types/knownIds"
import {
  evmNativeCurrencyAddress,
  isStacksContractAddressEqual,
  StacksContractAddress,
} from "../xlinkSdkUtils/types"
import { SDKGlobalContext } from "../xlinkSdkUtils/types.internal"
import {
  getEVMSupportedRoutes,
  getEVMSupportedRoutesByChainType,
} from "./apiHelpers/getEVMSupportedRoutes"
import { BridgeEndpointAbi } from "./contractAbi/bridgeEndpoint"
import { BridgeRegistryAbi } from "./contractAbi/bridgeRegistry"
import {
  getEVMContractCallInfo,
  getEVMTokenContractInfo,
  numberFromSolidityContractNumber,
} from "./xlinkContractHelpers"

export const getEvm2StacksFeeInfo = async (
  ctx: SDKGlobalContext,
  route: KnownRoute_FromEVM_ToStacks,
): Promise<undefined | TransferProphet> => {
  const stacksContractCallInfo = getStacksContractCallInfo(
    route.toChain,
    StacksContractName.EVMPegInEndpoint,
  )
  const stacksSwapContractCallInfo = getStacksContractCallInfo(
    route.toChain,
    StacksContractName.EVMPegInEndpointSwap,
  )
  const evmContractCallInfo = await getEVMContractCallInfo(ctx, route.fromChain)
  const evmTokenContractCallInfo = await getEVMTokenContractInfo(
    ctx,
    route.fromChain,
    route.fromToken,
  )
  if (
    stacksContractCallInfo == null ||
    stacksSwapContractCallInfo == null ||
    evmContractCallInfo == null ||
    evmTokenContractCallInfo == null
  ) {
    return
  }

  const { client, tokenContractAddress } = evmTokenContractCallInfo

  if (tokenContractAddress === evmNativeCurrencyAddress) {
    return getEvm2StacksNativeBridgeFeeInfo(ctx, route)
  }

  const registryAddr =
    evmContractCallInfo.registryContractAddress ??
    (await readContract(client, {
      abi: BridgeEndpointAbi,
      address: evmContractCallInfo.bridgeEndpointContractAddress,
      functionName: "registry",
    }))

  const resp = await props({
    isApprovedOnEVMSide: readContract(client, {
      abi: BridgeRegistryAbi,
      address: registryAddr,
      functionName: "APPROVED_TOKEN",
    }).then(key =>
      readContract(client, {
        abi: BridgeRegistryAbi,
        address: registryAddr,
        functionName: "hasRole",
        args: [key, tokenContractAddress],
      }),
    ),
    feeRate: readContract(client, {
      abi: BridgeRegistryAbi,
      address: registryAddr,
      functionName: "feePctPerToken",
      args: [tokenContractAddress],
    }).then(numberFromSolidityContractNumber),
    minFeeAmount: readContract(client, {
      abi: BridgeRegistryAbi,
      address: registryAddr,
      functionName: "minFeePerToken",
      args: [tokenContractAddress],
    }).then(numberFromSolidityContractNumber),
    minAmount: readContract(client, {
      abi: BridgeRegistryAbi,
      address: registryAddr,
      functionName: "minAmountPerToken",
      args: [tokenContractAddress],
    }).then(numberFromSolidityContractNumber),
    maxAmount: readContract(client, {
      abi: BridgeRegistryAbi,
      address: registryAddr,
      functionName: "maxAmountPerToken",
      args: [tokenContractAddress],
    }).then(numberFromSolidityContractNumber),
    /**
     * temp fix, should be back to `stacksContractCallInfo` in the future
     */
    isPaused: executeReadonlyCallXLINK(
      stacksSwapContractCallInfo.contractName,
      "get-paused",
      {},
      stacksSwapContractCallInfo.executeOptions,
    ),
  })

  if (!resp.isApprovedOnEVMSide) return undefined

  const minAmount = BigNumber.max([resp.minAmount, resp.minFeeAmount])
  const maxAmount = BigNumber.min([resp.maxAmount])

  return {
    isPaused: resp.isPaused,
    bridgeToken: route.fromToken,
    fees: [
      {
        type: "rate",
        token: route.fromToken,
        rate: resp.feeRate,
        minimumAmount: resp.minFeeAmount,
      },
    ],
    minBridgeAmount: BigNumber.isZero(minAmount) ? null : minAmount,
    maxBridgeAmount: BigNumber.isZero(maxAmount) ? null : maxAmount,
  }
}

const getEvm2StacksNativeBridgeFeeInfo = async (
  ctx: SDKGlobalContext,
  route: KnownRoute_FromEVM_ToStacks,
): Promise<undefined | TransferProphet> => {
  const stacksContractCallInfo = getStacksContractCallInfo(
    route.toChain,
    StacksContractName.EVMPegInEndpoint,
  )
  const evmContractCallInfo = await getEVMContractCallInfo(ctx, route.fromChain)
  if (
    stacksContractCallInfo == null ||
    evmContractCallInfo?.nativeBridgeEndpointContractAddress == null
  ) {
    return
  }

  const resp = await props({
    isPaused: executeReadonlyCallXLINK(
      stacksContractCallInfo.contractName,
      "get-paused",
      {},
      stacksContractCallInfo.executeOptions,
    ),
  })

  return {
    isPaused: resp.isPaused,
    bridgeToken: route.fromToken,
    fees: [],
    minBridgeAmount: null,
    maxBridgeAmount: null,
  }
}

export const getStacks2EvmFeeInfo = async (
  ctx: SDKGlobalContext,
  route: KnownRoute_FromStacks_ToEVM,
  options: {
    toDexAggregator: boolean
  },
): Promise<undefined | TransferProphet> => {
  const stacksBaseContractCallInfo = getStacksContractCallInfo(
    route.fromChain,
    StacksContractName.EVMPegOutEndpoint,
  )
  const stacksAggContractCallInfo = getStacksContractCallInfo(
    route.fromChain,
    StacksContractName.EVMPegOutEndpointAggregator,
  )
  const stacksTokenContractCallInfo = await getStacksTokenContractInfo(
    ctx,
    route.fromChain,
    route.fromToken,
  )
  const toChainId = contractAssignedChainIdFromKnownChain(route.toChain)
  if (
    stacksBaseContractCallInfo == null ||
    stacksAggContractCallInfo == null ||
    stacksTokenContractCallInfo == null
  ) {
    return
  }

  const stacksContractCallInfo = options.toDexAggregator
    ? stacksAggContractCallInfo
    : stacksBaseContractCallInfo

  const terminatingStacksTokenAddress =
    (await getTerminatingStacksTokenContractAddress(ctx, {
      evmChain: route.toChain,
      evmToken: route.toToken,
      stacksChain: route.fromChain,
    })) ?? stacksTokenContractCallInfo

  const tokenConf = await Promise.all([
    executeReadonlyCallXLINK(
      stacksContractCallInfo.contractName,
      "get-approved-pair-or-fail",
      {
        pair: {
          token: `${terminatingStacksTokenAddress.deployerAddress}.${terminatingStacksTokenAddress.contractName}`,
          "chain-id": toChainId,
        },
      },
      stacksContractCallInfo.executeOptions,
    ),
    executeReadonlyCallXLINK(
      stacksContractCallInfo.contractName,
      "get-paused",
      {},
      stacksContractCallInfo.executeOptions,
    ),
  ]).then(([resp, isPaused]) => {
    if (resp.type !== "success") return undefined

    return {
      ...unwrapResponse(resp),
      isPaused,
    }
  })

  if (tokenConf == null) return undefined

  const feeRate = numberFromStacksContractNumber(tokenConf.fee)
  const minFee = numberFromStacksContractNumber(tokenConf["min-fee"])
  const reserve = numberFromStacksContractNumber(tokenConf.reserve)

  const minAmount = BigNumber.max([
    numberFromStacksContractNumber(tokenConf["min-amount"]),
    minFee,
  ])
  const maxAmount = BigNumber.min([
    numberFromStacksContractNumber(tokenConf["max-amount"]),
    reserve,
  ])

  return {
    isPaused: tokenConf.isPaused || tokenConf.approved === false,
    bridgeToken: route.fromToken,
    fees: [
      {
        type: "rate",
        token: route.fromToken,
        rate: feeRate,
        minimumAmount: minFee,
      },
    ],
    minBridgeAmount: BigNumber.isZero(minAmount) ? null : minAmount,
    maxBridgeAmount: maxAmount,
  }
}

export const isSupportedEVMRoute: IsSupportedFn = async (ctx, route) => {
  const { fromChain, fromToken, toChain, toToken } = route

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
    !KnownChainId.isEVMChain(fromChain) ||
    !KnownTokenId.isEVMToken(fromToken)
  ) {
    return false
  }

  const fromContractInfo = await getEVMContractCallInfo(ctx, fromChain)
  if (fromContractInfo == null) return false

  const fromTokenInfo = await getEVMTokenContractInfo(ctx, fromChain, fromToken)
  if (fromTokenInfo == null) return false

  if (fromTokenInfo.tokenContractAddress === evmNativeCurrencyAddress) {
    if (fromContractInfo.bridgeEndpointContractAddress == null) return false
    if (!KnownChainId.isBitcoinChain(toChain)) return false
  }

  const headAndTailStacksTokens = await getAndCheckTransitStacksTokens(ctx, {
    ...route,
    fromChain,
    fromToken,
    toChain: toChain as any,
    toToken: toToken as any,
  })
  if (headAndTailStacksTokens == null) return false
  const { firstStepToStacksToken, lastStepFromStacksToken } =
    headAndTailStacksTokens

  // evm -> stacks
  if (KnownChainId.isStacksChain(toChain)) {
    if (!KnownTokenId.isStacksToken(toToken)) return false

    const evmRoutes = await getEVMSupportedRoutes(ctx, fromChain)
    return evmRoutes.some(
      route => route.evmToken === fromToken && route.stacksToken === toToken,
    )
  }

  // evm -> evm
  if (KnownChainId.isEVMChain(toChain)) {
    if (!KnownTokenId.isEVMToken(toToken)) return false

    const fromRoutes = await getEVMSupportedRoutes(ctx, fromChain)
    const toRoutes = await getEVMSupportedRoutes(ctx, toChain)

    return (
      fromRoutes.some(
        route =>
          route.evmToken === fromToken &&
          route.stacksToken === firstStepToStacksToken,
      ) &&
      toRoutes.some(
        route =>
          route.evmToken === toToken &&
          route.stacksToken === lastStepFromStacksToken,
      )
    )
  }

  // evm -> btc
  if (KnownChainId.isBitcoinChain(toChain)) {
    if (!KnownTokenId.isBitcoinToken(toToken)) return false

    return toToken === KnownTokenId.Bitcoin.BTC
  }

  // evm -> brc20
  if (KnownChainId.isBRC20Chain(toChain)) {
    if (!KnownTokenId.isBRC20Token(toToken)) return false

    const fromRoutes = await getEVMSupportedRoutes(ctx, fromChain)
    const toRoutes = await getBRC20SupportedRoutes(ctx, toChain)

    return (
      fromRoutes.some(
        route =>
          route.evmToken === fromToken &&
          route.stacksToken === firstStepToStacksToken,
      ) &&
      toRoutes.some(
        route =>
          route.stacksToken === lastStepFromStacksToken &&
          route.brc20Token === toToken,
      )
    )
  }

  // evm -> runes
  if (KnownChainId.isRunesChain(toChain)) {
    if (!KnownTokenId.isRunesToken(toToken)) return false

    const fromRoutes = await getEVMSupportedRoutes(ctx, fromChain)
    const toRoutes = await getRunesSupportedRoutes(ctx, toChain)

    return (
      fromRoutes.some(
        route =>
          route.evmToken === fromToken &&
          route.stacksToken === firstStepToStacksToken,
      ) &&
      toRoutes.some(
        route =>
          route.stacksToken === lastStepFromStacksToken &&
          route.runesToken === toToken,
      )
    )
  }

  checkNever(toChain)
  return false
}

export async function evmTokenFromCorrespondingStacksToken(
  sdkContext: SDKGlobalContext,
  toChain: KnownChainId.EVMChain,
  fromStacksToken: KnownTokenId.StacksToken,
): Promise<KnownTokenId.EVMToken[]> {
  const supportedRoutes = await getEVMSupportedRoutes(sdkContext, toChain)
  return supportedRoutes.reduce(
    (acc, route) =>
      route.stacksToken === fromStacksToken ? [...acc, route.evmToken] : acc,
    [] as KnownTokenId.EVMToken[],
  )
}
export async function evmTokenToCorrespondingStacksToken(
  sdkContext: SDKGlobalContext,
  fromChain: KnownChainId.EVMChain,
  fromEVMToken: KnownTokenId.EVMToken,
): Promise<undefined | KnownTokenId.StacksToken> {
  const supportedRoutes = await getEVMSupportedRoutes(sdkContext, fromChain)
  return supportedRoutes.find(route => route.evmToken === fromEVMToken)
    ?.stacksToken
}

export const getTerminatingStacksTokenContractAddress = async (
  sdkContext: SDKGlobalContext,
  info: {
    evmChain: KnownChainId.EVMChain
    evmToken: KnownTokenId.EVMToken
    stacksChain: KnownChainId.StacksChain
  },
): Promise<undefined | StacksContractAddress> => {
  const supportedRoutes = await getEVMSupportedRoutes(sdkContext, info.evmChain)

  return (
    supportedRoutes.find(r => r.evmToken === info.evmToken)
      ?.proxyStacksTokenContractAddress ?? undefined
  )
}

export const getStacksTokenFromTerminatingStacksTokenContractAddress = async (
  sdkContext: SDKGlobalContext,
  info: {
    stacksChain: KnownChainId.StacksChain
    stacksTokenAddress: StacksContractAddress
  },
): Promise<undefined | KnownTokenId.StacksToken> => {
  const routes = await getEVMSupportedRoutesByChainType(
    sdkContext,
    info.stacksChain === KnownChainId.Stacks.Mainnet ? "mainnet" : "testnet",
  )

  return (
    routes.find(r =>
      r.proxyStacksTokenContractAddress == null
        ? false
        : isStacksContractAddressEqual(
            r.proxyStacksTokenContractAddress,
            info.stacksTokenAddress,
          ),
    )?.stacksToken ?? undefined
  )
}

export const getEVMTokenFromTerminatingStacksTokenContractAddress = async (
  sdkContext: SDKGlobalContext,
  info: {
    evmChain: KnownChainId.EVMChain
    stacksChain: KnownChainId.StacksChain
    stacksTokenAddress: StacksContractAddress
  },
): Promise<undefined | KnownTokenId.EVMToken> => {
  const supportedRoutes = await getEVMSupportedRoutes(sdkContext, info.evmChain)

  return (
    supportedRoutes.find(r =>
      r.proxyStacksTokenContractAddress == null
        ? false
        : isStacksContractAddressEqual(
            r.proxyStacksTokenContractAddress,
            info.stacksTokenAddress,
          ),
    )?.evmToken ?? undefined
  )
}
