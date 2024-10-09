import { getBTCPegInAddress } from "../bitcoinUtils/btcAddresses"
import { ReselectSpendableUTXOsFn } from "../bitcoinUtils/prepareTransaction"
import {
  createBridgeOrder_BitcoinToEVM,
  createBridgeOrder_BitcoinToStacks,
} from "../stacksUtils/createBridgeOrder"
import {
  getStacksContractCallInfo,
  numberToStacksContractNumber,
} from "../stacksUtils/xlinkContractHelpers"
import { UnsupportedBridgeRouteError } from "../utils/errors"
import { assertExclude, checkNever } from "../utils/typeHelpers"
import { KnownChainId, KnownTokenId } from "../utils/types/knownIds"
import { prepareBitcoinTransaction, supportedRoutes } from "./bridgeFromBitcoin"
import { ChainId, SDKNumber, TokenId, toSDKNumberOrUndefined } from "./types"
import { SDKGlobalContext } from "./types.internal"

export interface EstimateBridgeTransactionFromBitcoinInput {
  fromChain: ChainId
  toChain: ChainId
  fromToken: TokenId
  toToken: TokenId
  fromAddress: string
  fromAddressScriptPubKey: Uint8Array
  toAddress: string
  amount: SDKNumber
  networkFeeRate: bigint
  reselectSpendableUTXOs: ReselectSpendableUTXOsFn
}

export interface EstimateBridgeTransactionFromBitcoinOutput {
  fee: SDKNumber
  estimatedVSize: SDKNumber
}

export async function estimateBridgeTransactionFromBitcoin(
  ctx: SDKGlobalContext,
  info: EstimateBridgeTransactionFromBitcoinInput,
): Promise<EstimateBridgeTransactionFromBitcoinOutput> {
  const route = await supportedRoutes.checkRouteValid(ctx, info)

  if (KnownChainId.isBitcoinChain(route.fromChain)) {
    if (KnownChainId.isStacksChain(route.toChain)) {
      if (
        KnownTokenId.isBitcoinToken(route.fromToken) &&
        KnownTokenId.isStacksToken(route.toToken)
      ) {
        return estimateFromBitcoin_toStacks({
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isEVMChain(route.toChain)) {
      if (
        KnownTokenId.isBitcoinToken(route.fromToken) &&
        KnownTokenId.isEVMToken(route.toToken)
      ) {
        return estimateFromBitcoin_toEVM({
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else {
      assertExclude(route.toChain, assertExclude.i<KnownChainId.BitcoinChain>())
      checkNever(route)
    }
  } else {
    assertExclude(route.fromChain, assertExclude.i<KnownChainId.EVMChain>())
    assertExclude(route.fromChain, assertExclude.i<KnownChainId.StacksChain>())
    checkNever(route)
  }

  throw new UnsupportedBridgeRouteError(
    info.fromChain,
    info.toChain,
    info.fromToken,
    info.toToken,
  )
}

async function estimateFromBitcoin_toStacks(
  info: Omit<
    EstimateBridgeTransactionFromBitcoinInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > & {
    fromChain: KnownChainId.BitcoinChain
    toChain: KnownChainId.StacksChain
    fromToken: KnownTokenId.BitcoinToken
    toToken: KnownTokenId.StacksToken
  },
): Promise<EstimateBridgeTransactionFromBitcoinOutput> {
  const pegInAddress = getBTCPegInAddress(info.fromChain, info.toChain)
  const contractCallInfo = getStacksContractCallInfo(info.toChain)
  if (pegInAddress == null || contractCallInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
    )
  }

  const { data: orderData } = await createBridgeOrder_BitcoinToStacks(
    {
      network: contractCallInfo.network,
      endpointDeployerAddress: contractCallInfo.deployerAddress,
    },
    {
      receiverAddr: info.toAddress,
      swapSlippedAmount: numberToStacksContractNumber(info.amount),
      swapRoute: [],
    },
  )

  const resp = await prepareBitcoinTransaction({
    ...info,
    orderData,
    pegInAddress,
  })

  return {
    fee: toSDKNumberOrUndefined(resp.fee),
    estimatedVSize: toSDKNumberOrUndefined(resp.estimatedVSize),
  }
}

async function estimateFromBitcoin_toEVM(
  info: Omit<
    EstimateBridgeTransactionFromBitcoinInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > & {
    fromChain: KnownChainId.BitcoinChain
    toChain: KnownChainId.EVMChain
    fromToken: KnownTokenId.BitcoinToken
    toToken: KnownTokenId.EVMToken
  },
): Promise<EstimateBridgeTransactionFromBitcoinOutput> {
  const pegInAddress = getBTCPegInAddress(info.fromChain, info.toChain)
  const contractCallInfo = getStacksContractCallInfo(
    info.fromChain === KnownChainId.Bitcoin.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet,
  )
  if (pegInAddress == null || contractCallInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
    )
  }

  const createdOrder = await createBridgeOrder_BitcoinToEVM(
    {
      network: contractCallInfo.network,
      endpointDeployerAddress: contractCallInfo.deployerAddress,
    },
    {
      targetChain: info.toChain,
      targetToken: info.toToken,
      fromBitcoinScriptPubKey: info.fromAddressScriptPubKey,
      receiverAddr: info.toAddress,
      swapSlippedAmount: numberToStacksContractNumber(info.amount),
      swapRoute: [],
    },
  )
  if (createdOrder == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
    )
  }

  const resp = await prepareBitcoinTransaction({
    ...info,
    orderData: createdOrder.data,
    pegInAddress,
  })

  return {
    fee: toSDKNumberOrUndefined(resp.fee),
    estimatedVSize: toSDKNumberOrUndefined(resp.estimatedVSize),
  }
}
