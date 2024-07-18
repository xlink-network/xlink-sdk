import { GetSupportedRoutesFnAnyResult } from "./utils/buildSupportedRoutes"
import { ChainIdInternal, TokenIdInternal } from "./utils/types.internal"
import {
  bridgeFromBitcoin,
  supportedRoutes as supportedRoutesFromBitcoin,
} from "./xlinkSdkUtils/bridgeFromBitcoin"
import {
  bridgeFromEVM,
  supportedRoutes as supportedRoutesFromEthereum,
} from "./xlinkSdkUtils/bridgeFromEVM"
import {
  bridgeFromStacks,
  supportedRoutes as supportedRoutesFromStacks,
} from "./xlinkSdkUtils/bridgeFromStacks"
import { bridgeInfoFromBitcoin } from "./xlinkSdkUtils/bridgeInfoFromBitcoin"
import { bridgeInfoFromEVM } from "./xlinkSdkUtils/bridgeInfoFromEVM"
import { bridgeInfoFromStacks } from "./xlinkSdkUtils/bridgeInfoFromStacks"
import { ChainId, SupportedToken } from "./xlinkSdkUtils/types"

export {
  BridgeFromBitcoinInput,
  BridgeFromBitcoinOutput,
} from "./xlinkSdkUtils/bridgeFromBitcoin"
export {
  BridgeFromEVMInput,
  BridgeFromEVMOutput,
} from "./xlinkSdkUtils/bridgeFromEVM"
export {
  BridgeFromStacksInput,
  BridgeFromStacksOutput,
} from "./xlinkSdkUtils/bridgeFromStacks"
export {
  BridgeInfoFromBitcoinInput,
  BridgeInfoFromBitcoinOutput,
} from "./xlinkSdkUtils/bridgeInfoFromBitcoin"
export {
  BridgeInfoFromEVMInput,
  BridgeInfoFromEVMOutput,
} from "./xlinkSdkUtils/bridgeInfoFromEVM"
export {
  BridgeInfoFromStacksInput,
  BridgeInfoFromStacksOutput,
} from "./xlinkSdkUtils/bridgeInfoFromStacks"

export class XLinkSDK {
  async getSupportedTokens(
    fromChain: ChainId,
    toChain: ChainId,
  ): Promise<SupportedToken[]> {
    for (const rules of [
      supportedRoutesFromStacks,
      supportedRoutesFromEthereum,
      supportedRoutesFromBitcoin,
    ]) {
      const result: GetSupportedRoutesFnAnyResult =
        await rules.getSupportedTokens(fromChain, toChain)

      if (result.length > 0) {
        return result.flatMap(res => [
          {
            fromChain: ChainIdInternal.toChainId(res.fromChain),
            fromToken: TokenIdInternal.toTokenId(res.fromToken),
            toChain: ChainIdInternal.toChainId(res.toChain),
            toToken: TokenIdInternal.toTokenId(res.toToken),
          },
        ])
      }
    }

    return []
  }

  bridgeInfoFromStacks = bridgeInfoFromStacks
  bridgeFromStacks = bridgeFromStacks

  bridgeInfoFromEthereum = bridgeInfoFromEVM
  bridgeFromEthereum = bridgeFromEVM

  bridgeInfoFromBitcoin = bridgeInfoFromBitcoin
  bridgeFromBitcoin = bridgeFromBitcoin
}
