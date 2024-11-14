import { getStacksToken } from "../stacksUtils/xlinkContractHelpers"
import { SDKNumber, StacksContractAddress } from "../xlinkSdkUtils/types"
import { last } from "./arrayHelpers"
import { BigNumber } from "./BigNumber"
import { OneOrMore } from "./typeHelpers"
import { KnownChainId, KnownTokenId } from "./types/knownIds"

export interface SwapRoute {
  fromTokenAddress: StacksContractAddress
  swapPools: OneOrMore<{
    poolId: bigint
    toTokenAddress: StacksContractAddress
  }>
}

export interface SwapRoute_WithExchangeRate extends SwapRoute {
  composedExchangeRate: BigNumber
}
export interface SwapRoute_WithExchangeRate_Public extends SwapRoute {
  composedExchangeRate: SDKNumber
}

export interface SwapRoute_WithMinimumAmountsToReceive extends SwapRoute {
  minimumAmountsToReceive: BigNumber
}
export interface SwapRoute_WithMinimumAmountsToReceive_Public
  extends SwapRoute {
  minimumAmountsToReceive: SDKNumber
}

export async function getFinalStepStacksTokenAddress(info: {
  swap: SwapRoute
  stacksChain: KnownChainId.StacksChain
}): Promise<undefined | KnownTokenId.StacksToken> {
  const finalStepStacksTokenAddress = last(info.swap.swapPools).toTokenAddress

  return getStacksToken(info.stacksChain, finalStepStacksTokenAddress)
}
