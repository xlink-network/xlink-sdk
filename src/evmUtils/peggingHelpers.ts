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
import { props } from "../utils/promiseHelpers"
import { bridgeEndpointAbi } from "./contractAbi/bridgeEndpoint"
import { bridgeRegistryAbi } from "./contractAbi/bridgeRegistry"
import { numberFromSolidityContractNumber } from "./xlinkContractHelpers"
import { TransferProphet } from "../utils/feeRateHelpers"
import { ContractAddress } from "../stacksUtils/stxContractAddresses"
import { ChainToken } from "../xlinkSdkUtils/types"
import { KnownChainId, KnownTokenId } from "../utils/types.internal"
import { assertExclude, checkNever } from "../utils/typeHelpers"

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
    stacksToken: ContractAddress
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

  const restEthCurrency = assertExclude.i<KnownTokenId.EVMToken>()

  if (stacksToken === StacksToken.sUSDT) {
    return EVMToken.USDT
  }
  assertExclude(restEthCurrency, EVMToken.USDT)

  if (stacksToken === StacksToken.sLUNR) {
    return EVMToken.LUNR
  }
  assertExclude(restEthCurrency, EVMToken.LUNR)

  if (stacksToken === StacksToken.ALEX) {
    return EVMToken.ALEX
  }
  assertExclude(restEthCurrency, EVMToken.ALEX)

  if (stacksToken === StacksToken.sSKO) {
    return EVMToken.SKO
  }
  assertExclude(restEthCurrency, EVMToken.SKO)

  if (stacksToken === StacksToken.vLiSTX) {
    return EVMToken.vLiSTX
  }
  assertExclude(restEthCurrency, EVMToken.vLiSTX)

  if (stacksToken === StacksToken.vLiALEX) {
    return EVMToken.vLiALEX
  }
  assertExclude(restEthCurrency, EVMToken.vLiALEX)

  if (stacksToken === StacksToken.aBTC) {
    switch (toChain) {
      case EVMChain.Ethereum:
      case EVMChain.Sepolia:
      case EVMChain.BSCTest:
        return EVMToken.WBTC
      case EVMChain.BSC:
        return EVMToken.BTCB
      case EVMChain.CoreDAO:
      case EVMChain.CoreDAOTest:
      case EVMChain.Bsquared:
      case EVMChain.BsquaredTest:
      case EVMChain.BOB:
      case EVMChain.BOBTest:
      case EVMChain.Bitlayer:
      case EVMChain.BitlayerTest:
      case EVMChain.Lorenzo:
      case EVMChain.LorenzoTest:
      case EVMChain.Merlin:
      case EVMChain.MerlinTest:
      case EVMChain.AILayer:
      case EVMChain.AILayerTest:
        return EVMToken.aBTC
      default:
        checkNever(toChain)
    }
  }
  assertExclude(restEthCurrency, EVMToken.aBTC)
  assertExclude(restEthCurrency, EVMToken.WBTC)
  assertExclude(restEthCurrency, EVMToken.BTCB)

  checkNever(restEthCurrency)
  return undefined
}
export async function toCorrespondingStacksCurrency(
  evmToken: KnownTokenId.EVMToken,
): Promise<undefined | KnownTokenId.StacksToken> {
  const EVMToken = KnownTokenId.EVM
  const StacksToken = KnownTokenId.Stacks

  switch (evmToken) {
    case EVMToken.USDT:
      return StacksToken.sUSDT
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
    case EVMToken.BTCB:
    case EVMToken.WBTC:
    case EVMToken.aBTC:
      return StacksToken.aBTC
    default:
      checkNever(evmToken)
      return
  }
}

export async function isValidRoute(
  from: ChainToken,
  to: ChainToken,
): Promise<boolean> {
  if (from.chain === to.chain && from.token === to.token) {
    return false
  }

  if (
    !KnownChainId.isEVMChain(from.chain) ||
    !KnownChainId.isEVMChain(to.chain)
  ) {
    return false
  }

  const transitStacksToken = await toCorrespondingStacksCurrency(
    from.token as KnownTokenId.EVMToken,
  )
  if (transitStacksToken == null) return false

  const toEVMToken = await fromCorrespondingStacksCurrency(
    to.chain,
    transitStacksToken,
  )
  if (toEVMToken == null) return false

  return toEVMToken === to.token
}
