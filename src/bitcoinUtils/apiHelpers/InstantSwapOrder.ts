import { ClarityValue } from "@stacks/transactions"
import {
  bufferT,
  optionalT,
  traitT,
  tupleT,
  uintT,
} from "../../../generated/smartContractHelpers/codegenImport"
import { StacksContractAddress } from "../../sdkUtils/types"
import { numberToStacksContractNumber } from "../../stacksUtils/contractHelpers"
import {
  contractAssignedChainIdFromKnownChain,
  contractAssignedChainIdToKnownChain,
} from "../../stacksUtils/crossContractDataMapping"
import { BigNumber } from "../../utils/BigNumber"
import { decodeHex, encodeZeroPrefixedHex } from "../../utils/hexHelpers"
import { deserializeAssetIdentifier } from "../../utils/stacksHelpers"
import { KnownChainId, KnownTokenId } from "../../utils/types/knownIds"
import { SDKGlobalContext } from "../../sdkUtils/types.internal"
import { tokenIdFromBuffer, tokenIdToBuffer } from "../../utils/tokenIdHelpers"

export type InstantSwapChain =
  | KnownChainId.BitcoinChain
  | KnownChainId.RunesChain

export type InstantSwapToken =
  | KnownTokenId.BitcoinToken
  | KnownTokenId.RunesToken

export type InstantSwapOrder = {
  fromChain: InstantSwapChain
  fromAddress: Uint8Array
  fromTokenId: InstantSwapToken
  fromAmount: BigNumber

  toChain: InstantSwapChain
  toAddress: Uint8Array
  toTokenId: InstantSwapToken
  toAmountMinimum: BigNumber
}

export interface InstantSwapOrderSerialized {
  fromChain: InstantSwapChain
  fromAddress: `0x${string}`
  fromTokenId: InstantSwapToken
  fromAmount: `${number}`

  toChain: InstantSwapChain
  toAddress: `0x${string}`
  toTokenId: InstantSwapToken
  toAmountMinimum: `${number}`
}

export const serializeInstantSwapOrder = async (
  network: "mainnet" | "testnet",
  order: InstantSwapOrder,
): Promise<InstantSwapOrderSerialized | null> => {
  return {
    fromChain: order.fromChain,
    fromAddress: encodeZeroPrefixedHex(order.fromAddress),
    fromTokenId: order.fromTokenId,
    fromAmount: BigNumber.toString(order.fromAmount),
    toChain: order.toChain,
    toAddress: encodeZeroPrefixedHex(order.toAddress),
    toTokenId: order.toTokenId,
    toAmountMinimum: BigNumber.toString(order.toAmountMinimum),
  }
}

export const deserializeInstantSwapOrder = async (
  network: "mainnet" | "testnet",
  serialized: InstantSwapOrderSerialized,
): Promise<null | InstantSwapOrder> => {
  return {
    fromChain: serialized.fromChain,
    fromAddress: decodeHex(serialized.fromAddress),
    fromTokenId: serialized.fromTokenId,
    fromAmount: BigNumber.from(serialized.fromAmount),
    toChain: serialized.toChain,
    toAddress: decodeHex(serialized.toAddress),
    toTokenId: serialized.toTokenId,
    toAmountMinimum: BigNumber.from(serialized.toAmountMinimum),
  }
}

const instantSwapOrderSchema = tupleT({
  v: uintT, // version
  fc: optionalT(uintT), // fromChain
  ft: bufferT, // fromTokenId
  fa: bufferT, // fromAddress
  tc: optionalT(uintT), // toChain
  tt: bufferT, // toTokenId
  ta: bufferT, // toAddress
  tn: uintT, // toAmountMinimum
})
export interface InstantSwapOrderData {
  fromChain: KnownChainId.KnownChain
  fromAddress: Uint8Array
  fromToken: KnownTokenId.KnownToken

  toChain: KnownChainId.KnownChain
  toAddress: Uint8Array
  toToken: KnownTokenId.KnownToken

  minimumAmountsToReceive: BigNumber
}
export const encodeInstantSwapOrderData = async (
  ctx: SDKGlobalContext,
  stacksNetwork: KnownChainId.StacksChain,
  info: InstantSwapOrderData,
): Promise<undefined | ClarityValue> => {
  const fromToken = await tokenIdToBuffer(ctx, info.fromChain, info.fromToken)
  const toToken = await tokenIdToBuffer(ctx, info.toChain, info.toToken)
  if (fromToken == null || toToken == null) return

  return instantSwapOrderSchema.encode({
    v: 0n,
    fc: getChainId(info.fromChain),
    ft: fromToken,
    fa: info.fromAddress,
    tc: getChainId(info.toChain),
    tt: toToken,
    ta: info.toAddress,
    tn: numberToStacksContractNumber(info.minimumAmountsToReceive),
  })

  function getChainId(chain: KnownChainId.KnownChain): undefined | bigint {
    if (KnownChainId.isStacksChain(chain)) return
    return contractAssignedChainIdFromKnownChain(chain)
  }
}
export const decodeInstantSwapOrderData = async (
  ctx: SDKGlobalContext,
  stacksNetwork: KnownChainId.StacksChain,
  data: ClarityValue,
): Promise<undefined | InstantSwapOrderData> => {
  let res: ReturnType<typeof instantSwapOrderSchema.decode>
  try {
    res = instantSwapOrderSchema.decode(data)
  } catch (e) {
    return
  }

  // if is not supported version
  if (res.v !== 0n) return

  const fromChain = getChain(res.fc)
  const toChain = getChain(res.tc)
  if (fromChain == null || toChain == null) return

  const fromToken = await tokenIdFromBuffer(ctx, fromChain, res.ft)
  const toToken = await tokenIdFromBuffer(ctx, toChain, res.tt)
  if (fromToken == null || toToken == null) return

  return {
    fromChain,
    fromAddress: res.fa,
    fromToken,
    toChain,
    toAddress: res.ta,
    toToken,
    minimumAmountsToReceive: BigNumber.from(res.tn),
  }

  function getChain(
    chainId: undefined | bigint,
  ): undefined | KnownChainId.KnownChain {
    if (chainId == null) return stacksNetwork
    const chains = contractAssignedChainIdToKnownChain(chainId)
    return stacksNetwork === KnownChainId.Stacks.Mainnet ? chains[0] : chains[1]
  }
}
