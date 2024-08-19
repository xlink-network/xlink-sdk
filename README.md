# XLinkSDK
XLink is designed to facilitate the transfer of digital tokens between different blockchains. Its primary purpose is to act as a bridge, enabling users to move and swap their tokens seamlessly across various blockchain ecosystems.

## System Type and Purpose

XLinkSDK allows users to interact with XLink. It can be used in backend environments as well as in browsers and mobile applications. The SDK enables bidirectional transfer of coins/tokens between Bitcoin, Stacks, and various EVM including Bitcoin Layer 2s networks. Also, provides information on transfer fees, route planning, transaction size calculations and implements security features for safe transfers.

## Installation
### Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/en)
- [pnpm](https://pnpm.io/)

### Installation
To install the XLink SDK, use the following command:
```bash
pnpm install @xlink-project/xlink-sdk
```

## XLink SDK API
### Supported Blockchains and Tokens

#### KnownChainId

The `KnownChainId` namespace encapsulates types and utility functions to validate blockchain networks supported by the SDK. It ensures that only recognized chain IDs across Bitcoin, EVM-compatible chains, and Stacks are used.

| Namespace| mainnet | testnet |
| -------- | -------- | -------- |
| Bitcoin  | `Mainnet`   | `Testnet`     |
| Stacks   | `Mainnet`   | `Testnet`     |
| EVM   | `Ethereum`, `BSC`, `CoreDAO`, `Bsquared`, `BOB`, `Bitlayer`, `Lorenzo`,  `Merlin`, `AILayer`, `Mode`| `Sepolia`, `BSCTestnet`, `CoreDAOTestnet`, `BsquaredTestnet`, `BOBTestnet`, `BitlayerTestnet`, `LorenzoTestnet`, `MerlinTestnet`, `AILayerTestnet`, `ModeTestnet`     |

#### KnownTokenId

The `KnownTokenId` namespace manages the token IDs of supported cryptocurrencies across different blockchain networks within the SDK. It ensures that only recognized tokens specific to Bitcoin, EVM-compatible chains, and Stacks are used.

##### Namespaces

| Namespace | Token |
| -------- | -------- |
| `Bitcoin`   | `BTC`     |
| `Stacks`   | `sUSDT`, `sLUNR`, `aBTC`, `ALEX`, `sSKO`, `vLiSTX`, `vLiALEX` |
| `EVM`   | `USDT`, `LUNR`, `WBTC`, `BTCB`, `aBTC`, `sUSDT`, `ALEX`, `SKO`, `vLiSTX`, `vLiALEX`|

**Future Support**: Support for Runes and BR20 tokens on the Bitcoin network is planned for a future update. 

Note: Users can transfer between different coins/tokens, not just the same token on different blockchains. For example, it's possible to convert BTC to WBTC when moving from Bitcoin to an EVM network.


### XLink SDK

The `XLinkSDK` object contains the most important functions of this library, all grouped together. To create it:

```typescript
const theSdk = new XLinkSDK();
```

These functions are part of the `XLinkSDK` object:

#### bridgeFromBitcoin

This function facilitates the transfer of tokens from the Bitcoin network to other supported blockchain networks. It checks the validity of the route and then calls the appropriate bridging function based on the destination chain.

```typescript
bridgeFromBitcoin(input: BridgeFromBitcoinInput): Promise<BridgeFromBitcoinOutput> 
```

Possible exceptions: `UnsupportedBridgeRouteError`.

#### bridgeFromEVM

This function facilitates the transfer of tokens from an EVM-compatible blockchain to other supported blockchain networks, including Stacks, Bitcoin, and other EVM-compatible chains. It validates the route and calls the appropriate bridging function based on the destination chain and tokens involved.
```typescript
bridgeFromEVM(input: BridgeFromEVMInput): Promise<BridgeFromEVMOutput>
```
Possible exceptions: `UnsupportedBridgeRouteError`.

#### bridgeFromStacks
This function facilitates the transfer of tokens from the Stacks network to other supported blockchain networks, including Bitcoin and EVM-compatible chains. It validates the route and calls the appropriate bridging function based on the destination chain and tokens involved.
```typescript
bridgeFromStacks(input: BridgeFromStacksInput): Promise<BridgeFromStacksOutput>
```
Possible exceptions: `UnsupportedBridgeRouteError`.

#### bridgeInfoFromBitcoin

This function provides detailed information about token transfers from the Bitcoin network to other supported blockchain networks, including Stacks and EVM-compatible chains. It verifies the validity of the transfer route and retrieves bridge information based on the destination chain.

```typescript
const bridgeInfoFromBitcoin = async (info: BridgeInfoFromBitcoinInput): Promise<BridgeInfoFromBitcoinOutput>
```
Possible exceptions: `UnsupportedBridgeRouteError`.

#### bridgeInfoFromEVM

This function provides detailed information about token transfers from an EVM-compatible blockchain to other supported blockchain networks, including Stacks, Bitcoin, and other EVM-compatible chains. It verifies the validity of the transfer route and retrieves bridge information based on the destination chain and tokens.

```typescript
bridgeInfoFromEVM(input: BridgeInfoFromEVMInput): Promise<BridgeInfoFromEVMOutput> 
```
Possible exceptions: `UnsupportedBridgeRouteError`.

#### bridgeInfoFromStacks

This function provides detailed information about token transfers from the Stacks network to other supported blockchain networks, including Bitcoin and EVM-compatible chains. It verifies the validity of the transfer route and retrieves bridge information based on the destination chain and tokens.

```typescript
bridgeInfoFromStacks(input: BridgeInfoFromStacksInput): Promise<BridgeInfoFromStacksOutput>
```
Possible exceptions: `UnsupportedBridgeRouteError`.

#### claimTimeLockedAssetsFromEVM

This function facilitates the claiming of time-locked assets on EVM-compatible chains. It uses smart contract functions to execute the release of locked assets based on predefined conditions.

```typescript
claimTimeLockedAssetsFromEVM(input: ClaimTimeLockedAssetsInput): Promise<undefined | ClaimTimeLockedAssetsOutput> 
```

Possible exceptions: `UnsupportedChainError`.

#### getTimeLockedAssetsFromEVM

This function retrieves a list of time-locked assets for a given wallet address across multiple EVM-compatible blockchain networks. It queries smart contracts to find and return information about the assets that are currently locked in time-based agreements.

```typescript
getTimeLockedAssetsFromEVM(input: GetTimeLockedAssetsInput): Promise<GetTimeLockedAssetsOutput> 
```

Possible exceptions: `UnsupportedChainError`.

#### estimateBridgeTransactionFromBitcoin

This function estimates the transaction fee and vSize for move or swap tokens from the Bitcoin network to other supported blockchain networks, including Stacks and EVM-compatible chains.
```typescript
estimateBridgeTransactionFromBitcoin(input: EstimateBridgeTransactionFromBitcoinInput): Promise<EstimateBridgeTransactionFromBitcoinOutput> 
```

Possible exceptions: `UnsupportedBridgeRouteError`

#### evmAddressFromEVMToken

This function retrieves the contract address of a specific token on a given EVM-compatible blockchain.

```typescript
async evmAddressFromEVMToken(chain: ChainId, token: KnownTokenId.EVMToken): Promise<undefined | EVMAddress>
```

Possible exceptions: None. The function returns `undefined` if the chain is not EVM-compatible or if the contract address cannot be retrieved.

#### evmAddressToEVMToken 

This function maps a given contract address on an EVM-compatible blockchain to its corresponding known token ID.

```typescript
async evmAddressToEVMToken(chain: ChainId, address: EVMAddress): Promise<undefined | KnownTokenId.EVMToken>
```

Possible exceptions: None. The function returns `undefined` if the chain is not EVM-compatible or if the address cannot be matched.

#### getEVMContractAddress

This function retrieves the contract address of a specific type of contract (e.g., a bridge endpoint) on a given EVM-compatible blockchain.

```typescript
async getEVMContractAddress(chain: ChainId, contractType: PublicEVMContractType): Promise<undefined | EVMAddress>
```

Possible exceptions: None. The function returns `undefined` if the chain is not EVM-compatible or if the address cannot be matched.

#### getSupportedRoutes

This function retrieves the list of supported routes for token transfers between blockchain networks, filtered based on optional conditions. It aggregates the results from different blockchain networks (Stacks, EVM, Bitcoin) to return a list of possible routes.

```typescript
async getSupportedRoutes(conditions?: GetSupportedRoutesFn_Conditions): Promise<KnownRoute[]> 
```

Possible exceptions: None.

#### stacksAddressFromStacksToken

This function retrieves the contract address associated with a specific token on the Stacks blockchain. 

```typescript
async function stacksAddressFromStacksToken(chain: ChainId, token: KnownTokenId.StacksToken): Promise<undefined | StacksContractAddress>
```
Possible exceptions: None. The function returns `undefined` if the chainId or token is not valid.

#### stacksAddressToStacksToken

This function maps a given Stacks contract address to its corresponding known token ID.

```typescript
async function stacksAddressToStacksToken(chain: ChainId, address: StacksContractAddress): Promise<undefined | KnownTokenId.StacksToken>
```

Possible exceptions: None. The function returns `undefined` if the chainId or address is not valid.


### Errors

- `InvalidMethodParametersError`: It is thrown when a method in the SDK receives invalid parameters.
- `UnsupportedBridgeRouteError`: It is thrown when an attempt is made to bridge tokens between unsupported chains in the SDK.
- `UnsupportedChainError`: It is thrown when a method in the SDK receives an unknown chain.
- `UnsupportedContractAssignedChainIdError`: It is thrown when a smart contract is assigned an unknown or unsupported chain ID.
- `XLinkSDKErrorBase`: Extends the Error class and serves as the base for all custom errors within the SDK.
