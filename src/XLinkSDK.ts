import {
  getEVMToken,
  getEVMTokenContractInfo,
} from "./evmUtils/xlinkContractHelpers"
import {
  getStacksToken,
  getStacksTokenContractInfo,
} from "./stacksUtils/xlinkContractHelpers"
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

  async evmAddressFromEVMToken(
    chain: ChainId,
    token: KnownTokenId.EVMToken,
  ): Promise<undefined | EVMAddress> {
    if (!KnownChainId.isEVMChain(chain)) return
    const info = await getEVMTokenContractInfo(chain, token)
    return info?.tokenContractAddress
  }
  async evmAddressToEVMToken(
    chain: ChainId,
    address: EVMAddress,
  ): Promise<undefined | KnownTokenId.EVMToken> {
    if (!KnownChainId.isEVMChain(chain)) return
    return getEVMToken(chain, address)
  }

  async stacksAddressFromStacksToken(
    chain: ChainId,
    token: KnownTokenId.StacksToken,
  ): Promise<undefined | StacksContractAddress> {
    if (!KnownChainId.isStacksChain(chain)) return
    const info = await getStacksTokenContractInfo(chain, token)
    if (info == null) return
    return {
      deployerAddress: info.deployerAddress,
      contractName: info.contractName,
    }
  }
  async stacksAddressToStacksToken(
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
