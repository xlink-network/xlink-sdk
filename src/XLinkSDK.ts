import {
  getEVMContractCallInfo,
  getEVMToken,
  getEVMTokenContractInfo,
} from "./evmUtils/xlinkContractHelpers"
import {
  getStacksToken,
  getStacksTokenContractInfo,
} from "./stacksUtils/xlinkContractHelpers"
import {
  GetSupportedRoutesFn_Conditions,
  KnownRoute,
} from "./utils/buildSupportedRoutes"
import { KnownChainId, KnownTokenId } from "./utils/types/knownIds"
import {
  bridgeFromBitcoin,
  supportedRoutes as supportedRoutesFromBitcoin,
} from "./xlinkSdkUtils/bridgeFromBitcoin"
import {
  bridgeFromEVM,
  supportedRoutes as supportedRoutesFromEVM,
} from "./xlinkSdkUtils/bridgeFromEVM"
import {
  bridgeFromStacks,
  supportedRoutes as supportedRoutesFromStacks,
} from "./xlinkSdkUtils/bridgeFromStacks"
import { bridgeInfoFromBitcoin } from "./xlinkSdkUtils/bridgeInfoFromBitcoin"
import { bridgeInfoFromEVM } from "./xlinkSdkUtils/bridgeInfoFromEVM"
import { bridgeInfoFromStacks } from "./xlinkSdkUtils/bridgeInfoFromStacks"
import { estimateBridgeTransactionFromBitcoin } from "./xlinkSdkUtils/estimateBridgeTransactionFromBitcoin"
import {
  claimTimeLockedAssetsFromEVM,
  getTimeLockedAssetsFromEVM,
} from "./xlinkSdkUtils/timelockFromEVM"
import {
  ChainId,
  EVMAddress,
  PublicEVMContractType,
  StacksContractAddress,
} from "./xlinkSdkUtils/types"
import { SDKGlobalContext } from "./xlinkSdkUtils/types.internal"

export {
  BridgeFromBitcoinInput,
  BridgeFromBitcoinInput_signPsbtFn,
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
export {
  EstimateBridgeTransactionFromBitcoinInput,
  EstimateBridgeTransactionFromBitcoinOutput,
} from "./xlinkSdkUtils/estimateBridgeTransactionFromBitcoin"
export {
  ClaimTimeLockedAssetsInput,
  ClaimTimeLockedAssetsOutput,
  GetTimeLockedAssetsInput,
  GetTimeLockedAssetsOutput,
} from "./xlinkSdkUtils/timelockFromEVM"

export interface XLinkSDKOptions {
  evm?: {
    /**
     * @default true
     */
    enableMulticall?: boolean

    /**
     * @default true
     */
    cacheOnChainConfig?: boolean
  }
}

let defaultConfig: XLinkSDKOptions = {
  evm: {
    enableMulticall: true,
    cacheOnChainConfig: true,
  },
}

export class XLinkSDK {
  private sdkContext: SDKGlobalContext

  static defaultConfig(options: XLinkSDKOptions): void {
    defaultConfig = options
  }

  constructor(options: XLinkSDKOptions = {}) {
    const cacheEVMOnChainConfig =
      options.evm?.cacheOnChainConfig ?? defaultConfig.evm?.cacheOnChainConfig

    this.sdkContext = {
      evm: {
        enableMulticall:
          options.evm?.enableMulticall ?? defaultConfig.evm?.enableMulticall,
        onChainConfigCache: cacheEVMOnChainConfig ? new Map() : undefined,
      },
    }
  }

  async getSupportedRoutes(
    conditions?: GetSupportedRoutesFn_Conditions,
  ): Promise<KnownRoute[]> {
    const promises = [
      supportedRoutesFromStacks,
      supportedRoutesFromEVM,
      supportedRoutesFromBitcoin,
    ].map(async rules => rules.getSupportedRoutes(this.sdkContext, conditions))

    return (await Promise.all(promises)).flat()
  }

  stacksAddressFromStacksToken = stacksAddressFromStacksToken
  stacksAddressToStacksToken = stacksAddressToStacksToken
  bridgeInfoFromStacks = bridgeInfoFromStacks
  bridgeFromStacks = bridgeFromStacks

  async getEVMContractAddress(
    chain: ChainId,
    contractType: PublicEVMContractType,
  ): Promise<undefined | EVMAddress> {
    if (!KnownChainId.isEVMChain(chain)) return

    const info = await getEVMContractCallInfo(this.sdkContext, chain)
    if (contractType === PublicEVMContractType.BridgeEndpoint) {
      return info?.bridgeEndpointContractAddress
    }
    return
  }
  async evmAddressFromEVMToken(
    chain: ChainId,
    token: KnownTokenId.EVMToken,
  ): Promise<undefined | EVMAddress> {
    if (!KnownChainId.isEVMChain(chain)) return
    const info = await getEVMTokenContractInfo(this.sdkContext, chain, token)
    return info?.tokenContractAddress
  }
  async evmAddressToEVMToken(
    chain: ChainId,
    address: EVMAddress,
  ): Promise<undefined | KnownTokenId.EVMToken> {
    if (!KnownChainId.isEVMChain(chain)) return
    return getEVMToken(this.sdkContext, chain, address)
  }
  bridgeInfoFromEVM = bridgeInfoFromEVM
  bridgeFromEVM = bridgeFromEVM
  getTimeLockedAssetsFromEVM = getTimeLockedAssetsFromEVM
  claimTimeLockedAssetsFromEVM = claimTimeLockedAssetsFromEVM

  bridgeInfoFromBitcoin = bridgeInfoFromBitcoin
  estimateBridgeTransactionFromBitcoin = estimateBridgeTransactionFromBitcoin
  bridgeFromBitcoin = bridgeFromBitcoin
}

async function stacksAddressFromStacksToken(
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
async function stacksAddressToStacksToken(
  chain: ChainId,
  address: StacksContractAddress,
): Promise<undefined | KnownTokenId.StacksToken> {
  if (!KnownChainId.isStacksChain(chain)) return
  return getStacksToken(chain, address)
}
