import { Client } from "viem"
import { getBTCPegInAddress } from "./bitcoinUtils/btcAddresses"
import { nativeCurrencyAddress } from "./evmUtils/addressHelpers"
import {
  defaultEvmClients,
  evmChainIdFromKnownChainId,
  evmChainIdToKnownChainId,
} from "./evmUtils/evmClients"
import {
  getEVMContractCallInfo,
  getEVMToken,
  getEVMTokenContractInfo,
} from "./evmUtils/xlinkContractHelpers"
import { getRunesSupportedRoutes } from "./metaUtils/apiHelpers/getRunesSupportedRoutes"
import { getBRC20SupportedRoutes } from "./metaUtils/apiHelpers/getBRC20SupportedRoutes"
import {
  getStacksToken,
  getStacksTokenContractInfo,
} from "./stacksUtils/xlinkContractHelpers"
import { TooManyRequestsError } from "./utils/apiHelpers"
import {
  DefinedRoute,
  GetSupportedRoutesFn_Conditions,
  KnownRoute,
} from "./utils/buildSupportedRoutes"
import { TooFrequentlyError } from "./utils/errors"
import { KnownChainId, KnownTokenId } from "./utils/types/knownIds"
import {
  BridgeFromBitcoinInput,
  BridgeFromBitcoinOutput,
  bridgeFromBitcoin,
  supportedRoutes as supportedRoutesFromBitcoin,
} from "./xlinkSdkUtils/bridgeFromBitcoin"
import {
  BridgeFromEVMInput,
  BridgeFromEVMOutput,
  bridgeFromEVM,
  supportedRoutes as supportedRoutesFromEVM,
} from "./xlinkSdkUtils/bridgeFromEVM"
import {
  BridgeFromStacksInput,
  BridgeFromStacksOutput,
  bridgeFromStacks,
  supportedRoutes as supportedRoutesFromStacks,
} from "./xlinkSdkUtils/bridgeFromStacks"
import {
  BridgeInfoFromBitcoinInput,
  BridgeInfoFromBitcoinOutput,
  bridgeInfoFromBitcoin,
} from "./xlinkSdkUtils/bridgeInfoFromBitcoin"
import {
  BridgeInfoFromEVMInput,
  BridgeInfoFromEVMOutput,
  bridgeInfoFromEVM,
} from "./xlinkSdkUtils/bridgeInfoFromEVM"
import {
  BridgeInfoFromStacksInput,
  BridgeInfoFromStacksOutput,
  bridgeInfoFromStacks,
} from "./xlinkSdkUtils/bridgeInfoFromStacks"
import {
  EstimateBridgeTransactionFromBitcoinInput,
  EstimateBridgeTransactionFromBitcoinOutput,
  estimateBridgeTransactionFromBitcoin,
} from "./xlinkSdkUtils/estimateBridgeTransactionFromBitcoin"
import {
  ClaimTimeLockedAssetsInput,
  ClaimTimeLockedAssetsOutput,
  GetTimeLockedAssetsInput,
  GetTimeLockedAssetsOutput,
  claimTimeLockedAssetsFromEVM,
  getTimeLockedAssetsFromEVM,
} from "./xlinkSdkUtils/timelockFromEVM"
import {
  ChainId,
  EVMAddress,
  EVMNativeCurrencyAddress,
  PublicEVMContractType,
  StacksContractAddress,
  evmNativeCurrencyAddress,
} from "./xlinkSdkUtils/types"
import { SDKGlobalContext } from "./xlinkSdkUtils/types.internal"

export {
  GetSupportedRoutesFn_Conditions,
  KnownRoute,
} from "./utils/buildSupportedRoutes"
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
  __experimental?: {
    backendAPI?: {
      runtimeEnv?: "prod" | "dev"
    }
    btc?: {
      ignoreValidateResult?: boolean
    }
    brc20?: {
      ignoreValidateResult?: boolean
    }
    runes?: {
      ignoreValidateResult?: boolean
    }
  }
  evm?: {
    /**
     * @default true
     */
    cacheOnChainConfig?: boolean

    /**
     * You can assign your custom viem clients here
     *
     * @default undefined
     */
    viemClients?: Record<KnownChainId.EVMChain, Client>
  }
}

let defaultConfig: XLinkSDKOptions = {
  evm: {
    cacheOnChainConfig: true,
  },
}

export class XLinkSDK {
  static defaultConfig(options: XLinkSDKOptions): void {
    defaultConfig = options
  }

  private sdkContext: SDKGlobalContext

  constructor(options: XLinkSDKOptions = {}) {
    const cacheEVMOnChainConfig =
      options.evm?.cacheOnChainConfig ?? defaultConfig.evm?.cacheOnChainConfig

    this.sdkContext = {
      backendAPI: {
        ...options.__experimental?.backendAPI,
        runtimeEnv: options.__experimental?.backendAPI?.runtimeEnv ?? "prod",
      },
      stacks: {
        tokensCache: new Map(),
      },
      btc: {
        ignoreValidateResult:
          options.__experimental?.btc?.ignoreValidateResult ?? false,
      },
      brc20: {
        routesConfigCache: new Map(),
        ignoreValidateResult:
          options.__experimental?.brc20?.ignoreValidateResult ?? false,
      },
      runes: {
        routesConfigCache: new Map(),
        ignoreValidateResult:
          options.__experimental?.runes?.ignoreValidateResult ?? false,
      },
      evm: {
        routesConfigCache: new Map(),
        onChainConfigCache: cacheEVMOnChainConfig ? new Map() : undefined,
        viemClients: {
          ...defaultEvmClients,
          ...options.evm?.viemClients,
        },
      },
    }
  }

  /**
   * This function retrieves the list of supported routes for token transfers between blockchain
   * networks, filtered based on optional conditions. It aggregates the results from different
   * blockchain networks (Stacks, EVM, Bitcoin) to return a list of possible routes.
   * @param conditions - An optional object containing the conditions for filtering the supported routes:
   * - `fromChain?: ChainId` - The ID of the source blockchain (optional).
   * - `toChain?: ChainId` - The ID of the destination blockchain (optional).
   * - `fromToken?: TokenId` - The ID of the token being transferred from the source blockchain (optional).
   * - `toToken?: TokenId` - The ID of the token expected on the destination blockchain (optional).
   *
   * @returns A promise that resolves with an array of `KnownRoute` objects, each representing a
   * possible route for the token transfer.
   */
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

  async isSupportedRoute(route: DefinedRoute): Promise<boolean> {
    const checkingResult = await Promise.all(
      [
        supportedRoutesFromStacks,
        supportedRoutesFromEVM,
        supportedRoutesFromBitcoin,
      ].map(rule =>
        rule
          .checkRouteValid(this.sdkContext, route)
          .then(() => true)
          .catch(() => false),
      ),
    )

    return checkingResult.some(r => r)
  }

  stacksAddressFromStacksToken(
    chain: ChainId,
    token: KnownTokenId.StacksToken,
  ): Promise<undefined | StacksContractAddress> {
    return stacksAddressFromStacksToken(this.sdkContext, chain, token)
  }
  stacksAddressToStacksToken(
    chain: ChainId,
    address: StacksContractAddress,
  ): Promise<undefined | KnownTokenId.StacksToken> {
    return stacksAddressToStacksToken(this.sdkContext, chain, address)
  }

  /**
   * This function provides detailed information about token transfers from the Stacks network to other supported
   * blockchain networks, including Bitcoin and EVM-compatible chains. It verifies the validity of the transfer
   * route and retrieves bridge information based on the destination chain and tokens.
   * @param input - An object containing the input parameters required for retrieving bridge information:
   * - `fromChain: ChainId` - The ID of the source blockchain (Stacks in this case).
   * - `toChain: ChainId` - The ID of the destination blockchain (Bitcoin, EVM-compatible chains, etc.).
   * - `fromToken: TokenId` - The token being transferred from the Stacks network.
   * - `toToken: TokenId` - The token expected on the destination chain.
   * - `amount: SDKNumber` - The amount of tokens involved in the transfer.
   *
   * @returns A promise that resolves with an object containing detailed information about the token transfer, including:
   * - `fromChain: KnownChainId.KnownChain` - The source blockchain.
   * - `fromToken: KnownTokenId.KnownToken` - The token being transferred from the Stacks network.
   * - `toChain: KnownChainId.KnownChain` - The destination blockchain.
   * - `toToken: KnownTokenId.KnownToken` - The token expected on the destination chain.
   * - `fromAmount: SDKNumber` - The amount of tokens being transferred.
   * - `toAmount: SDKNumber` - The amount of tokens expected on the destination chain after the transfer.
   * - `feeAmount: SDKNumber` - The fee amount deducted during the transfer.
   * @throws UnsupportedBridgeRouteError - If the provided route between the source and destination
   * chains or tokens is unsupported.
   */
  bridgeInfoFromStacks(
    input: BridgeInfoFromStacksInput,
  ): Promise<BridgeInfoFromStacksOutput> {
    return bridgeInfoFromStacks(this.sdkContext, input)
  }

  /**
   * This function facilitates the transfer of tokens from the Stacks network to other supported blockchain
   * networks, including Bitcoin and EVM-compatible chains. It validates the route and calls the appropriate
   * bridging function based on the destination chain and tokens involved.
   * @param input -  An object containing the input parameters required for the bridging operation:
   * - `fromChain: ChainId` - The ID of the source blockchain.
   * - `toChain: ChainId` - The ID of the destination blockchain (Bitcoin, EVM, etc.).
   * - `fromToken: TokenId` - The token being transferred from the source chain.
   * - `toToken: TokenId` - The token expected on the destination chain.
   * - `fromAddress: string` - The sender's address on the source chain.
   * - `toAddress: string` - The recipient's address on the destination blockchain.
   * - `amount: SDKNumber` - The amount of tokens to transfer.
   * - `sendTransaction` - // Implementation for sending transaction from Stacks mainnet.
   *
   * @returns A promise that resolves with the transaction ID (`txid`) of the bridging operation.
   * @throws UnsupportedBridgeRouteError - If the provided route between the source and destination
   * chains or tokens is unsupported.
   */
  bridgeFromStacks(
    input: BridgeFromStacksInput,
  ): Promise<BridgeFromStacksOutput> {
    return bridgeFromStacks(this.sdkContext, input)
  }

  /**
   * This function retrieves the contract address of a specific type of contract
   * (e.g., a bridge endpoint) on a given EVM-compatible blockchain.
   * @param chain - The ID of the EVM-compatible blockchain where the contract is deployed.
   * @param contractType - The type of contract (e.g., `PublicEVMContractType.BridgeEndpoint`)
   * for which the address is to be retrieved.
   *
   * @returns A promise that resolves with the contract address of the specified type, or
   * `undefined` if the chain is not EVM-compatible or if the address cannot be retrieved.
   */
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

  async evmChainIdFromKnownChainId(
    chain: KnownChainId.EVMChain,
  ): Promise<undefined | bigint> {
    return evmChainIdFromKnownChainId(chain)
  }

  async evmChainIdToKnownChainId(
    chainId: bigint,
  ): Promise<undefined | KnownChainId.EVMChain> {
    return evmChainIdToKnownChainId(chainId)
  }

  /**
   * This function retrieves the contract address of a specific token on a given EVM-compatible blockchain.
   * @param chain - The ID of the EVM-compatible blockchain where the token contract is deployed.
   * @param token - The specific token ID for which the contract address is to be retrieved.
   *
   * @returns A promise that resolves with the contract address of the token, or `undefined` if the
   * chain is not EVM-compatible or if the contract address cannot be retrieved.
   */
  async evmAddressFromEVMToken(
    chain: ChainId,
    token: KnownTokenId.EVMToken,
  ): Promise<undefined | EVMAddress | EVMNativeCurrencyAddress> {
    if (!KnownChainId.isEVMChain(chain)) return
    const info = await getEVMTokenContractInfo(this.sdkContext, chain, token)
    const addr = info?.tokenContractAddress
    if (addr === nativeCurrencyAddress) {
      return evmNativeCurrencyAddress
    }
    return addr
  }

  /**
   * This function maps a given contract address on an EVM-compatible blockchain to its corresponding known token ID.
   * @param chain - The ID of the EVM-compatible blockchain where the contract is deployed.
   * @param address - The contract address on the EVM-compatible blockchain.
   *
   * @returns A promise that resolves with the known token ID corresponding to the provided contract
   * address, or `undefined` if the token ID cannot be found or if the chain is not EVM-compatible.
   */
  async evmAddressToEVMToken(
    chain: ChainId,
    address: EVMAddress | EVMNativeCurrencyAddress,
  ): Promise<undefined | KnownTokenId.EVMToken> {
    if (!KnownChainId.isEVMChain(chain)) return
    if (address === evmNativeCurrencyAddress) {
      address = nativeCurrencyAddress
    }
    return getEVMToken(this.sdkContext, chain, address)
  }

  /**
   * This function provides detailed information about token transfers from an EVM-compatible blockchain to other supported
   * blockchain networks, including Stacks, Bitcoin, and other EVM-compatible chains. It verifies the validity of the transfer
   * route and retrieves bridge information based on the destination chain and tokens.
   * @param input - An object containing the input parameters required for retrieving bridge information:
   * - `fromChain: ChainId` - The ID of the source blockchain (Stacks in this case).
   * - `toChain: ChainId` - The ID of the destination blockchain (Bitcoin, EVM-compatible chains, etc.).
   * - `fromToken: TokenId` - The token being transferred from the Stacks network.
   * - `toToken: TokenId` - The token expected on the destination chain.
   * - `amount: SDKNumber` - The amount of tokens involved in the transfer.
   *
   * @returns A promise that resolves with an object containing detailed information about the token transfer, including:
   * - `fromChain: KnownChainId.KnownChain` - The source blockchain.
   * - `fromToken: KnownTokenId.KnownToken` - The token being transferred from the Stacks network.
   * - `toChain: KnownChainId.KnownChain` - The destination blockchain.
   * - `toToken: KnownTokenId.KnownToken` - The token expected on the destination chain.
   * - `fromAmount: SDKNumber` - The amount of tokens being transferred.
   * - `toAmount: SDKNumber` - The amount of tokens expected on the destination chain after the transfer.
   * - `feeAmount: SDKNumber` - The fee amount deducted during the transfer.
   * @throws UnsupportedBridgeRouteError - If the provided route between the source and destination
   * chains or tokens is unsupported.
   */
  bridgeInfoFromEVM(
    input: BridgeInfoFromEVMInput,
  ): Promise<BridgeInfoFromEVMOutput> {
    return bridgeInfoFromEVM(this.sdkContext, input)
  }

  /**
   * This function facilitates the transfer of tokens from an EVM-compatible blockchain to other supported
   * blockchain networks, including Stacks, Bitcoin, and other EVM-compatible chains. It validates the
   * route and calls the appropriate bridging function based on the destination chain and tokens involved.
   * @param input - An object containing the input parameters required for the bridging operation:
   * - `fromChain: ChainId` - The ID of the source blockchain (an EVM-compatible chain in this case).
   * - `toChain: ChainId` - The ID of the destination blockchain (Stacks, Bitcoin, or another EVM-compatible chain).
   * - `fromToken: TokenId` - The token being transferred from the EVM-compatible blockchain.
   * - `toToken: TokenId` - The token expected on the destination chain.
   * - `fromAddress: string` - The sender's address on the source chain.
   * - `toAddress: string` - The recipient's address on the destination blockchain.
   * - `toAddressScriptPubKey?: Uint8Array` - The script public key for the `toAddress`, required when the destination is a Bitcoin chain.
   * - `amount: SDKNumber` - The amount of tokens to transfer.
   * - `sendTransaction` - // Implementation for sending transaction from EVM chain.
   *
   * @returns A promise that resolves with the transaction hash (`txHash`) of the bridging operation.
   * @throws UnsupportedBridgeRouteError - If the provided route between the source and destination
   * chains or tokens is unsupported.
   */
  bridgeFromEVM(input: BridgeFromEVMInput): Promise<BridgeFromEVMOutput> {
    return bridgeFromEVM(this.sdkContext, input)
  }

  /**
   * This function retrieves a list of time-locked assets for a given wallet address across multiple EVM-compatible
   * blockchain networks. It queries smart contracts to find and return information about the assets that are
   * currently locked in time-based agreements.
   * @param input - An object containing the input parameters required for retrieving time-locked assets:
   * - `walletAddress: EVMAddress` - The address of the wallet for which to retrieve the time-locked assets.
   * - `chains: KnownChainId.EVMChain[]` - An array of EVM-compatible blockchains to query for locked assets.
   *
   * @returns A promise that resolves with an object containing a list of time-locked assets:
   * - `assets: TimeLockedAsset[]` - An array of objects, each representing a time-locked asset, including:
   *   - `id: string` - The unique identifier of the time-locked agreement.
   *   - `chain: KnownChainId.EVMChain` - The blockchain where the asset is locked.
   *   - `token: KnownTokenId.EVMToken` - The token that is locked.
   *   - `amount: SDKNumber` - The amount of the token that is locked.
   *   - `releaseTime: Date` - The time when the asset is scheduled to be released.
   *
   * @throws UnsupportedChainError - If any of the provided EVM chains is unsupported or invalid.
   */
  getTimeLockedAssetsFromEVM(
    input: GetTimeLockedAssetsInput,
  ): Promise<GetTimeLockedAssetsOutput> {
    return getTimeLockedAssetsFromEVM(this.sdkContext, input)
  }

  /**
   * This function facilitates the claiming of time-locked assets on EVM-compatible chains. It uses smart
   * contract functions to execute the release of locked assets based on predefined conditions.
   * @param input - An object containing the input parameters required for claiming time-locked assets:
   * - `chain: KnownChainId.EVMChain` - The ID of the EVM-compatible blockchain where the assets are locked.
   * - `lockedAssetIds: string[]` - An array of IDs representing the locked assets to be claimed.
   * - `sendTransaction` - // Implementation for sending transaction from EVM chain.
   *
   * @returns A promise that resolves with the transaction hash (`txHash`) of the claiming operation, or `undefined` if the operation fails.
   * @throws UnsupportedChainError - If the provided EVM chain is unsupported or invalid.
   */
  claimTimeLockedAssetsFromEVM(
    input: ClaimTimeLockedAssetsInput,
  ): Promise<undefined | ClaimTimeLockedAssetsOutput> {
    return claimTimeLockedAssetsFromEVM(this.sdkContext, input)
  }

  async bitcoinReceiverAddress(
    fromChain: ChainId,
    toChain: ChainId,
  ): Promise<undefined | { address: string; scriptPubKey: Uint8Array }> {
    if (!KnownChainId.isBitcoinChain(fromChain)) return
    if (!KnownChainId.isKnownChain(toChain)) return
    return getBTCPegInAddress(fromChain, toChain)
  }

  /**
   * This function provides detailed information about token transfers from the Bitcoin network to other supported
   * blockchain networks, including Stacks and EVM-compatible chains. It verifies the validity of the transfer route
   * and retrieves bridge information based on the destination chain.
   * @param info - An object containing the input parameters required for retrieving bridge information:
   * - `fromChain: ChainId` - The ID of the source blockchain.
   * - `toChain: ChainId` - The ID of the destination blockchain (Stacks, EVM, etc.).
   * - `amount: SDKNumber` - The amount of tokens involved in the transfer.
   *
   * @returns A promise that resolves with an object containing detailed information about the token transfer, including:
   * - `fromChain: KnownChainId.KnownChain` - The source blockchain.
   * - `fromToken: KnownTokenId.KnownToken` - The token being transferred from the Bitcoin network.
   * - `toChain: KnownChainId.KnownChain` - The destination blockchain.
   * - `toToken: KnownTokenId.KnownToken` - The token expected on the destination chain.
   * - `fromAmount: SDKNumber` - The amount of tokens being transferred.
   * - `toAmount: SDKNumber` - The amount of tokens expected on the destination chain after the transfer.
   * - `feeAmount: SDKNumber` - The fee amount deducted during the transfer.
   * @throws UnsupportedBridgeRouteError - If the provided route between the source and destination
   * chains is unsupported.
   */
  bridgeInfoFromBitcoin(
    input: BridgeInfoFromBitcoinInput,
  ): Promise<BridgeInfoFromBitcoinOutput> {
    return bridgeInfoFromBitcoin(this.sdkContext, input).catch(err => {
      if (err instanceof TooManyRequestsError) {
        throw new TooFrequentlyError(
          ["bridgeInfoFromBitcoin"],
          err.retryAfter,
          {
            cause: err,
          },
        )
      }
      throw err
    })
  }
  /**
   * This function estimates the transaction fee and vSize for move or swap tokens from the Bitcoin network
   * to other supported blockchain networks, including Stacks and EVM-compatible chains.
   * @param input - An object containing the input parameters required for estimating the transaction:
   * - `fromChain: ChainId` - The ID of the source blockchain (Bitcoin in this case).
   * - `toChain: ChainId` - The ID of the destination blockchain (Stacks, EVM-compatible chains, etc.).
   * - `fromToken: TokenId` - The token being transferred from the Bitcoin network.
   * - `toToken: TokenId` - The token expected on the destination chain.
   * - `fromAddress: string` - The source address on the Bitcoin network.
   * - `fromAddressScriptPubKey: Uint8Array` - The script public key of the source address.
   * - `toAddress: string` - The destination address on the target blockchain.
   * - `amount: SDKNumber` - The amount of tokens to be transferred.
   * - `networkFeeRate: bigint` - The fee rate for the Bitcoin network.
   * - `reselectSpendableUTXOs` - // Implementation for reselect UTXOs.
   *
   * @returns A promise that resolves with an object containing the estimated transaction details:
   * - `fee: SDKNumber` - The estimated transaction fee.
   * - `estimatedVSize: SDKNumber` - The estimated vSize of the transaction.
   * @throws UnsupportedBridgeRouteError - If the provided route between the source and destination
   * chains or tokens is unsupported.
   */
  estimateBridgeTransactionFromBitcoin(
    input: EstimateBridgeTransactionFromBitcoinInput,
  ): Promise<EstimateBridgeTransactionFromBitcoinOutput> {
    return estimateBridgeTransactionFromBitcoin(this.sdkContext, input).catch(
      err => {
        if (err instanceof TooManyRequestsError) {
          throw new TooFrequentlyError(
            ["estimateBridgeTransactionFromBitcoin"],
            err.retryAfter,
            {
              cause: err,
            },
          )
        }
        throw err
      },
    )
  }
  /**
   * This function facilitates the transfer of tokens from the Bitcoin network to other supported
   * blockchain networks. It checks the validity of the route and then calls the appropriate
   * bridging function based on the destination chain.
   * @param input - An object containing the input parameters required for the bridging operation:
   * - `fromChain: ChainId` - The ID of the source blockchain.
   * - `toChain: ChainId` - The ID of the destination blockchain (Stacks, EVM, etc.).
   * - `fromToken: TokenId` - The token being transferred from the Bitcoin network.
   * - `toToken: TokenId` - The token expected on the destination chain.
   * - `fromAddress: string` - The source address on the Bitcoin network.
   * - `fromAddressScriptPubKey: Uint8Array` - The script public key corresponding to the `fromAddress`.
   * - `toAddress: string` - The recipient's address on the destination blockchain.
   * - `amount: SDKNumber` - The amount of tokens to transfer.
   * - `networkFeeRate: bigint` - The network fee rate to be used for the transaction.
   * - `reselectSpendableUTXOs: ReselectSpendableUTXOsFn`.
   * - `signPsbt: BridgeFromBitcoinInput_signPsbtFn`.
   *
   * @returns A promise that resolves with the transaction ID (`tx`) of the bridging operation.
   * @throws UnsupportedBridgeRouteError - If the provided route between the source and destination
   * chains or tokens is unsupported.
   */
  bridgeFromBitcoin(
    input: BridgeFromBitcoinInput,
  ): Promise<BridgeFromBitcoinOutput> {
    return bridgeFromBitcoin(this.sdkContext, input).catch(err => {
      if (err instanceof TooManyRequestsError) {
        throw new TooFrequentlyError(["bridgeFromBitcoin"], err.retryAfter, {
          cause: err,
        })
      }
      throw err
    })
  }

  brc20TickFromBRC20Token(
    chain: ChainId,
    token: KnownTokenId.BRC20Token,
  ): Promise<undefined | string> {
    return brc20TickFromBRC20Token(this.sdkContext, chain, token)
  }
  brc20TickToBRC20Token(
    chain: ChainId,
    tick: string,
  ): Promise<undefined | KnownTokenId.BRC20Token> {
    return brc20TickToBRC20Token(this.sdkContext, chain, tick)
  }

  runesIdFromRunesToken(
    chain: ChainId,
    token: KnownTokenId.RunesToken,
  ): Promise<undefined | `${number}:${number}`> {
    return runesIdFromRunesToken(this.sdkContext, chain, token)
  }
  runesIdToRunesToken(
    chain: ChainId,
    id: `${number}:${number}`,
  ): Promise<undefined | KnownTokenId.RunesToken> {
    return runesIdToRunesToken(this.sdkContext, chain, id)
  }
}

/**
 * This function retrieves the contract address associated with a specific token on the Stacks blockchain.
 * @param chain - The ID of the Stacks blockchain.
 * @param token - The specific token ID for which the contract address is to be retrieved.
 *
 * @returns A promise that resolves with the contract address associated with the specified token,
 * or `undefined` if the chain is not a Stacks chain or if the contract address cannot be retrieved.
 */
async function stacksAddressFromStacksToken(
  sdkContext: SDKGlobalContext,
  chain: ChainId,
  token: KnownTokenId.StacksToken,
): Promise<undefined | StacksContractAddress> {
  if (!KnownChainId.isStacksChain(chain)) return
  const info = await getStacksTokenContractInfo(sdkContext, chain, token)
  if (info == null) return
  return {
    deployerAddress: info.deployerAddress,
    contractName: info.contractName,
  }
}

/**
 * This function maps a given Stacks contract address to its corresponding known token ID.
 * @param chain - The ID of the Stacks blockchain.
 * @param address - The contract address on the Stacks blockchain.
 *
 * @returns A promise that resolves with the known token ID corresponding to the provided
 * contract address, or `undefined` if the chain is not a Stacks chain or if the token ID
 * cannot be found.
 */
async function stacksAddressToStacksToken(
  sdkContext: SDKGlobalContext,
  chain: ChainId,
  address: StacksContractAddress,
): Promise<undefined | KnownTokenId.StacksToken> {
  if (!KnownChainId.isStacksChain(chain)) return
  return getStacksToken(sdkContext, chain, address)
}

async function brc20TickFromBRC20Token(
  sdkContext: SDKGlobalContext,
  chain: ChainId,
  token: KnownTokenId.BRC20Token,
): Promise<undefined | string> {
  if (!KnownChainId.isBRC20Chain(chain)) return
  const routes = await getBRC20SupportedRoutes(sdkContext, chain)
  return routes.find(r => r.brc20Token === token)?.brc20Tick
}
async function brc20TickToBRC20Token(
  sdkContext: SDKGlobalContext,
  chain: ChainId,
  tick: string,
): Promise<undefined | KnownTokenId.BRC20Token> {
  if (!KnownChainId.isBRC20Chain(chain)) return
  const routes = await getBRC20SupportedRoutes(sdkContext, chain)
  return routes.find(r => r.brc20Tick.toLowerCase() === tick.toLowerCase())
    ?.brc20Token
}

async function runesIdFromRunesToken(
  sdkContext: SDKGlobalContext,
  chain: ChainId,
  token: KnownTokenId.RunesToken,
): Promise<undefined | `${number}:${number}`> {
  if (!KnownChainId.isRunesChain(chain)) return
  const routes = await getRunesSupportedRoutes(sdkContext, chain)
  return routes.find(r => r.runesToken === token)?.runesId
}
async function runesIdToRunesToken(
  sdkContext: SDKGlobalContext,
  chain: ChainId,
  runesId: `${number}:${number}`,
): Promise<undefined | KnownTokenId.RunesToken> {
  if (!KnownChainId.isRunesChain(chain)) return
  const routes = await getRunesSupportedRoutes(sdkContext, chain)
  return routes.find(r => r.runesId === runesId)?.runesToken
}
