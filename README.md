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

| Namespace | mainnet                                                                                              | testnet                                                                                                                                                           |
|-----------|------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Bitcoin   | `Mainnet`                                                                                            | `Testnet`                                                                                                                                                         |
| Stacks    | `Mainnet`                                                                                            | `Testnet`                                                                                                                                                         |
| EVM       | `Ethereum`, `BSC`, `CoreDAO`, `Bsquared`, `BOB`, `Bitlayer`, `Lorenzo`,  `Merlin`, `AILayer`, `Mode` | `Sepolia`, `BSCTestnet`, `CoreDAOTestnet`, `BsquaredTestnet`, `BOBTestnet`, `BitlayerTestnet`, `LorenzoTestnet`, `MerlinTestnet`, `AILayerTestnet`, `ModeTestnet` |

#### KnownTokenId

The `KnownTokenId` namespace manages the token IDs of supported cryptocurrencies across different blockchain networks within the SDK. It ensures that only recognized tokens specific to Bitcoin, EVM-compatible chains, and Stacks are used.

##### Namespaces

| Namespace  | Token                                                                                                |
|------------|------------------------------------------------------------------------------------------------------|
| `Bitcoin`  | `BTC`                                                                                                |
| `Stacks`   | `ALEX`, `aBTC`, `sLUNR`, `sSKO`, `sUSDT`, `uBTC`, `vLiALEX`, `vLiSTX`                                |    
| `EVM`      | `ALEX`, `aBTC`, `BTCB`, `LUNR`, `SKO`, `sUSDT`, `uBTC`, `USDT`, `vLiALEX`, `vLiSTX`, `WBTC`, `wuBTC` |

**Future Support**: Support for Runes and BR20 tokens on the Bitcoin network is planned for a future update. 

### XLink SDK
The [`XLinkSDK`](/modules/XLinkSDK) object contains the most important functions of this library, all grouped together. To create it:

```typescript
const theSdk = new XLinkSDK();
```

For detailed API documentation, including a full list of available methods and their usage, please refer to:

[SDK API Documentation](https://releases-latest.xlink-sdk.pages.dev)

### Use Cases

Create an instance of the SDK with default options
```typescript
import { XLinkSDK } from '@xlink-network/xlink-sdk';
const xlinkSdk = new XLinkSDK();
```

1. Bridge from Stacks
```typescript
import { 
    BridgeInfoFromStacksInput, 
    BridgeFromStacksInput,
    KnownChainId,
    KnownTokenId, 
    toSDKNumberOrUndefined,
} from '@xlink-network/xlink-sdk';

// Get bridge info
const bridgeInfo = await xlinkSdk.bridgeInfoFromStacks({    
    fromChain: KnownChainId.Stacks.Mainnet,
    fromToken: KnownTokenId.Stacks.sUSDT,
    toChain: KnownChainId.EVM.Ethereum,
    toToken: KnownTokenId.EVM.USDT,
    amount: toSDKNumberOrUndefined(100),
});
console.log("Bridge Info:", bridgeInfo);

// Perform the bridge operation
const result = await xlinkSdk.bridgeFromStacks({ 
    fromChain: KnownChainId.Stacks.Mainnet,
    fromToken: KnownTokenId.Stacks.sUSDT,
    toChain: KnownChainId.EVM.Ethereum,
    toToken: KnownTokenId.EVM.USDT,
    fromAddress: "0x...",
    toAddress: "0x...",
    amount: toSDKNumberOrUndefined(10),
    sendTransaction: async tx => {
        // Implementation for sending transaction from Stacks mainnet
        const network = new StacksMainnet();
        const transaction = await makeContractCall({
            contractAddress: tx.contractAddress,
            contractName: tx.contractName,
            functionName: tx.functionName,
            functionArgs: tx.functionArgs,
            senderKey: "sender address private key here",
            network,
            postConditions: tx.postConditions,
            anchorMode: tx.anchorMode,
        });
        const broadcastResponse = await broadcastTransaction(transaction, network);
        return {txid: broadcastResponse.txid};
    },
});
console.log("Transaction ID:", result.txid);
```

2. Bridge from EVM
```typescript
import { 
    BridgeInfoFromEVMInput,
    BridgeFromEVMInput,
    KnownChainId,
    KnownTokenId,
    toSDKNumberOrUndefined,
} from '@xlink-network/xlink-sdk';

// Get bridge info
const bridgeInfo = await xlinkSdk.bridgeInfoFromEVM({
    fromChain: KnownChainId.EVM.Ethereum,
    fromToken: KnownTokenId.EVM.USDT,
    toChain: KnownChainId.Stacks.Mainnet,
    toToken: KnownTokenId.Stacks.sUSDT,
    amount: toSDKNumberOrUndefined(100),
});
console.log("Bridge Info:", bridgeInfo);

// Perform the bridge operation
const result = await xlinkSdk.bridgeFromEVM({
    fromChain: KnownChainId.EVM.Ethereum,
    fromToken: KnownTokenId.EVM.USDT,
    fromAddress: "0x95222290DD7278Aa3D......................",
    toChain: KnownChainId.Stacks.Mainnet,
    toToken: KnownTokenId.Stacks.sUSDT,
    toAddress: "0x95222290DD7278Aa3D......................",
    amount: toSDKNumberOrUndefined(10),
    sendTransaction:  async function (tx: {
      from: `0x${string}`;
      to: `0x${string}`;
      data: Uint8Array;
      recommendedGasLimit: `${string} (XLinkSDK number)`;
    }): Promise<{ txHash: string; }> {
      // Implementation for sending transaction from EVM chain
      return { txHash: "....." }
    }
});
console.log("Transaction ID:", result.txHash);
```

3. Bridge from Bitcoin
```typescript
import { 
    BridgeInfoFromBitcoinInput,
    BridgeFromBitcoinInput,
    KnownChainId,
    KnownTokenId,
    toSDKNumberOrUndefined,
} from '@xlink-network/xlink-sdk';

// Get bridge info
const bridgeInfo = await xlinkSdk.bridgeInfoFromBitcoin({
    fromChain: KnownChainId.Bitcoin.Mainnet,
    fromToken: KnownTokenId.Bitcoin.BTC,
    toChain: KnownChainId.EVM.Ethereum,
    toToken: KnownTokenId.EVM.BTCB,
    amount: toSDKNumberOrUndefined(1),
});
console.log("Bridge Info:", bridgeInfo);

// Perform the bridge operation
const result = await xlinkSdk.bridgeFromBitcoin({
    fromChain: KnownChainId.Bitcoin.Mainnet,
    fromToken: KnownTokenId.Bitcoin.BTC,
    fromAddress: "bitcoin address",
    toChain: KnownChainId.EVM.Ethereum,
    toToken: KnownTokenId.EVM.WBTC,
    toAddress: "0x...",
    fromAddressScriptPubKey: new Uint8Array([10, 20, 30, 40,]),
    amount: toSDKNumberOrUndefined(1),
    networkFeeRate: 10n,
    reselectSpendableUTXOs(satsToSend: bigint, pinnedUTXOs: UTXOSpendable[], lastTimeSelectedUTXOs: UTXOSpendable[]): Promise<UTXOSpendable[]> {
    return Promise.resolve([]);
    },
    signPsbt: function (tx: { psbt: Uint8Array; signInputs: number[]; }): Promise<{ psbt: Uint8Array }> {
    throw new Error("Function not implemented.");
    },
    sendTransaction: function (tx: { hex: string }): Promise<{ txid: string; }> {
    throw new Error("Function not implemented.");
    }

});
console.log("Transaction ID:", result.tx);
```
