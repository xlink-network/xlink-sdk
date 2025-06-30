import { ClarityValue } from "@stacks/transactions"
import {
  traitT,
  bufferT,
  uintT,
  tupleT,
} from "../../../generated/smartContractHelpers/codegenImport"
import { StacksContractAddress } from "../../sdkUtils/types"
import { numberToStacksContractNumber } from "../../stacksUtils/contractHelpers"
import {
  contractAssignedChainIdFromKnownChain,
  contractAssignedChainIdToKnownChain,
} from "../../stacksUtils/crossContractDataMapping"
import { BigNumber } from "../../utils/BigNumber"
import { decodeHex, encodeZeroPrefixedHex } from "../../utils/hexHelpers"
import { KnownChainId, KnownTokenId } from "../../utils/types/knownIds"
import { deserializeAssetIdentifier } from "../../utils/stacksHelpers"

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
  fc: uintT, // fromChain
  ft: traitT, // fromTokenId
  fa: bufferT, // fromAddress
  tc: uintT, // toChain
  tt: traitT, // toTokenId
  ta: bufferT, // toAddress
  tn: uintT, // toAmountMinimum
})
export interface InstantSwapOrderData {
  fromChain: InstantSwapChain
  fromAddressBuffer: Uint8Array
  fromCorrespondingTokenAddress: StacksContractAddress

  toChain: InstantSwapChain
  toAddressBuffer: Uint8Array
  toCorrespondingTokenAddress: StacksContractAddress

  minimumAmountsToReceive: BigNumber
}
export const encodeInstantSwapOrderData = async (
  stacksNetwork: KnownChainId.StacksChain,
  info: InstantSwapOrderData,
): Promise<ClarityValue> => {
  const fromTokenAddress = info.fromCorrespondingTokenAddress
  const toTokenAddress = info.toCorrespondingTokenAddress

  return instantSwapOrderSchema.encode({
    v: 0n,
    fc: contractAssignedChainIdFromKnownChain(info.fromChain),
    ft: `${fromTokenAddress.deployerAddress}.${fromTokenAddress.contractName}`,
    fa: info.fromAddressBuffer,
    tc: contractAssignedChainIdFromKnownChain(info.toChain),
    tt: `${toTokenAddress.deployerAddress}.${toTokenAddress.contractName}`,
    ta: info.toAddressBuffer,
    tn: numberToStacksContractNumber(info.minimumAmountsToReceive),
  })
}
export const decodeInstantSwapOrderData = async (
  stacksNetwork: KnownChainId.StacksChain,
  data: ClarityValue,
): Promise<undefined | InstantSwapOrderData> => {
  const res = instantSwapOrderSchema.decode(data)

  const fromChain = getChain(contractAssignedChainIdToKnownChain(res.fc))
  const toChain = getChain(contractAssignedChainIdToKnownChain(res.tc))
  if (fromChain == null || toChain == null) return
  if (
    !(
      KnownChainId.isBitcoinChain(fromChain) ||
      KnownChainId.isRunesChain(fromChain)
    )
  ) {
    return
  }
  if (
    !(
      KnownChainId.isBitcoinChain(toChain) || KnownChainId.isRunesChain(toChain)
    )
  ) {
    return
  }

  const fromTokenAddress = deserializeAssetIdentifier(res.ft)
  const toTokenAddress = deserializeAssetIdentifier(res.tt)
  if (fromTokenAddress == null || toTokenAddress == null) return

  return {
    fromChain,
    fromAddressBuffer: res.fa,
    fromCorrespondingTokenAddress: {
      deployerAddress: fromTokenAddress.deployerAddress,
      contractName: fromTokenAddress.contractName,
    },
    toChain,
    toAddressBuffer: res.ta,
    toCorrespondingTokenAddress: {
      deployerAddress: toTokenAddress.deployerAddress,
      contractName: toTokenAddress.contractName,
    },
    minimumAmountsToReceive: BigNumber.from(res.tn),
  }

  function getChain(
    chains: [KnownChainId.KnownChain, KnownChainId.KnownChain?],
  ): null | KnownChainId.KnownChain {
    if (stacksNetwork === KnownChainId.Stacks.Mainnet) {
      if (chains[0] == null) return KnownChainId.Stacks.Mainnet
      return chains[0]
    }

    if (chains.length >= 2) {
      if (chains[1] == null) return KnownChainId.Stacks.Testnet
      return chains[1]
    }

    return null
  }
}
