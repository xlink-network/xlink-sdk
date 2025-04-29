# BroSDK

`@brotocol-xyz/bro-sdk` is a TypeScript SDK designed to integrate with Brotocol's on-chain and off-chain infrastructure. It is web3 library-agnostic, meaning you can use your preferred library to send and broadcast transactions while the SDK handles the rest.

🐙 **Brotocol isn't just a bridge—it's the liquidity layer for Bitcoin and the essential connector for Bitcoin DeFi** 🐙

## Table of Contents

- [BroSDK](#brosdk)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Supported Chains](#supported-chains)
      - [Mainnet Chains](#mainnet-chains)
      - [Testnet Chains](#testnet-chains)
    - [Supported Tokens](#supported-tokens)
      - [Retrieve a `TokenId`](#retrieve-a-tokenid)
    - [Available Routes](#available-routes)
    - [Basic Operations](#basic-operations)
      - [`bridgeInfoFrom` methods](#bridgeinfofrom-methods)
      - [`estimateBridgeTransactionFrom` methods](#estimatebridgetransactionfrom-methods)
      - [`bridgeFrom` methods](#bridgefrom-methods)
    - [Bridge From Stacks](#bridge-from-stacks)
    - [Bridge From EVM](#bridge-from-evm)
    - [Bridge From Bitcoin](#bridge-from-bitcoin)
    - [Bridge From BRC20](#bridge-from-brc20)
    - [Bridge From Runes](#bridge-from-runes)
  - [License](#license)

## Features

- Asset transfers between Bitcoin, Stacks, and EVM-compatible blockchains
- Support for Runes and BRC20 metaprotocols
- Cross-chain swaps and DEX aggregator integrations
- Flexible design, allowing integration with any Bitcoin and web3 library

## Installation

With [pnpm](https://pnpm.io/):

```bash
pnpm install @brotocol-xyz/bro-sdk
```

## Usage

The [`BroSDK`](https://releases-latest.xlink-sdk.pages.dev/classes/index.BroSDK) class provides the core functions of the library. To create an instance:

```ts
import { BroSDK } from "@brotocol-xyz/bro-sdk";
const sdk = new BroSDK();
```

For the full API reference, including a full list of available methods and their usage, visit the [SDK Documentation](https://releases-latest.xlink-sdk.pages.dev).

### Supported Chains

The [`KnownChainId`](https://releases-latest.xlink-sdk.pages.dev/modules/index.KnownChainId) namespace defines types and utility functions for all supported mainnet and testnet networks.

Usage example:

```ts
import { KnownChainId } from "@brotocol-xyz/bro-sdk";

// Bitcoin
const bitcoinChainId = KnownChainId.Bitcoin.Mainnet; 
const bitcoinTestnetChainId = KnownChainId.Bitcoin.Testnet;

// EVM
const ethereumChainId = KnownChainId.EVM.Ethereum; 
const ethereumTestnetChainId = KnownChainId.EVM.Sepolia;

// Utility function usage example
KnownChainId.isEVMTestnetChain(KnownChainId.EVM.Sepolia); // Returns true
KnownChainId.isEVMMainnetChain(KnownChainId.EVM.Sepolia); // Returns false
```

#### Mainnet Chains

- **Bitcoin**, **Runes** & **BRC20**
- **Stacks**
- **EVM**: Ethereum, BSC, CoreDAO, Bsquared, BOB, Bitlayer, Lorenzo, Merlin, AILayer, Mode, XLayer, Arbitrum, Aurora, Manta, Linea, Base

#### Testnet Chains

- **Bitcoin**, **Runes** & **BRC20**
- **Stacks**
- **EVM**: Sepolia, BSC Testnet, CoreDAO Testnet, Blife Testnet, Bitboy Testnet, Bera Testnet

> [!NOTE]
> Runes and BRC20 metaprotocols are treated as distinct chains within the SDK, even though they share Bitcoin as the underlying blockchain.

<!-- 
Decided to remove the table as it seemed a little bulky for the README. But left it here for future reference.

#### Available chains

| Namespace | Mainnet                                                                                                                                                       | Testnet                                                                                   |
| :---------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------: |
| Bitcoin | `Mainnet`                                                                                                                                                     | `Testnet`                                                                                 |
| Runes | `Mainnet`                                                                                                                                                     | `Testnet`                                                                                 |
| BRC20 | `Mainnet`                                                                                                                                                     | `Testnet`                                                                                 |
| Stacks  | `Mainnet`                                                                                                                                                     | `Testnet`                                                                                 |
| EVM     | `Ethereum`, `BSC`, `CoreDAO`, `Bsquared`, `BOB`, `Bitlayer`, `Lorenzo`, `Merlin`, `AILayer`, `Mode`, `XLayer`, `Arbitrum`, `Aurora`, `Manta`, `Linea`, `Base` | `Sepolia`, `BSCTestnet`, `CoreDAOTestnet`, `BlifeTestnet`, `BitboyTestnet`, `BeraTestnet` | -->

### Supported Tokens

Token support is **dynamic**, meaning new tokens can be added without requiring SDK updates. Instead of relying on a static list, the SDK provides methods to fetch supported tokens at runtime. Tokens are represented using the `TokenId` type — this is how the library internally handles and identifies tokens.

Also, check the [`KnownTokenId`](https://releases-latest.xlink-sdk.pages.dev/modules/index.KnownTokenId) namespace to see types and utility functions for all supported tokens.

#### Retrieve a `TokenId`

```ts
// For BRC20 provide the tick symbol
const brc20Token = await sdk.brc20TickToBRC20Token(KnownChainId.BRC20.Mainnet, "alex$");

// For Runes provide the runes ID
const runesToken = await sdk.runesIdToRunesToken(KnownChainId.Runes.Mainnet, "500:20");

// For Stacks provide the contract address
const stacksToken = await sdk.stacksAddressToStacksToken(KnownChainId.Stacks.Mainnet,
  { deployerAddress: "SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK", contractName: "token-abtc" },
);

// For EVM tokens provide the contract address
const evmToken = await sdk.evmAddressToEVMToken(KnownChainId.EVM.Ethereum, "0x31761a152F1e96F966C041291644129144233b0B");
```

If a token is **unsupported**, these functions return `Promise<undefined>`.

> [!NOTE]
> Some Stacks and EVM tokens are still statically defined in `KnownTokenId.Stacks` and `KnownTokenId.EVM` for backward compatibility, but future additions will also be dynamically handled.

> [!WARNING]
>
> `TokenId` values **might change in future updates** (no backward compatibility guaranteed). To ensure validity, always get fresh `TokenId`s at runtime using SDK methods—never cache them or construct them manually.

### Available Routes

```ts
// Get all Brotocol available routes 
const allRoutes = await sdk.getPossibleRoutes();

// Get routes filtered by source chain
const routesBySourceChain = await sdk.getPossibleRoutes({
  fromChain: KnownChainId.BRC20.Mainnet,
});

// Get routes filtered by source and target chain
const routesBySourceAndTargetChain = await sdk.getPossibleRoutes({
  fromChain: KnownChainId.BRC20.Mainnet,
  toChain: KnownChainId.EVM.Ethereum,
});

// Check if a specific token pair is supported for at least one route
const isSupported = await sdk.isSupportedRoute({
  fromChain: KnownChainId.BRC20.Mainnet,
  toChain: KnownChainId.EVM.Ethereum,
  fromToken: brc20Token as KnownTokenId.BRC20Token,
  toToken: evmToken as KnownTokenId.EVMToken,
});

// If the token pair is supported, get available routes for that pair
if (isSupported) {
  const routesByPair = await sdk.getPossibleRoutes({
    fromChain: KnownChainId.BRC20.Mainnet,
    toChain: KnownChainId.EVM.Ethereum,
    fromToken: brc20Token as KnownTokenId.BRC20Token,
    toToken: evmToken as KnownTokenId.EVMToken,
  });
}
```

### Basic Operations

The SDK provides three main methods for handling cross-chain asset transfers.

- [`bridgeInfoFrom<Chain>`](#bridgeinfofrom-methods)
- [`estimateBridgeTransactionFrom<Chain>`](#estimatebridgetransactionfrom-methods)
- [`bridgeFrom<Chain>`](#bridgefrom-methods)

#### `bridgeInfoFrom` methods

Retrieve data to perform a cross-chain transfer:

- Validate whether the route is supported (throws an error if not).
- Retrieve Brotocol fee values and the exact amount that will arrive on destination chain.

> [!NOTE]
> These methods do not check the bridge's min/max amount limits. These checks are enforced on-chain, and the transaction will revert if the amount conditions are not met.

```ts
import { toSDKNumberOrUndefined } from "@brotocol-xyz/bro-sdk";

// Retrieve bridge info to perform a transfer from Stacks to EVM
const bridgeInfo = await sdk.bridgeInfoFromStacks({
  fromChain: KnownChainId.Stacks.Mainnet,
  toChain: KnownChainId.EVM.Ethereum,
  fromToken: stacksToken as KnownTokenId.StacksToken,
  toToken: evmToken as KnownTokenId.EVMToken,
  amount: toSDKNumberOrUndefined(100_000_000), // Assume 6 decimals
});
```

#### `estimateBridgeTransactionFrom` methods

Estimate the transaction fee and virtual size (vbytes) for bridging from Bitcoin-based networks (Bitcoin, Runes, BRC20). Fees are calculated as:

```any
fee = virtualSize [vbytes] × networkFeeRate [sat/vbyte]
```

`networkFeeRate` is provided by dev. Typical fee rates range from 1–100 sat/vbyte, depending on network congestion and desired confirmation speed. See this [reference](https://learnmeabitcoin.com/technical/transaction/size/) for more on transaction size.

**Why is this important?** Miners prioritize transactions with higher fees per vbyte. Accurately estimating the transaction virtual size allows to set an appropriate fee, so the transaction is confirmed in a timely manner.

See the [Bridge From Bitcoin](#bridge-from-bitcoin) section for usage example.

#### `bridgeFrom` methods

Once the route is validated, the cross-chain transfer can be initiated. These methods **construct and submit** the transaction on the source chain.

> [!IMPORTANT]
> The SDK does not broadcast transactions—it provides the data required to sign and send them. The `sendTransaction` function parameter must be implemented by the developer using their preferred web3 library. The SDK provides the necessary arguments, including contract addresses, function to call and call data.

### Bridge From Stacks

```ts
import { BridgeFromStacksInput, toSDKNumberOrUndefined, KnownChainId, KnownTokenId } from "@brotocol-xyz/bro-sdk";
import { makeContractCall, broadcastTransaction, deserializeCV } from "@stacks/transactions";

// Define bridge operation input
const bridgeFromStacksInput: BridgeFromStacksInput = {
  fromChain: KnownChainId.Stacks.Mainnet,
  toChain: KnownChainId.EVM.Ethereum,
  fromToken: stacksToken as KnownTokenId.StacksToken,
  toToken: evmToken as KnownTokenId.EVMToken,
  // Sender Stacks principal
  fromAddress: "SP2ZD731ANQZT6J4K3F5N8A40ZXWXC1XFXHVVQFKE",
  // Receiver EVM address
  toAddress: "0x31751a152F1e95F966C041291644129144233b0B",
  amount: toSDKNumberOrUndefined(100),
  sendTransaction: async tx => {
    /**
     * Implementation for sending transaction on Stacks mainnet.
     * Refer to:
     *   - https://github.com/hirosystems/stacks.js/tree/main/packages/transactions#smart-contract-function-call
     *   - https://stacks.js.org/functions/_stacks_transactions.makeContractCall
     *   - https://stacks.js.org/functions/_stacks_transactions.broadcastTransaction
     */
    const transaction = await makeContractCall({
      contractAddress: tx.contractAddress,
      contractName: tx.contractName,
      functionName: tx.functionName,
      // Deserialize each element of functionArgs and convert it into ClarityValue
      functionArgs: tx.functionArgs.map(arg => deserializeCV(arg)),
      postConditions: [] /* Add post conditions */,
      validateWithAbi: true,
      senderKey: "b244296d5907de9864c0b0d51f98a13c52890be0404e83f273144cd5b9960eed01",
      network: "mainnet",
    });

    const broadcastResponse = await broadcastTransaction({ transaction, network: "mainnet" });
    return { txid: broadcastResponse.txid };
  };
};

// Perform the bridge operation
const result = await sdk.bridgeFromStacks(bridgeFromStacksInput);
console.log("Stacks Transaction ID:", result.txid);
```

> [!NOTE]  
> The `tx.functionArgs` field provided by the SDK is of type `SerializedClarityValue[]`.  
> This differs from the `functionArgs` expected by the Stacks.js `makeContractCall` method, which requires `ClarityValue[]`.  
> 
> This design decision was intentional to maintain compatibility with both [Stacks.js](https://github.com/hirosystems/stacks.js) v6 and v7, as the implementation details of `ClarityValue` type differ between both versions. By using a serialized format, the SDK ensures flexibility and avoids locking users into a specific version of the Stacks.js library.

### Bridge From EVM

> [!IMPORTANT]
> Before initiating a bridge transaction, ensure that you have approved the Bridge Endpoint contract to spend `amount` tokens from `fromAddress`. Without this approval, the transaction will fail.

```ts
import { BridgeFromEVMInput, EVMAddress, SDKNumber, KnownChainId, KnownTokenId } from "@brotocol-xyz/bro-sdk";
// Choose your preferred web3 lib here
import { ethers } from "ethers";

// Example signer setup using ethers.js
const provider = new ethers.JsonRpcProvider("https://mainnet.someprovider.io/YOUR_PROJECT_ID");
const signer = new ethers.Wallet("000000000000000000000000000000000000000000000000000000000000002d", provider);
const signerAddress = signer.address as `0x${string}`;

const bridgeFromEVMInput: BridgeFromEVMInput = {
  fromChain: KnownChainId.EVM.Ethereum,
  toChain: KnownChainId.Stacks.Mainnet,
  fromToken: evmToken as KnownTokenId.EVMToken,
  toToken: stacksToken as KnownTokenId.StacksToken,
  // Sender Ethereum address
  fromAddress: signerAddress,
  // Receiver Stacks principal
  toAddress: "SP2ZD731ANQZT6J4K3F5N8A40ZXWXC1XFXHVVQFKE",
  amount: toSDKNumberOrUndefined(100),
  sendTransaction: async (tx: {
    from: EVMAddress; // Sender Ethereum address
    to: EVMAddress; // Bridge Endpoint address
    data: Uint8Array;
    recommendedGasLimit: SDKNumber;
    value?: SDKNumber;
  }): Promise<{ txHash: string }> => {
    /**
     * Implementation for sending transaction on Ethereum mainnet
     * See https://docs.ethers.org/v6/ for reference
     */
    const txRequest = {
      from: tx.from,
      to: tx.to,
      data: ethers.hexlify(tx.data),
      // Convert SDKNumber into BigNumber
      gasLimit: ethers.toBigInt(tx.recommendedGasLimit.split(" ")[0]), 
    };

    const sentTx = await signer.sendTransaction(txRequest);
    const receipt = await sentTx.wait();
    if (receipt === null) throw new Error("Transaction receipt is null");
    return { txHash: receipt.hash };
  },
};

// Perform the bridge operation
const result = await sdk.bridgeFromEVM(bridgeFromEVMInput);
console.log("Ethereum Transaction ID:", result.txHash);
```

### Bridge From Bitcoin

The following functions must be implemented by developer:

- `reselectSpendableUTXOs`: Selects UTXOs from the sender wallet.
- `signPsbt`: Signs the PSBT (Partially Signed Bitcoin Transaction).
- `sendTransaction`: Broadcasts the final transaction to the Bitcoin network.

```ts
import { BridgeFromBitcoinInput, KnownChainId, KnownTokenId } from "@brotocol-xyz/bro-sdk";
import {
  GetConfirmedSpendableUTXOFn,
  reselectSpendableUTXOsFactory,
  UTXOBasic,
} from "@brotocol-xyz/bro-sdk/bitcoinHelpers";
import { ECPairFactory } from "ecpair";
import { Psbt, payments, Signer, networks } from "bitcoinjs-lib";
import axios from "axios";
import { randomBytes } from "crypto";
import * as ecc from "tiny-secp256k1";

const rng = (size?: number) => {
  const buffer = randomBytes(size || 0);
  return Buffer.from(buffer);
};

// Create ECPair instance
const ECPair = ECPairFactory(ecc);

// Generate a new random key pair
const keyPair = ECPair.makeRandom({ rng });

// Get sender address and scriptPubKey
const { address: senderAddress, output: scriptPubKey } = payments.p2wpkh({
  pubkey: Buffer.from(keyPair.publicKey),
  network: networks.bitcoin,
});

// Select UTXOs to spend
const reselectSpendableUTXOs: BridgeFromBitcoinInput["reselectSpendableUTXOs"] =
  async (satsToSend, lastTimeSelectedUTXOs) => {
    /**
     * This function should fetch UTXOs from a Bitcoin node or API.
     * Replace the placeholder logic below with your actual UTXO source.
     */
    const availableUTXOs: UTXOBasic[] = [];
    const getUTXOSpendable: GetConfirmedSpendableUTXOFn = async (
      utxo: UTXOBasic,
    ) => {
      // Placeholder for implementation - It should return a valid UTXOSpendable & UTXOConfirmed object
      return undefined; 
    };

    // Create the reselect function with factory helper
    const reselectFn = reselectSpendableUTXOsFactory(
      availableUTXOs,
      getUTXOSpendable,
    );

    return reselectFn(satsToSend, lastTimeSelectedUTXOs);
  };

// Sign a Bitcoin PSBT
const signPsbt: BridgeFromBitcoinInput["signPsbt"] = async tx => {
  /**
   * Implementation example for signing a Bitcoin PSBT (Partially Signed Bitcoin Transaction)
   */
  const signer: Signer = {
    publicKey: Buffer.from(keyPair.publicKey),
    sign: hash => Buffer.from(keyPair.sign(hash)),
  };
  const psbt = Psbt.fromBuffer(Buffer.from(tx.psbt));
  tx.signInputs.forEach(index => {
    psbt.signInput(index, signer);
  });
  psbt.finalizeAllInputs();
  return { psbt: psbt.toBuffer() };
};

// Broadcast the signed transaction 
const sendTransaction: BridgeFromBitcoinInput["sendTransaction"] = async tx => {
  /**
   * Implementation example for broadcasting a Bitcoin transaction with Axios
   */
  const response = await axios.post("https://blockstream.info/api/tx", tx.hex, {
    headers: { "Content-Type": "text/plain" },
  });
  return { txid: response.data };
};

// Estimate transaction fee and virtual size before performing the bridge operation
const estimateTransaction = await sdk.estimateBridgeTransactionFromBitcoin({
  fromChain: KnownChainId.Bitcoin.Mainnet,
  fromToken: KnownTokenId.Bitcoin.BTC,
  toChain: KnownChainId.EVM.Ethereum,
  toToken: evmToken as KnownTokenId.EVMToken,
  fromAddressScriptPubKey: scriptPubKey!,
  fromAddress: senderAddress!,
  toAddress: "0x31751a152F1e95F966C041291644129144233b0B",
  amount: toSDKNumberOrUndefined(1),
  networkFeeRate: 10n, // Expressed in satoshis per virtual byte (sat/vbyte).
  reselectSpendableUTXOs: reselectSpendableUTXOs,
});

const bridgeFromBitcoinInput: BridgeFromBitcoinInput = {
  fromChain: KnownChainId.Bitcoin.Mainnet,
  fromToken: KnownTokenId.Bitcoin.BTC,
  toChain: KnownChainId.EVM.Ethereum,
  toToken: evmToken as KnownTokenId.EVMToken,
  fromAddressScriptPubKey: scriptPubKey!,
  fromAddress: senderAddress!,
  toAddress: "0x31751a152F1e95F966C041291644129144233b0B",
  amount: toSDKNumberOrUndefined(1),
  networkFeeRate: 10n,
  reselectSpendableUTXOs,
  signPsbt,
  sendTransaction,
};

// Perform the bridge operation
const result = await sdk.bridgeFromBitcoin(bridgeFromBitcoinInput);
console.log("Bitcoin Transaction ID:", result.txid);
```

### Bridge From BRC20

Comming soon.

<!-- The following functions must be implemented by developer:

- `reselectSpendableNetworkFeeUTXOs`: Selects UTXOs from the sender wallet.
- `signPsbt`: Signs the PSBT (Partially Signed Bitcoin Transaction).
- `sendTransaction`: Broadcasts the final transaction to the Bitcoin network. -->

### Bridge From Runes

Comming soon.


## License

This project is licensed under the terms of the [MIT license](LICENSE).
