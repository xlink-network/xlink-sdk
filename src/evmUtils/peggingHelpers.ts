import { callReadOnlyFunction } from "@stacks/transactions"
import { CallReadOnlyFunctionFn, unwrapResponse } from "clarity-codegen"
import { readContract } from "viem/actions"
import { contractAssignedChainIdFromKnownChain } from "../stacksUtils/crossContractDataMapping"
import { stxTokenContractAddresses } from "../stacksUtils/stxContractAddresses"
import {
  executeReadonlyCallXLINK,
  getStacksContractCallInfo,
  getStacksTokenContractInfo,
  numberFromStacksContractNumber,
} from "../stacksUtils/xlinkContractHelpers"
import { BigNumber } from "../utils/BigNumber"
import { IsSupportedFn } from "../utils/buildSupportedRoutes"
import { TransferProphet } from "../utils/types/TransferProphet"
import { KnownChainId, KnownTokenId } from "../utils/types/knownIds"
import { props } from "../utils/promiseHelpers"
import { assertExclude, checkNever, isNotNull } from "../utils/typeHelpers"
import { BridgeEndpointAbi } from "./contractAbi/bridgeEndpoint"
import { BridgeRegistryAbi } from "./contractAbi/bridgeRegistry"
import {
  getEVMContractCallInfo,
  getEVMTokenContractInfo,
  numberFromSolidityContractNumber,
} from "./xlinkContractHelpers"
import { SDKGlobalContext } from "../xlinkSdkUtils/types.internal"
import { hasAny } from "../utils/arrayHelpers"

export const getEvm2StacksFeeInfo = async (
  ctx: SDKGlobalContext,
  route: {
    fromChain: KnownChainId.EVMChain
    fromToken: KnownTokenId.EVMToken
    toChain: KnownChainId.StacksChain
    toToken: KnownTokenId.StacksToken
  },
): Promise<undefined | TransferProphet> => {
  const stacksContractCallInfo = getStacksContractCallInfo(route.toChain)
  const evmContractCallInfo = await getEVMContractCallInfo(ctx, route.fromChain)
  const evmTokenContractCallInfo = await getEVMTokenContractInfo(
    ctx,
    route.fromChain,
    route.fromToken,
  )
  if (
    stacksContractCallInfo == null ||
    evmContractCallInfo == null ||
    evmTokenContractCallInfo == null
  ) {
    return
  }

  const executeOptions = {
    deployerAddress: stacksContractCallInfo.deployerAddress,
    callReadOnlyFunction: (callOptions =>
      callReadOnlyFunction({
        ...callOptions,
        network: stacksContractCallInfo.network,
      })) satisfies CallReadOnlyFunctionFn,
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
    isApproved: readContract(client, {
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
    isPaused: executeReadonlyCallXLINK(
      "cross-peg-in-endpoint-v2-01",
      "get-paused",
      {},
      executeOptions,
    ),
  })

  if (!resp.isApproved) return undefined

  const minAmount = BigNumber.max([resp.minAmount, resp.minFeeAmount])

  const maxAmount = BigNumber.min([resp.maxAmount])

  return {
    isPaused: resp.isPaused,
    feeRate: resp.feeRate,
    feeToken: route.fromToken,
    minFeeAmount: resp.minFeeAmount,
    minBridgeAmount: BigNumber.isZero(minAmount) ? null : minAmount,
    maxBridgeAmount: BigNumber.isZero(maxAmount) ? null : maxAmount,
  }
}

export const getStacks2EvmFeeInfo = async (route: {
  fromChain: KnownChainId.StacksChain
  fromToken: KnownTokenId.StacksToken
  toChain: KnownChainId.EVMChain
  toToken: KnownTokenId.EVMToken
}): Promise<undefined | TransferProphet> => {
  const stacksContractCallInfo = getStacksContractCallInfo(route.fromChain)
  const stacksTokenContractCallInfo = getStacksTokenContractInfo(
    route.fromChain,
    route.fromToken,
  )
  const toChainId = contractAssignedChainIdFromKnownChain(route.toChain)
  if (stacksContractCallInfo == null || stacksTokenContractCallInfo == null) {
    return
  }

  const executeOptions = {
    deployerAddress: stacksContractCallInfo.deployerAddress,
    callReadOnlyFunction: (callOptions =>
      callReadOnlyFunction({
        ...callOptions,
        network: stacksContractCallInfo.network,
      })) satisfies CallReadOnlyFunctionFn,
  }

  const tokenConf = await Promise.all([
    executeReadonlyCallXLINK(
      "cross-peg-out-endpoint-v2-01",
      "get-approved-pair-or-fail",
      {
        pair: {
          token: `${stacksTokenContractCallInfo.deployerAddress}.${stacksTokenContractCallInfo.contractName}`,
          "chain-id": toChainId,
        },
      },
      executeOptions,
    ),
    executeReadonlyCallXLINK(
      "cross-peg-out-endpoint-v2-01",
      "get-paused",
      {},
      executeOptions,
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
    feeToken: route.fromToken,
    feeRate,
    minFeeAmount: minFee,
    minBridgeAmount: BigNumber.isZero(minAmount) ? null : minAmount,
    maxBridgeAmount: BigNumber.isZero(maxAmount) ? null : maxAmount,
  }
}

export async function fromCorrespondingStacksCurrency(
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
    return [EVMToken.USDT, EVMToken.sUSDT]
  }
  assertExclude(restEVMTokenPossibilities, EVMToken.USDT)
  assertExclude(restEVMTokenPossibilities, EVMToken.sUSDT)

  if (stacksToken === StacksToken.aBTC) {
    return [EVMToken.WBTC, EVMToken.BTCB, EVMToken.aBTC]
  }
  assertExclude(restEVMTokenPossibilities, EVMToken.aBTC)
  assertExclude(restEVMTokenPossibilities, EVMToken.WBTC)
  assertExclude(restEVMTokenPossibilities, EVMToken.BTCB)

  if (stacksToken === StacksToken.uBTC) {
    return [EVMToken.uBTC, EVMToken.wuBTC]
  }
  assertExclude(restEVMTokenPossibilities, EVMToken.uBTC)
  assertExclude(restEVMTokenPossibilities, EVMToken.wuBTC)

  checkNever(restEVMTokenPossibilities)
  checkNever(restEVMTokenPossibilities)
  return []
}
export async function toCorrespondingStacksCurrency(
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
    case EVMToken.USDT:
    case EVMToken.sUSDT:
      return StacksToken.sUSDT
    case EVMToken.BTCB:
    case EVMToken.WBTC:
    case EVMToken.aBTC:
      return StacksToken.aBTC
    case EVMToken.uBTC:
    case EVMToken.wuBTC:
      return StacksToken.uBTC
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
    !KnownChainId.isEVMChain(fromChain) ||
    !KnownTokenId.isEVMToken(fromToken)
  ) {
    return false
  }
  if (!KnownChainId.isKnownChain(toChain)) return false

  const fromTokenInfo = await getEVMTokenContractInfo(ctx, fromChain, fromToken)
  if (fromTokenInfo == null) return false

  if (KnownChainId.isStacksChain(toChain)) {
    const stacksToken = await toCorrespondingStacksCurrency(fromToken)
    if (stacksToken == null) return false

    if (stxTokenContractAddresses[stacksToken]?.[toChain] == null) {
      return false
    }

    return stacksToken === toToken
  }

  if (KnownChainId.isEVMChain(toChain)) {
    const transitStacksToken = await toCorrespondingStacksCurrency(fromToken)
    if (transitStacksToken == null) return false

    const toEVMTokens = await fromCorrespondingStacksCurrency(
      toChain,
      transitStacksToken,
    )
    if (!hasAny(toEVMTokens)) return false

    const toTokenInfos = await Promise.all(
      toEVMTokens.map(token => getEVMTokenContractInfo(ctx, toChain, token)),
    ).then(infos => infos.filter(isNotNull))
    if (!hasAny(toTokenInfos)) return false

    return toEVMTokens.includes(toToken as any)
  }

  if (KnownChainId.isBitcoinChain(toChain)) {
    const stacksToken = await toCorrespondingStacksCurrency(fromToken)
    return stacksToken === KnownTokenId.Stacks.aBTC
  }

  checkNever(toChain)
  return false
}
