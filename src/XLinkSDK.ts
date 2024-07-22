import { getEVMToken } from "./evmUtils/xlinkContractHelpers"
import { getStacksToken } from "./stacksUtils/xlinkContractHelpers"
import { KnownChainId, KnownTokenId } from "./utils/types.internal"
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
import {
  ChainId,
  EVMAddress,
  StacksContractAddress,
  SupportedToken,
} from "./xlinkSdkUtils/types"

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
      const result = await rules.getSupportedTokens(fromChain, toChain)

      return result.map(res => ({
        fromChain: res.fromChain,
        fromToken: res.fromToken,
        toChain: res.toChain,
        toToken: res.toToken,
      }))
    }

    return []
  }

  async getTokenFromEVMAddress(
    chain: ChainId,
    address: EVMAddress,
  ): Promise<undefined | KnownTokenId.EVMToken> {
    if (!KnownChainId.isEVMChain(chain)) return
    return getEVMToken(chain, address)
  }
  async getTokenFromStacksAddress(
    chain: ChainId,
    address: StacksContractAddress,
  ): Promise<undefined | KnownTokenId.StacksToken> {
    if (!KnownChainId.isStacksChain(chain)) return
    return getStacksToken(chain, address)
  }

  bridgeInfoFromStacks = bridgeInfoFromStacks
  bridgeFromStacks = bridgeFromStacks

  bridgeInfoFromEVM = bridgeInfoFromEVM
  bridgeFromEVM = bridgeFromEVM

  bridgeInfoFromBitcoin = bridgeInfoFromBitcoin
  bridgeFromBitcoin = bridgeFromBitcoin
}
