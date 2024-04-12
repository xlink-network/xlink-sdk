import {
  executeReadonlyCallXLINK,
  getContractCallInfo,
  numberFromStacksContractNumber,
} from "../stacksUtils/xlinkContractHelpers"
import { BigNumber } from "../utils/BigNumber"
import { GetSupportedRoutesFnAnyResult } from "../utils/buildSupportedRoutes"
import { UnsupportedBridgeRouteError } from "../utils/errors"
import { checkNever } from "../utils/typeHelpers"
import {
  KnownChainId,
  KnownTokenId,
  TokenIdInternal,
} from "../utils/types.internal"
import { supportedRoutes } from "./bridgeFromBitcoin"
import { ChainId, TokenId } from "./types"

export interface BridgeFeeFromBitcoinInput {
  fromChain: ChainId
  toChain: ChainId
  amount: string
}

export interface BridgeFeeFromBitcoinOutput {
  paused: boolean
  feeToken: TokenId
  feeRate: string
  minFeeAmount: string
  minBridgeAmount: null | string
  maxBridgeAmount: null | string
}

export const bridgeFeeFromBitcoin = async (
  info: BridgeFeeFromBitcoinInput,
): Promise<BridgeFeeFromBitcoinOutput> => {
  const res: GetSupportedRoutesFnAnyResult =
    await supportedRoutes.getSupportedTokens(info.fromChain, info.toChain)
  if (res.length <= 0) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
    )
  }

  const route = await supportedRoutes.pickLeftToRightRouteOrThrow(
    info.fromChain,
    info.toChain,
    KnownTokenId.Bitcoin.BTC,
    res[0].toToken,
  )

  if (
    route.fromChain === KnownChainId.Bitcoin.Mainnet ||
    route.fromChain === KnownChainId.Bitcoin.Testnet
  ) {
    if (
      route.toChain === KnownChainId.Stacks.Mainnet ||
      route.toChain === KnownChainId.Stacks.Testnet
    ) {
      return bridgeFeeFromBitcoin_toStacks({
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
    KnownTokenId.Bitcoin.BTC,
    res[0].toToken,
  )
}

async function bridgeFeeFromBitcoin_toStacks(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  info: Omit<BridgeFeeFromBitcoinInput, "fromChain" | "toChain"> & {
    fromChain:
      | typeof KnownChainId.Bitcoin.Mainnet
      | typeof KnownChainId.Bitcoin.Testnet
    toChain:
      | typeof KnownChainId.Stacks.Mainnet
      | typeof KnownChainId.Stacks.Testnet
  },
): Promise<BridgeFeeFromBitcoinOutput> {
  const contractCallInfo = getContractCallInfo(info.toChain)
  if (contractCallInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
    )
  }

  const [paused, pegInFeeRate, pegInMinFee] = await Promise.all([
    executeReadonlyCallXLINK(
      "btc-bridge-endpoint-v1-11",
      "is-peg-in-paused",
      {},
      {
        deployerAddress: contractCallInfo.deployerAddress,
      },
    ),
    executeReadonlyCallXLINK(
      "btc-bridge-endpoint-v1-11",
      "get-peg-in-fee",
      {},
      {
        deployerAddress: contractCallInfo.deployerAddress,
      },
    ).then(numberFromStacksContractNumber),
    executeReadonlyCallXLINK(
      "btc-bridge-endpoint-v1-11",
      "get-peg-in-min-fee",
      {},
      {
        deployerAddress: contractCallInfo.deployerAddress,
      },
    ).then(numberFromStacksContractNumber),
  ])

  return {
    paused,
    feeToken: TokenIdInternal.toTokenId(KnownTokenId.Bitcoin.BTC),
    feeRate: BigNumber.toString(pegInFeeRate),
    minFeeAmount: BigNumber.toString(pegInMinFee),
    minBridgeAmount: BigNumber.toString(pegInMinFee),
    maxBridgeAmount: null,
  }
}
