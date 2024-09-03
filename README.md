# XLinkSDK
XLink is designed to facilitate the transfer of digital tokens between different blockchains. Its primary purpose is to act as a bridge, enabling users to move and swap their tokens seamlessly across various blockchain ecosystems.

## System Type and Purpose

XLinkSDK allows users to interact with XLink. It can be used in backend environments as well as in browsers and mobile applications. The SDK enables bidirectional transfer of coins/tokens between Bitcoin, Stacks, and various EVM including Bitcoin Layer 2s networks. Also, provides information on transfer fees, route planning, transaction size calculations and implements security features for safe transfers.

## Roadmap

- [x] Bitcoin <> EVM
- [x] Bitcoin <> Stacks
- [ ] Runes <> Stacks
- [ ] BRC-20 <> Stacks
- [x] EVM <> EVM
- [x] EVM <> Bitcoin
- [x] EVM <> Stacks

## Installation

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/en)
- [pnpm](https://pnpm.io/)

### Installation
To install the XLink SDK, use the following command:
```bash
pnpm install @xlink-network/xlink-sdk
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
The [`XLinkSDK`](https://releases-latest.xlink-sdk.pages.dev/modules/XLinkSDK) object contains the most important functions of this library, all grouped together. To create it:

```typescript
const theSdk = new XLinkSDK();
```

For detailed API documentation, including a full list of available methods and their usage, please refer to:

[SDK API Documentation](https://releases-latest.xlink-sdk.pages.dev)

### Use Cases

Create an instance of the SDK with default options
```typescript
import{ XLinkSDK } from '@xlink-network/xlink-sdk';
const xlinkSdk = new XLinkSDK();
```
1. Bridge from Stacks
```typescript
import { BridgeInfoFromStacksInput } from '@xlink-network/xlink-sdk/xlinkSdkUtils/bridgeInfoFromStacks';
import { BridgeFromStacksInput } from '@xlink-network/xlink-sdk/xlinkSdkUtils/bridgeFromStacks';
import { KnownChainId, KnownTokenId } from '@xlink-network/xlink-sdk/utils/types/knownIds';

// Get bridge info
const bridgeInfo = await xlinkSdk.bridgeInfoFromStacks({    
    fromChain: KnownChainId.Stacks.Mainnet,
    toChain: KnownChainId.EVM.Ethereum,
    fromToken: KnownTokenId.Stacks.sUSDT,
    toToken: KnownTokenId.EVM.USDT,
    amount: 100,
} as BridgeInfoFromStacksInput);
console.log("Bridge Info:", bridgeInfo);

// Perform the bridge operation
const result = await xlinkSdk.bridgeFromStacks({ 
    fromChain: KnownChainId.Stacks.Mainnet,
    toChain: KnownChainId.EVM.Ethereum,
    fromToken: KnownTokenId.Stacks.sUSDT,
    toToken: KnownTokenId.EVM.USDT,
    toAddress: "0x...",
    amount: 10,
    sendTransaction: async (tx: ContractCallOptions) => {
        // Implementation for sending transaction from Stacks mainnet
        const network = new StacksMainnet();
        const transaction = await makeContractCall({
            contractAddress: tx.contractAddress,
            contractName: tx.contractName,
            functionName: tx.functionName,
            functionArgs: tx.functionArgs,
            senderKey: /* sender address private key */,
            network,
            postConditions: tx.postConditions,
            anchorMode: tx.anchorMode,
        });
        const broadcastResponse = await broadcastTransaction(transaction, network);
        return broadcastResponse.txid;
    } 
} as BridgeFromStacksInput);
console.log("Transaction ID:", result.txid);
```

2. Bridge from EVM
```typescript
import { BridgeInfoFromEVMInput } from '@xlink-network/xlink-sdk/xlinkSdkUtils/bridgeInfoFromEVM';
import { BridgeFromEVMInput } from '@xlink-network/xlink-sdk/xlinkSdkUtils/bridgeFromEVM';
import { KnownChainId, KnownTokenId } from '@xlink-network/xlink-sdk/utils/types/knownIds';

// Get bridge info
const bridgeInfo = await xlinkSdk.bridgeInfoFromEVM({
    fromChain: KnownChainId.EVM.Ethereum,
    toChain: KnownChainId.Stacks.Mainnet,
    fromToken: KnownTokenId.EVM.USDT,
    toToken: KnownTokenId.Stacks.sUSDT,
    amount: 100,
} as BridgeInfoFromEVMInput);
console.log("Bridge Info:", bridgeInfo);

// Perform the bridge operation
const result = await xlinkSdk.bridgeFromEVM({
    fromChain: KnownChainId.EVM.Ethereum,
    toChain: KnownChainId.Stacks.Mainnet,
    fromToken: KnownTokenId.EVM.USDT,
    toToken: KnownTokenId.Stacks.sUSDT,
    toAddress: "0x...",
    amount: 10,
    sendTransaction: // Implementation for sending transaction from EVM chain
} as BridgeFromEVMInput);
console.log("Transaction ID:", result.txHash);
```

3. Bridge from Bitcoin
```typescript
import { BridgeInfoFromBitcoinInput } from '@xlink-network/xlink-sdk/xlinkSdkUtils/bridgeInfoFromBitcoin';
import { BridgeFromBitcoinInput } from '@xlink-network/xlink-sdk/xlinkSdkUtils/bridgeFromBitcoin';
import { KnownChainId, KnownTokenId } from '@xlink-network/xlink-sdk/utils/types/knownIds';

// Get bridge info
const bridgeInfo = await xlinkSdk.bridgeInfoFromBitcoin({
    fromChain: KnownChainId.Bitcoin.Mainnet,
    toChain: KnownChainId.EVM.Ethereum,
    amount: 1,
} as BridgeInfoFromBitcoinInput);
console.log("Bridge Info:", bridgeInfo);

// Perform the bridge operation
const result = await xlinkSdk.bridgeFromBitcoin({
    fromChain: KnownChainId.Bitcoin.Mainnet,
    toChain: KnownChainId.EVM.Ethereum,
    fromToken: KnownTokenId.Bitcoin.BTC,
    toToken: KnownTokenId.EVM.WBTC,
    fromAddress: "bitcoin address",
    fromAddressScriptPubKey: scriptPubKey,
    toAddress: "0x...",
    amount: 1,
    networkFeeRate: 10n,
    reselectSpendableUTXOs: // Implementation for reselect UTXOs
    signPsbt: // Implementation for signing PSBT
} as BridgeFromBitcoinInput);
console.log("Transaction ID:", result.tx);
```