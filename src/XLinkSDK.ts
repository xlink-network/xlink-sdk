import { ChainId, SupportedToken } from "./xlinkSdkUtils/types"
import {
  bridgeFromStacks,
  supportedRoutes as supportedRoutesFromStacks,
} from "./xlinkSdkUtils/bridgeFromStacks"
import { ChainIdInternal, TokenIdInternal } from "./utils/types.internal"
import {
  bridgeFromEthereum,
  supportedRoutes as supportedRoutesFromEthereum,
} from "./xlinkSdkUtils/bridgeFromEthereum"
import {
  bridgeFromBitcoin,
  supportedRoutes as supportedRoutesFromBitcoin,
} from "./xlinkSdkUtils/bridgeFromBitcoin"
import { GetSupportedRoutesFnAnyResult } from "./utils/buildSupportedRoutes"
import { bridgeInfoFromBitcoin } from "./xlinkSdkUtils/bridgeInfoFromBitcoin"
import { bridgeInfoFromEthereum } from "./xlinkSdkUtils/bridgeInfoFromEthereum"
import { bridgeInfoFromStacks } from "./xlinkSdkUtils/bridgeInfoFromStacks"

export {
  BridgeFromStacksInput,
  BridgeFromStacksOutput,
} from "./xlinkSdkUtils/bridgeFromStacks"
export {
  BridgeFromEthereumInput,
  BridgeFromEthereumOutput,
} from "./xlinkSdkUtils/bridgeFromEthereum"
export {
  BridgeFromBitcoinInput,
  BridgeFromBitcoinOutput,
} from "./xlinkSdkUtils/bridgeFromBitcoin"
export {
  BridgeInfoFromBitcoinInput,
  BridgeInfoFromBitcoinOutput,
} from "./xlinkSdkUtils/bridgeInfoFromBitcoin"
export {
  BridgeInfoFromEthereumInput,
  BridgeInfoFromEthereumOutput,
} from "./xlinkSdkUtils/bridgeInfoFromEthereum"
export {
  BridgeInfoFromStacksInput,
  BridgeInfoFromStacksOutput,
} from "./xlinkSdkUtils/bridgeInfoFromStacks"

export class XLINKSDK {
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

  bridgeInfoFromEthereum = bridgeInfoFromEthereum
  bridgeFromEthereum = bridgeFromEthereum

  bridgeInfoFromBitcoin = bridgeInfoFromBitcoin
  bridgeFromBitcoin = bridgeFromBitcoin
}
