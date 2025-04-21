# BroSDK

🐙 **Brotocol isn't just a bridge—it's the liquidity layer for Bitcoin and the essential connector for Bitcoin DeFi** 🐙

BroSDK enables seamless asset transfers between Bitcoin, Stacks, and EVM-compatible blockchains. It supports cross-chain swaps, Runes & BRC20 metaprotocols, and DEX aggregator integrations.

The SDK allows users to interact with Brotocol smart contracts from backend environments, browsers, and mobile apps. It securely handles cross-chain transfers, fee estimation, route planning, and transaction size calculations by using Brotocol's on-chain and off-chain infrastructure.

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/en)
- [pnpm](https://pnpm.io/)

### Install

```bash
pnpm install @brotocol-xyz/bro-sdk
```

## Usage

The [`BroSDK`](./src/BroSDK.ts) class provides the core functions of the library. To create an instance:

```typescript
import { BroSDK } from "@brotocol-xyz/bro-sdk"
const sdk = new BroSDK()
```

For the full API reference, including a full list of available methods and their usage, visit the [SDK Documentation](https://releases-latest.xlink-sdk.pages.dev).

### Supported Blockchains and Tokens

#### [`KnownChainId`](https://releases-latest.xlink-sdk.pages.dev/modules/index.KnownChainId)

Defines types and utility functions for supported networks, ensuring only valid chain IDs are used within the SDK.

| Namespace | Mainnet                                                                                                                                                       | Testnet                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Bitcoin | `Mainnet`                                                                                                                                                     | `Testnet`                                                                                 |
| Runes | `Mainnet`                                                                                                                                                     | `Testnet`                                                                                 |
| BRC20 | `Mainnet`                                                                                                                                                     | `Testnet`                                                                                 |
| Stacks  | `Mainnet`                                                                                                                                                     | `Testnet`                                                                                 |
| EVM     | `Ethereum`, `BSC`, `CoreDAO`, `Bsquared`, `BOB`, `Bitlayer`, `Lorenzo`, `Merlin`, `AILayer`, `Mode`, `XLayer`, `Arbitrum`, `Aurora`, `Manta`, `Linea`, `Base` | `Sepolia`, `BSCTestnet`, `CoreDAOTestnet`, `BlifeTestnet`, `BitboyTestnet`, `BeraTestnet` |

#### [`KnownTokenId`](https://releases-latest.xlink-sdk.pages.dev/modules/index.KnownTokenId)

Defines types, utility functions, and supported tokens within the SDK.

| Namespace | Tokens                                                                                                                                               |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bitcoin | `BTC`                                                                                                                                                |
| Runes   | _To be confirmed_                                                                                                                                   |
| BRC20   | _To be confirmed_                                                                                                                                   |
| Stacks  | `sUSDT`, `sLUNR`, `aBTC`, `ALEX`, `sSKO`, `vLiSTX`, `vLiALEX`, `vLiaBTC`,`uBTC`, `DB20`, `DOG`, `STX`, `TRUMP`                                       |
| EVM     | `USDT`, `sUSDT`, `USDC`, `aBTC`, `WTCB`, `BTCB`, `cbBTC`, `uBTC`, `wuBTC`, `STX`, `vLiSTX`, `ALEX`, `vLiALEX`, `LUNR`, `SKO`, `DB20`, `DOG`, `TRUMP` |

### Use Cases

Create an instance of the SDK with default options:

```typescript
import { BroSDK } from "@brotocol-xyz/bro-sdk"
const broSdk = new BroSDK()
```

#### Bridge from Stacks

Use case showcasing a transfer of 100 `sUSDT` from Stacks to `USDT` on Ethereum using BroSDK.

```typescript
import {
    BridgeFromStacksInput,
    KnownChainId,
    KnownTokenId,
    toSDKNumberOrUndefined,
} from '@brotocol-xyz/bro-sdk';
import { serializeCVBytes, makeContractCall, broadcastTransaction } from '@stacks/transactions';

// Retrieve bridge information
const bridgeInfo = await broSdk.bridgeInfoFromStacks({
  fromChain: KnownChainId.Stacks.Mainnet,
  toChain: KnownChainId.EVM.Ethereum,
  fromToken: KnownTokenId.Stacks.sUSDT,
  toToken: KnownTokenId.EVM.USDT,
  amount: toSDKNumberOrUndefined(100),
});

console.log("Bridge Info:", bridgeInfo);

// Define bridge operation input
const bridgeFromStacksInput: BridgeFromStacksInput = {
  fromChain: KnownChainId.Stacks.Mainnet,
  toChain: KnownChainId.EVM.Ethereum,
  fromToken: KnownTokenId.Stacks.sUSDT,
  toToken: KnownTokenId.EVM.USDT,
  fromAddress: /* Sender Stacks principal */,
  toAddress: /* Receiver EVM address */,
  amount: toSDKNumberOrUndefined(100),
  sendTransaction: async (tx: ContractCallOptions) => {
    /**
     * Implementation for sending transaction on Stacks mainnet.
     * Refer to: https://github.com/hirosystems/stacks.js/tree/main/packages/transactions#smart-contract-function-call
     */
    const transaction = await makeContractCall({
      contractAddress: tx.contractAddress,
      contractName: tx.contractName,
      functionName: tx.functionName,
      functionArgs: tx.functionArgs,
      postConditions: /* Add post conditions if necessary */,
      validateWithAbi: true,
      senderKey: /* Sender private key */,
      network: "mainnet",
    });

    const broadcastResponse = await broadcastTransaction(transaction, "mainnet");
    return { txid: broadcastResponse.txid };
  },
};

// Example of how a `sendTransaction` argument would look like
const contractCallOptionsExample: ContractCallOptions = {
  contractAddress: "SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK",
  contractName: "cross-peg-out-endpoint-v2-01",
  functionName: "transfer-to-unwrap",
  functionArgs: [].map(arg => serializeCVBytes(arg)), // Array elements must be Clarity values
};

// Perform the bridge operation
const result = await broSdk.bridgeFromStacks(bridgeFromStacksInput);
console.log("Transaction ID:", result.txid);
```

#### Bridge from EVM

Use case showcasing a transfer of 100 `USDT` from Ethereum to `UsSDT` on Stacks using BroSDK.

```typescript
import {
  BridgeFromEVMInput,
  KnownChainId,
  KnownTokenId,
  toSDKNumberOrUndefined,
} from "@brotocol-xyz/bro-sdk"
import { ethers } from "ethers";
  
// Retrieve bridge information
const bridgeInfo = await broSdk.bridgeInfoFromEVM({
  fromChain: KnownChainId.EVM.Ethereum,
  toChain: KnownChainId.Stacks.Mainnet,
  fromToken: KnownTokenId.EVM.USDT,
  toToken: KnownTokenId.Stacks.sUSDT,
  amount: toSDKNumberOrUndefined(100),
});

console.log("Bridge Info:", bridgeInfo);
  
// Example signer setup using ethers.js
const provider = new ethers.providers.JsonRpcProvider("https://mainnet.someprovider.io/YOUR_PROJECT_ID");
const signer = new ethers.Wallet("SENDER_PRIVATE_KEY", provider);

const bridgeFromEVMInput: BridgeFromEVMInput = {
  fromChain: KnownChainId.EVM.Ethereum,
  toChain: KnownChainId.Stacks.Mainnet,
  fromToken: KnownTokenId.EVM.USDT,
  toToken: KnownTokenId.Stacks.sUSDT,
  fromAddress: /* Sender EVM address */,
  toAddress: /* Receiver Stacks principal */,
  amount: toSDKNumberOrUndefined(100),
  sendTransaction: async (tx: 
    {
      from: EVMAddress /* Sender EVM address */
      to: EVMAddress /* Bridge Endpoint address */
      data: Uint8Array /* Transaction data */
      recommendedGasLimit: SDKNumber /* Recommended gas limit */
      value?: SDKNumber /* Transaction value */
    }
  ): Promise<{ txHash: string }> => {
    /**
     * Implementation for sending transaction on Ethereum mainnet
     * See https://docs.ethers.org/v5/api/contract/contract/ for reference
     */
    const txRequest = {
    from: tx.from,
    to: tx.to,
    data: ethers.utils.hexlify(tx.data),
    gasLimit: ethers.BigNumber.from(tx.recommendedGasLimit.split(" ")[0]), // Convert string to BigNumber
    };

    const sentTx = await signer.sendTransaction(txRequest);
    const receipt = await sentTx.wait();
    return { txHash: receipt.transactionHash };
  },
};
  
// Perform the bridge operation
const result = await broSdk.bridgeFromEVM(bridgeFromEVMInput);
console.log("Transaction ID:", result.txHash);
```

#### Bridge from Bitcoin

Use case showcasing a transfer of 1 `BTC` from Bitcoin to `WBTC` on Ethereum using BroSDK.

```typescript
import {
  BridgeFromBitcoinInput,
  KnownChainId,
  KnownTokenId,
  toSDKNumberOrUndefined,
} from "@brotocol-xyz/bro-sdk"
/* Use your preferred Bitcoin libs here */
import { Psbt, networks, Transaction, script } from "bitcoinjs-lib";
import { ECPairFactory } from "ecpair";
import * as tinysecp from "tiny-secp256k1";
import axios from "axios";

// Retrieve bridge information
const bridgeInfo = await broSdk.bridgeInfoFromBitcoin({
  fromChain: KnownChainId.Bitcoin.Mainnet,
  toChain: KnownChainId.EVM.Ethereum,
  fromToken: KnownTokenId.Bitcoin.BTC,
  toToken: KnownTokenId.EVM.WBTC,
  amount: toSDKNumberOrUndefined(1),
});

console.log("Bridge Info:", bridgeInfo)

const bridgeFromBitcoinInput: BridgeFromBitcoinInput = {
  fromChain: KnownChainId.Bitcoin.Mainnet,
  fromToken: KnownTokenId.Bitcoin.BTC,
  toChain: KnownChainId.EVM.Ethereum,
  toToken: KnownTokenId.EVM.WBTC,
  fromAddress: /* Sender Bitcoin address */,
  toAddress: /* Receiver EVM address */,
  amount: toSDKNumberOrUndefined(1),
  networkFeeRate: 10n,
  reselectSpendableUTXOs: async (
    satsToSend: bigint,
    pinnedUTXOs: UTXOSpendable[],
    lastTimeSelectedUTXOs: UTXOSpendable[]
  ): Promise<UTXOSpendable[]> => {
    /**
     * Implementation for selecting spendable UTXOs from the wallet
     * This should fetch available UTXOs from a Bitcoin node or explorer API
     */
    return [];
  },
  signPsbt: async (tx: { psbt: Uint8Array; signInputs: number[] }): Promise<{ psbt: Uint8Array }> => {
    /**
     * Implementation for signing a Bitcoin PSBT (Partially Signed Bitcoin Transaction)
     * See https://github.com/bitcoinjs/bitcoinjs-lib for reference
     */
    let psbt = Psbt.fromBuffer(tx.psbt);
    tx.signInputs.forEach((index) => {
      psbt.signInput(index, keyPair);
    });
    psbt.finalizeAllInputs();
    return { psbt: psbt.toBuffer() };
  },
  sendTransaction: async (tx: { hex: string }): Promise<{ txid: string }> => {
    /**
     * Implementation for broadcasting a Bitcoin transaction with Axios
     * Using a Bitcoin node or explorer API (e.g., Blockstream API)
     */
    const response = await axios.post("https://some-mempool/api/tx", tx.hex, {
      headers: { "Content-Type": "text/plain" },
    });
    return { txid: response.data };
  },
};

// Perform the bridge operation
const result = await broSdk.bridgeFromBitcoin(bridgeFromBitcoinInput);
console.log("Transaction ID:", result.txid);
```