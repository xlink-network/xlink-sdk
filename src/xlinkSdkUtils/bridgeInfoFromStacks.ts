import { contractAssignedChainIdFromBridgeChain } from "../ethereumUtils/crossContractDataMapping"
import {
  executeReadonlyCallXLINK,
  getContractCallInfo,
  getTokenContractInfo,
  numberFromStacksContractNumber,
} from "../stacksUtils/xlinkContractHelpers"
import { BigNumber } from "../utils/BigNumber"
import { UnsupportedBridgeRouteError } from "../utils/errors"
import { checkNever } from "../utils/typeHelpers"
import { KnownChainId, TokenIdInternal } from "../utils/types.internal"
import { supportedRoutes } from "./bridgeFromStacks"
import { ChainId, TokenId } from "./types"

export interface BridgeInfoFromStacksInput {
  fromChain: ChainId
  toChain: ChainId
  fromToken: TokenId
  toToken: TokenId
  amount: string
}

export interface BridgeInfoFromStacksOutput {
  paused: boolean
  feeToken: TokenId
  feeRate: string
  minFeeAmount: string
  minBridgeAmount: null | string
  maxBridgeAmount: null | string
}

export async function bridgeInfoFromStacks(
  info: BridgeInfoFromStacksInput,
): Promise<BridgeInfoFromStacksOutput> {
  const route = await supportedRoutes.pickLeftToRightRouteOrThrow(
    info.fromChain,
    info.toChain,
    info.fromToken,
    info.toToken,
  )

  if (
    route.fromChain === KnownChainId.Stacks.Mainnet ||
    route.fromChain === KnownChainId.Stacks.Testnet
  ) {
    if (
      route.toChain === KnownChainId.Bitcoin.Mainnet ||
      route.toChain === KnownChainId.Bitcoin.Testnet
    ) {
      return bridgeInfoFromStacks_toBitcoin({
        ...info,
        fromChain: route.fromChain,
        toChain: route.toChain,
      })
    }

    if (
      route.toChain === KnownChainId.Ethereum.Mainnet ||
      route.toChain === KnownChainId.Ethereum.Sepolia ||
      route.toChain === KnownChainId.Ethereum.BSC ||
      route.toChain === KnownChainId.Ethereum.BSCTest
    ) {
      return bridgeInfoFromStacks_toEthereum({
        ...info,
        fromChain: route.fromChain,
        toChain: route.toChain,
      })
    }

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

async function bridgeInfoFromStacks_toBitcoin(
  info: Omit<BridgeInfoFromStacksInput, "fromChain" | "toChain"> & {
    fromChain:
      | typeof KnownChainId.Stacks.Mainnet
      | typeof KnownChainId.Stacks.Testnet
    toChain:
      | typeof KnownChainId.Bitcoin.Mainnet
      | typeof KnownChainId.Bitcoin.Testnet
  },
): Promise<BridgeInfoFromStacksOutput> {
  const contractCallInfo = getContractCallInfo(info.fromChain)
  if (!contractCallInfo) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const [pegOutFeeRate, pegOutMinFee, paused] = await Promise.all([
    executeReadonlyCallXLINK(
      "btc-bridge-endpoint-v1-11",
      "get-peg-out-fee",
      {},
      {
        deployerAddress: contractCallInfo.deployerAddress,
      },
    ).then(numberFromStacksContractNumber),
    executeReadonlyCallXLINK(
      "btc-bridge-endpoint-v1-11",
      "get-peg-out-min-fee",
      {},
      {
        deployerAddress: contractCallInfo.deployerAddress,
      },
    ).then(numberFromStacksContractNumber),
    executeReadonlyCallXLINK(
      "btc-bridge-endpoint-v1-11",
      "is-peg-out-paused",
      {},
      {
        deployerAddress: contractCallInfo.deployerAddress,
      },
    ),
  ])

  return {
    paused,
    feeToken: TokenIdInternal.toTokenId(info.fromToken),
    feeRate: BigNumber.toString(pegOutFeeRate),
    minFeeAmount: BigNumber.toString(pegOutMinFee),
    minBridgeAmount: BigNumber.toString(pegOutMinFee),
    maxBridgeAmount: null,
  }
}

async function bridgeInfoFromStacks_toEthereum(
  info: Omit<BridgeInfoFromStacksInput, "fromChain" | "toChain"> & {
    fromChain:
      | typeof KnownChainId.Stacks.Mainnet
      | typeof KnownChainId.Stacks.Testnet
    toChain:
      | typeof KnownChainId.Ethereum.Mainnet
      | typeof KnownChainId.Ethereum.Sepolia
      | typeof KnownChainId.Ethereum.BSC
      | typeof KnownChainId.Ethereum.BSCTest
  },
): Promise<BridgeInfoFromStacksOutput> {
  const contractCallInfo = getContractCallInfo(info.fromChain)
  const tokenContractInfo = getTokenContractInfo(info.fromChain, info.fromToken)
  if (contractCallInfo == null || tokenContractInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const [tokenIdResp, approvedTokenResp, paused] = await Promise.all([
    executeReadonlyCallXLINK(
      "cross-bridge-endpoint-v1-03",
      "get-approved-token-id-or-fail",
      {
        token: `${tokenContractInfo.deployerAddress}.${tokenContractInfo.contractName}`,
      },
      {
        deployerAddress: contractCallInfo.deployerAddress,
      },
    ),
    executeReadonlyCallXLINK(
      "cross-bridge-endpoint-v1-03",
      "get-approved-token-or-fail",
      {
        token: `${tokenContractInfo.deployerAddress}.${tokenContractInfo.contractName}`,
      },
      {
        deployerAddress: contractCallInfo.deployerAddress,
      },
    ),
    executeReadonlyCallXLINK(
      "cross-bridge-endpoint-v1-03",
      "get-paused",
      {},
      {
        deployerAddress: contractCallInfo.deployerAddress,
      },
    ),
  ])

  if (
    tokenIdResp.type === "error" ||
    approvedTokenResp.type === "error" ||
    !approvedTokenResp.value.approved
  ) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const [minFee, reserve] = await Promise.all([
    executeReadonlyCallXLINK(
      "cross-bridge-endpoint-v1-03",
      "get-min-fee-or-default",
      {
        "the-chain-id": contractAssignedChainIdFromBridgeChain(info.toChain),
        "the-token-id": tokenIdResp.value,
      },
      {
        deployerAddress: contractCallInfo.deployerAddress,
      },
    ).then(numberFromStacksContractNumber),
    executeReadonlyCallXLINK(
      "cross-bridge-endpoint-v1-03",
      "get-token-reserve-or-default",
      {
        "the-chain-id": contractAssignedChainIdFromBridgeChain(info.toChain),
        "the-token-id": tokenIdResp.value,
      },
      {
        deployerAddress: contractCallInfo.deployerAddress,
      },
    ).then(numberFromStacksContractNumber),
  ])

  const contractSetMinBridgeAmount = numberFromStacksContractNumber(
    approvedTokenResp.value["min-amount"],
  )
  const contractSetMaxBridgeAmount = numberFromStacksContractNumber(
    approvedTokenResp.value["max-amount"],
  )

  const finalMinBridgeAmount = BigNumber.max([
    contractSetMinBridgeAmount,
    minFee,
  ])

  return {
    paused,
    feeToken: TokenIdInternal.toTokenId(info.fromToken),
    feeRate: BigNumber.toString(approvedTokenResp.value.fee),
    minFeeAmount: BigNumber.toString(minFee),
    minBridgeAmount: BigNumber.isZero(finalMinBridgeAmount)
      ? null
      : BigNumber.toString(finalMinBridgeAmount),
    maxBridgeAmount: BigNumber.isZero(contractSetMaxBridgeAmount)
      ? BigNumber.toString(reserve)
      : BigNumber.toString(
          BigNumber.min([reserve, contractSetMaxBridgeAmount]),
        ),
  }
}
