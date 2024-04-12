import { readContract } from "viem/actions"
import { bridgeEndpointAbi } from "../ethereumUtils/contractAbi/bridgeEndpoint"
import { ethEndpointContractAddresses } from "../ethereumUtils/ethContractAddresses"
import {
  getContractCallInfo,
  getTokenContractInfo,
  numberFromSolidityContractNumber,
} from "../ethereumUtils/xlinkContractHelpers"
import { BigNumber } from "../utils/BigNumber"
import { UnsupportedBridgeRouteError } from "../utils/errors"
import { checkNever } from "../utils/typeHelpers"
import { KnownChainId } from "../utils/types.internal"
import { supportedRoutes } from "./bridgeFromEthereum"
import { ChainId, TokenId } from "./types"

export interface BridgeInfoFromEthereumInput {
  fromChain: ChainId
  toChain: ChainId
  fromToken: TokenId
  toToken: TokenId
  amount: string
}

export interface BridgeInfoFromEthereumOutput {
  paused: boolean
  feeToken: TokenId
  feeRate: string
  minFeeAmount: string
  minBridgeAmount: null | string
  maxBridgeAmount: null | string
}

export async function bridgeInfoFromEthereum(
  info: BridgeInfoFromEthereumInput,
): Promise<BridgeInfoFromEthereumOutput> {
  const route = await supportedRoutes.pickLeftToRightRouteOrThrow(
    info.fromChain,
    info.toChain,
    info.fromToken,
    info.toToken,
  )

  if (
    route.fromChain === KnownChainId.Ethereum.Mainnet ||
    route.fromChain === KnownChainId.Ethereum.BSC ||
    route.fromChain === KnownChainId.Ethereum.Sepolia ||
    route.fromChain === KnownChainId.Ethereum.BSCTest
  ) {
    if (
      route.toChain === KnownChainId.Stacks.Mainnet ||
      route.toChain === KnownChainId.Stacks.Testnet
    ) {
      return bridgeInfoFromEthereum_toStacks({
        ...info,
        fromChain: route.fromChain,
        toChain: route.toChain,
      })
    }

    // if (KnownChainId.isBitcoinChain(route.toChain)) {
    //   return bridgeInfoFromEthereum_toBitcoin({
    //     ...info,
    //     fromChain: route.fromChain,
    //     toChain: route.toChain,
    //   })
    // }

    checkNever(route)
  } else {
    checkNever(route)
  }

  throw new UnsupportedBridgeRouteError(
    info.fromChain,
    info.toChain,
    info.fromToken,
    info.toToken,
  )
}

async function bridgeInfoFromEthereum_toStacks(
  info: Omit<BridgeInfoFromEthereumInput, "fromChain" | "toChain"> & {
    fromChain: KnownChainId.EthereumChain
    toChain: KnownChainId.StacksChain
  },
): Promise<BridgeInfoFromEthereumOutput> {
  const bridgeEndpointAddress =
    ethEndpointContractAddresses.bridgeEndpoint[info.fromChain]
  const contractCallInfo = getContractCallInfo(info.fromChain)
  const fromTokenContractAddress = getTokenContractInfo(
    info.fromChain,
    info.fromToken,
  )
  if (contractCallInfo == null || fromTokenContractAddress == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const [
    paused,
    feePctPerToken,
    minFeePerToken,
    minAmountPerToken,
    maxAmountPerToken,
  ] = await Promise.all([
    readContract(contractCallInfo.client, {
      abi: bridgeEndpointAbi,
      address: bridgeEndpointAddress,
      functionName: "paused",
      args: [],
    }),
    readContract(contractCallInfo.client, {
      abi: bridgeEndpointAbi,
      address: bridgeEndpointAddress,
      functionName: "feePctPerToken",
      args: [fromTokenContractAddress.contractAddress],
    }).then(numberFromSolidityContractNumber),
    readContract(contractCallInfo.client, {
      abi: bridgeEndpointAbi,
      address: bridgeEndpointAddress,
      functionName: "feePctPerToken",
      args: [fromTokenContractAddress.contractAddress],
    }).then(numberFromSolidityContractNumber),
    readContract(contractCallInfo.client, {
      abi: bridgeEndpointAbi,
      address: bridgeEndpointAddress,
      functionName: "minFeePerToken",
      args: [fromTokenContractAddress.contractAddress],
    }).then(numberFromSolidityContractNumber),
    readContract(contractCallInfo.client, {
      abi: bridgeEndpointAbi,
      address: bridgeEndpointAddress,
      functionName: "minAmountPerToken",
      args: [fromTokenContractAddress.contractAddress],
    }).then(numberFromSolidityContractNumber),
    readContract(contractCallInfo.client, {
      abi: bridgeEndpointAbi,
      address: bridgeEndpointAddress,
      functionName: "maxAmountPerToken",
      args: [fromTokenContractAddress.contractAddress],
    }).then(numberFromSolidityContractNumber),
  ])

  const finalMinBridgeAmount = BigNumber.max([
    minAmountPerToken,
    minFeePerToken,
  ])

  return {
    paused,
    feeToken: info.fromToken,
    feeRate: BigNumber.toString(feePctPerToken),
    minFeeAmount: BigNumber.toString(minFeePerToken),
    minBridgeAmount: BigNumber.isZero(finalMinBridgeAmount)
      ? null
      : BigNumber.toString(finalMinBridgeAmount),
    maxBridgeAmount: BigNumber.isZero(maxAmountPerToken)
      ? null
      : BigNumber.toString(maxAmountPerToken),
  }
}
