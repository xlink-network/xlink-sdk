import { BigNumber } from "../../utils/BigNumber"
import { decodeHex, encodeZeroPrefixedHex } from "../../utils/hexHelpers"
import { KnownChainId, KnownTokenId } from "../../utils/types/knownIds"

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
