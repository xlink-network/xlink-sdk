import { StacksNetwork } from "@stacks/network"
import { callReadOnlyFunction } from "@stacks/transactions"
import { CallReadOnlyFunctionFn, unwrapResponse } from "clarity-codegen"
import { Address, Client } from "viem"
import { readContract } from "viem/actions"
import {
  executeReadonlyCallXLINK,
  numberFromStacksContractNumber,
} from "../stacksUtils/xlinkContractHelpers"
import { BigNumber } from "../utils/BigNumber"
import { IsSupportedFn } from "../utils/buildSupportedRoutes"
import { TransferProphet } from "../utils/feeRateHelpers"
import { props } from "../utils/promiseHelpers"
import { assertExclude, checkNever } from "../utils/typeHelpers"
import { KnownChainId, KnownTokenId } from "../utils/types.internal"
import { StacksContractAddress } from "../xlinkSdkUtils/types"
import { bridgeEndpointAbi } from "./contractAbi/bridgeEndpoint"
import { bridgeRegistryAbi } from "./contractAbi/bridgeRegistry"
import {
  getEVMTokenContractInfo,
  numberFromSolidityContractNumber,
} from "./xlinkContractHelpers"
import { stxTokenContractAddresses } from "../stacksUtils/stxContractAddresses"

export const getEvm2StacksFeeInfo = async (
  stacksContractCallInfo: {
    network: StacksNetwork
    endpointDeployerAddress: string
  },
  evmContractCallInfo: {
    client: Client
    bridgeContractAddress: Address
  },
  tokenContractAddress: Address,
): Promise<undefined | TransferProphet> => {
  const executeOptions = {
    deployerAddress: stacksContractCallInfo.endpointDeployerAddress,
    callReadOnlyFunction: (callOptions =>
      callReadOnlyFunction({
        ...callOptions,
        network: stacksContractCallInfo.network,
      })) satisfies CallReadOnlyFunctionFn,
  }

  const { client, bridgeContractAddress } = evmContractCallInfo

  const registryAddr = await readContract(client, {
    abi: bridgeEndpointAbi,
    address: bridgeContractAddress,
    functionName: "registry",
  })

  const resp = await props({
    isApproved: readContract(client, {
      abi: bridgeRegistryAbi,
      address: bridgeContractAddress,
      functionName: "APPROVED_TOKEN",
    }).then(token =>
      readContract(client, {
        abi: bridgeRegistryAbi,
        address: registryAddr,
        functionName: "hasRole",
        args: [token, tokenContractAddress],
      }),
    ),
    feeRate: readContract(client, {
      abi: bridgeRegistryAbi,
      address: registryAddr,
      functionName: "feePctPerToken",
      args: [tokenContractAddress],
    }).then(numberFromSolidityContractNumber),
    minFeeAmount: readContract(client, {
      abi: bridgeRegistryAbi,
      address: registryAddr,
      functionName: "minFeePerToken",
      args: [tokenContractAddress],
    }).then(numberFromSolidityContractNumber),
    minAmount: readContract(client, {
      abi: bridgeRegistryAbi,
      address: registryAddr,
      functionName: "minAmountPerToken",
      args: [tokenContractAddress],
    }).then(numberFromSolidityContractNumber),
    maxAmount: readContract(client, {
      abi: bridgeRegistryAbi,
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
    minFee: resp.minFeeAmount,
    minAmount: BigNumber.isZero(minAmount) ? null : minAmount,
    maxAmount: BigNumber.isZero(maxAmount) ? null : maxAmount,
  }
}

export const getStacks2EvmFeeInfo = async (
  contractCallInfo: {
    network: StacksNetwork
    endpointDeployerAddress: string
  },
  info: {
    toChainId: bigint
    stacksToken: StacksContractAddress
  },
): Promise<undefined | TransferProphet> => {
  const executeOptions = {
    deployerAddress: contractCallInfo.endpointDeployerAddress,
    callReadOnlyFunction: (callOptions =>
      callReadOnlyFunction({
        ...callOptions,
        network: contractCallInfo.network,
      })) satisfies CallReadOnlyFunctionFn,
  }

  const tokenConf = await Promise.all([
    executeReadonlyCallXLINK(
      "cross-peg-out-endpoint-v2-01",
      "get-approved-pair-or-fail",
      {
        pair: {
          token: `${info.stacksToken.deployerAddress}.${info.stacksToken.contractName}`,
          "chain-id": info.toChainId,
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
    feeRate,
    minFee,
    minAmount: BigNumber.isZero(minAmount) ? null : minAmount,
    maxAmount: BigNumber.isZero(maxAmount) ? null : maxAmount,
  }
}

export async function fromCorrespondingStacksCurrency(
  toChain: KnownChainId.EVMChain,
  stacksToken: KnownTokenId.StacksToken,
): Promise<undefined | KnownTokenId.EVMToken> {
  const EVMChain = KnownChainId.EVM
  const EVMToken = KnownTokenId.EVM
  const StacksToken = KnownTokenId.Stacks

  const restEVMTokenPossibilities = assertExclude.i<KnownTokenId.EVMToken>()

  if (stacksToken === StacksToken.sLUNR) {
    return EVMToken.LUNR
  }
  assertExclude(restEVMTokenPossibilities, EVMToken.LUNR)

  if (stacksToken === StacksToken.ALEX) {
    return EVMToken.ALEX
  }
  assertExclude(restEVMTokenPossibilities, EVMToken.ALEX)

  if (stacksToken === StacksToken.sSKO) {
    return EVMToken.SKO
  }
  assertExclude(restEVMTokenPossibilities, EVMToken.SKO)

  if (stacksToken === StacksToken.vLiSTX) {
    return EVMToken.vLiSTX
  }
  assertExclude(restEVMTokenPossibilities, EVMToken.vLiSTX)

  if (stacksToken === StacksToken.vLiALEX) {
    return EVMToken.vLiALEX
  }
  assertExclude(restEVMTokenPossibilities, EVMToken.vLiALEX)

  if (stacksToken === StacksToken.sUSDT) {
    switch (toChain) {
      case EVMChain.Ethereum:
      case EVMChain.Sepolia:
      case EVMChain.BSC:
      case EVMChain.BSCTestnet:
        return EVMToken.USDT
      case EVMChain.CoreDAO:
      case EVMChain.CoreDAOTestnet:
      case EVMChain.Bsquared:
      case EVMChain.BsquaredTestnet:
      case EVMChain.BOB:
      case EVMChain.BOBTestnet:
      case EVMChain.Bitlayer:
      case EVMChain.BitlayerTestnet:
      case EVMChain.Lorenzo:
      case EVMChain.LorenzoTestnet:
      case EVMChain.Merlin:
      case EVMChain.MerlinTestnet:
      case EVMChain.AILayer:
      case EVMChain.AILayerTestnet:
        return EVMToken.sUSDT
      default:
        checkNever(toChain)
    }
  }
  assertExclude(restEVMTokenPossibilities, EVMToken.USDT)
  assertExclude(restEVMTokenPossibilities, EVMToken.sUSDT)

  if (stacksToken === StacksToken.aBTC) {
    switch (toChain) {
      case EVMChain.Ethereum:
      case EVMChain.Sepolia:
      case EVMChain.BSCTestnet:
        return EVMToken.WBTC
      case EVMChain.BSC:
        return EVMToken.BTCB
      case EVMChain.CoreDAO:
      case EVMChain.CoreDAOTestnet:
      case EVMChain.Bsquared:
      case EVMChain.BsquaredTestnet:
      case EVMChain.BOB:
      case EVMChain.BOBTestnet:
      case EVMChain.Bitlayer:
      case EVMChain.BitlayerTestnet:
      case EVMChain.Lorenzo:
      case EVMChain.LorenzoTestnet:
      case EVMChain.Merlin:
      case EVMChain.MerlinTestnet:
      case EVMChain.AILayer:
      case EVMChain.AILayerTestnet:
        return EVMToken.aBTC
      default:
        checkNever(toChain)
    }
  }
  assertExclude(restEVMTokenPossibilities, EVMToken.aBTC)
  assertExclude(restEVMTokenPossibilities, EVMToken.WBTC)
  assertExclude(restEVMTokenPossibilities, EVMToken.BTCB)

  checkNever(restEVMTokenPossibilities)
  return undefined
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
    default:
      checkNever(evmToken)
      return
  }
}

export const isSupportedEVMRoute: IsSupportedFn = async route => {
  if (route.fromChain === route.toChain && route.fromToken === route.toToken) {
    return false
  }
  if (
    !KnownChainId.isEVMChain(route.fromChain) ||
    !KnownTokenId.isEVMToken(route.fromToken)
  ) {
    return false
  }
  if (!KnownChainId.isKnownChain(route.toChain)) return false

  const fromTokenInfo = await getEVMTokenContractInfo(
    route.fromChain,
    route.fromToken,
  )
  if (fromTokenInfo == null) return false

  if (KnownChainId.isStacksChain(route.toChain)) {
    const stacksToken = await toCorrespondingStacksCurrency(route.fromToken)
    if (stacksToken == null) return false

    if (stxTokenContractAddresses[stacksToken]?.[route.toChain] == null) {
      return false
    }

    return stacksToken === route.toToken
  }

  if (KnownChainId.isEVMChain(route.toChain)) {
    const transitStacksToken = await toCorrespondingStacksCurrency(
      route.fromToken,
    )
    if (transitStacksToken == null) return false

    const toEVMToken = await fromCorrespondingStacksCurrency(
      route.toChain,
      transitStacksToken,
    )
    if (toEVMToken == null) return false

    const toTokenInfo = await getEVMTokenContractInfo(route.toChain, toEVMToken)
    if (toTokenInfo == null) return false

    return toEVMToken === route.toToken
  }

  if (KnownChainId.isBitcoinChain(route.toChain)) {
    const stacksToken = await toCorrespondingStacksCurrency(route.fromToken)
    return stacksToken === KnownTokenId.Stacks.aBTC
  }

  checkNever(route.toChain)
  return false
}
