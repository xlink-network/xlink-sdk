import { unwrapResponse } from "clarity-codegen"
import { readContract } from "viem/actions"
import {
  getBRC20SupportedRoutes,
  getRunesSupportedRoutes,
} from "../metaUtils/xlinkContractHelpers"
import { contractAssignedChainIdFromKnownChain } from "../stacksUtils/crossContractDataMapping"
import {
  getTerminatingStacksTokenContractAddress,
  StacksContractName,
} from "../stacksUtils/stxContractAddresses"
import {
  executeReadonlyCallXLINK,
  getStacksContractCallInfo,
  getStacksTokenContractInfo,
  numberFromStacksContractNumber,
} from "../stacksUtils/xlinkContractHelpers"
import { BigNumber } from "../utils/BigNumber"
import {
  IsSupportedFn,
  KnownRoute_FromEVM_ToStacks,
  KnownRoute_FromStacks_ToEVM,
} from "../utils/buildSupportedRoutes"
import { props } from "../utils/promiseHelpers"
import { assertExclude, checkNever } from "../utils/typeHelpers"
import { TransferProphet } from "../utils/types/TransferProphet"
import {
  _allNoLongerSupportedEVMChains,
  KnownChainId,
  KnownTokenId,
} from "../utils/types/knownIds"
import { SDKGlobalContext } from "../xlinkSdkUtils/types.internal"
import { nativeCurrencyAddress } from "./addressHelpers"
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

  if (evmTokenContractCallInfo.tokenContractAddress === nativeCurrencyAddress) {
    return getEvm2StacksNativeBridgeFeeInfo(ctx, route)
  }

  const { client, tokenContractAddress } = evmTokenContractCallInfo

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
): Promise<undefined | TransferProphet> => {
  const stacksContractCallInfo = getStacksContractCallInfo(
    route.fromChain,
    StacksContractName.EVMPegOutEndpoint,
  )
  const stacksTokenContractCallInfo = await getStacksTokenContractInfo(
    ctx,
    route.fromChain,
    route.fromToken,
  )
  const toChainId = contractAssignedChainIdFromKnownChain(route.toChain)
  if (stacksContractCallInfo == null || stacksTokenContractCallInfo == null) {
    return
  }

  const terminatingStacksTokenAddress =
    getTerminatingStacksTokenContractAddress(route) ??
    stacksTokenContractCallInfo

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

export async function evmTokenFromCorrespondingStacksToken(
  toChain: KnownChainId.EVMChain,
  stacksToken: KnownTokenId.StacksToken,
): Promise<KnownTokenId.EVMToken[]> {
  const EVMToken = KnownTokenId.EVM
  const StacksToken = KnownTokenId.Stacks

  const restEVMTokenPossibilities = assertExclude.i<KnownTokenId.EVMToken>()

  if (stacksToken === StacksToken.sLUNR) {
    return [EVMToken.LUNR]
  }
  assertExclude(restEVMTokenPossibilities, EVMToken.LUNR)

  if (stacksToken === StacksToken.ALEX) {
    return [EVMToken.ALEX]
  }
  assertExclude(restEVMTokenPossibilities, EVMToken.ALEX)

  if (stacksToken === StacksToken.sSKO) {
    return [EVMToken.SKO]
  }
  assertExclude(restEVMTokenPossibilities, EVMToken.SKO)

  if (stacksToken === StacksToken.vLiSTX) {
    return [EVMToken.vLiSTX]
  }
  assertExclude(restEVMTokenPossibilities, EVMToken.vLiSTX)

  if (stacksToken === StacksToken.vLiALEX) {
    return [EVMToken.vLiALEX]
  }
  assertExclude(restEVMTokenPossibilities, EVMToken.vLiALEX)

  if (stacksToken === StacksToken.sUSDT) {
    return [EVMToken.sUSDT, EVMToken.USDT, EVMToken.USDC]
  }
  assertExclude(restEVMTokenPossibilities, EVMToken.sUSDT)
  assertExclude(restEVMTokenPossibilities, EVMToken.USDT)
  assertExclude(restEVMTokenPossibilities, EVMToken.USDC)
  if (stacksToken === StacksToken.aBTC) {
    return [EVMToken.aBTC, EVMToken.WBTC, EVMToken.BTCB, EVMToken.cbBTC]
  }
  assertExclude(restEVMTokenPossibilities, EVMToken.aBTC)
  assertExclude(restEVMTokenPossibilities, EVMToken.WBTC)
  assertExclude(restEVMTokenPossibilities, EVMToken.BTCB)
  assertExclude(restEVMTokenPossibilities, EVMToken.cbBTC)

  if (stacksToken === StacksToken.uBTC) {
    return [EVMToken.uBTC, EVMToken.wuBTC]
  }
  assertExclude(restEVMTokenPossibilities, EVMToken.uBTC)
  assertExclude(restEVMTokenPossibilities, EVMToken.wuBTC)

  if (stacksToken === StacksToken.DB20) {
    return [EVMToken.DB20]
  }
  assertExclude(restEVMTokenPossibilities, EVMToken.DB20)

  if (stacksToken === StacksToken.DOG) {
    return [EVMToken.DOG]
  }
  assertExclude(restEVMTokenPossibilities, EVMToken.DOG)

  if (stacksToken === StacksToken.STX) {
    return [EVMToken.STX]
  }
  assertExclude(restEVMTokenPossibilities, EVMToken.STX)

  if (stacksToken === StacksToken.TRUMP) {
    return [EVMToken.TRUMP]
  }
  assertExclude(restEVMTokenPossibilities, EVMToken.TRUMP)

  checkNever(restEVMTokenPossibilities)
  return []
}
export async function evmTokenToCorrespondingStacksToken(
  evmToken: KnownTokenId.EVMToken,
): Promise<undefined | KnownTokenId.StacksToken> {
  const EVMToken = KnownTokenId.EVM
  const StacksToken = KnownTokenId.Stacks

  switch (evmToken) {
    case EVMToken.LUNR:
      return StacksToken.sLUNR
    case EVMToken.ALEX:
      return StacksToken.ALEX
    case EVMToken.SKO:
      return StacksToken.sSKO
    case EVMToken.vLiSTX:
      return StacksToken.vLiSTX
    case EVMToken.vLiALEX:
      return StacksToken.vLiALEX
    case EVMToken.sUSDT:
    case EVMToken.USDT:
    case EVMToken.USDC:
      return StacksToken.sUSDT
    case EVMToken.aBTC:
    case EVMToken.BTCB:
    case EVMToken.WBTC:
    case EVMToken.cbBTC:
      return StacksToken.aBTC
    case EVMToken.uBTC:
    case EVMToken.wuBTC:
      return StacksToken.uBTC
    case EVMToken.DB20:
      return StacksToken.DB20
    case EVMToken.DOG:
      return StacksToken.DOG
    case EVMToken.STX:
      return StacksToken.STX
    case EVMToken.TRUMP:
      return StacksToken.TRUMP
    default:
      checkNever(evmToken)
      return
  }
}

export const isSupportedEVMRoute: IsSupportedFn = async (ctx, route) => {
  const { fromChain, fromToken, toChain, toToken } = route

  if (fromChain === toChain && fromToken === toToken) {
    return false
  }

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

  if (
    !KnownChainId.isEVMChain(fromChain) ||
    !KnownTokenId.isEVMToken(fromToken)
  ) {
    return false
  }
  if (!KnownChainId.isKnownChain(toChain)) return false

  const fromContractInfo = await getEVMContractCallInfo(ctx, fromChain)
  if (fromContractInfo == null) return false

  const fromTokenInfo = await getEVMTokenContractInfo(ctx, fromChain, fromToken)
  if (fromTokenInfo == null) return false

  if (fromTokenInfo.tokenContractAddress === nativeCurrencyAddress) {
    if (fromContractInfo.bridgeEndpointContractAddress == null) return false
    if (!KnownChainId.isBitcoinChain(toChain)) return false
  }

  if (KnownChainId.isStacksChain(toChain)) {
    if (!KnownTokenId.isStacksToken(toToken)) return false

    const stacksToken = await evmTokenToCorrespondingStacksToken(fromToken)
    if (stacksToken == null) return false

    const stacksTokenContractInfo = await getStacksTokenContractInfo(
      ctx,
      toChain,
      stacksToken,
    )
    if (stacksTokenContractInfo == null) return false

    return stacksToken === toToken
  }

  if (KnownChainId.isEVMChain(toChain)) {
    if (!KnownTokenId.isEVMToken(toToken)) return false

    const toTokenInfo = await getEVMTokenContractInfo(ctx, toChain, toToken)
    if (toTokenInfo == null) return false

    const transitStacksToken =
      await evmTokenToCorrespondingStacksToken(fromToken)
    if (transitStacksToken == null) return false

    const toEVMTokens = await evmTokenFromCorrespondingStacksToken(
      toChain,
      transitStacksToken,
    )
    return toEVMTokens.includes(toToken)
  }

  if (KnownChainId.isBitcoinChain(toChain)) {
    if (!KnownTokenId.isBitcoinToken(toToken)) return false
    const stacksToken = await evmTokenToCorrespondingStacksToken(fromToken)
    return stacksToken === KnownTokenId.Stacks.aBTC
  }

  if (KnownChainId.isRunesChain(toChain)) {
    if (!KnownTokenId.isRunesToken(toToken)) return false

    const transitStacksToken =
      await evmTokenToCorrespondingStacksToken(fromToken)
    if (transitStacksToken == null) return false

    const runesRoutes = await getRunesSupportedRoutes(ctx, toChain)
    return runesRoutes.some(route => route.stacksToken === transitStacksToken)
  }

  if (KnownChainId.isBRC20Chain(toChain)) {
    if (!KnownTokenId.isBRC20Token(toToken)) return false

    const transitStacksToken =
      await evmTokenToCorrespondingStacksToken(fromToken)
    if (transitStacksToken == null) return false

    const brc20Routes = await getBRC20SupportedRoutes(ctx, toChain)
    return brc20Routes.some(route => route.stacksToken === transitStacksToken)
  }

  checkNever(toChain)
  return false
}
