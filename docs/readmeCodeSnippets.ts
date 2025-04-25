import { BroSDK } from "../src/index";

/* eslint-disable @typescript-eslint/no-unused-vars */

const sdk = new BroSDK();

// Supported Chains

import { KnownChainId } from "../src/index";

// Bitcoin
const bitcoinChainId = KnownChainId.Bitcoin.Mainnet;
const bitcoinTestnetChainId = KnownChainId.Bitcoin.Testnet;

// EVM
const ethereumChainId = KnownChainId.EVM.Ethereum;
const ethereumTestnetChainId = KnownChainId.EVM.Sepolia;

// Utility function usage example
KnownChainId.isEVMTestnetChain(KnownChainId.EVM.Sepolia); // Returns true
KnownChainId.isEVMMainnetChain(KnownChainId.EVM.Sepolia); // Returns false

// Supported Tokens

import { KnownTokenId } from "../src/index";

// For BRC20 provide the tick symbol
const brc20Token = await sdk.brc20TickToBRC20Token(
  KnownChainId.BRC20.Mainnet,
  "alex$",
);

// For Runes provide the runes ID
const runesToken = await sdk.runesIdToRunesToken(
  KnownChainId.Runes.Mainnet,
  "500:20",
);

// For Stacks provide the contract address
const stacksToken = await sdk.stacksAddressToStacksToken(
  KnownChainId.Stacks.Mainnet,
  {
    deployerAddress: "SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK",
    contractName: "token-abtc",
  },
);

// For EVM tokens provide the contract address
const evmToken = await sdk.evmAddressToEVMToken(
  KnownChainId.EVM.Ethereum,
  "0x31761a152F1e96F966C041291644129144233b0B",
);

// Supported routes

// Get all possible routes
const allRoutes = await sdk.getPossibleRoutes();

// Get all possible routes filtered by source chain
const routesBySourceChain = await sdk.getPossibleRoutes({
  fromChain: KnownChainId.BRC20.Mainnet,
});

// Get all possible routes filtered by source and target chain
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

// If the token pair is supported, get all available routes for that pair
if (isSupported) {
  const routesByPair = await sdk.getPossibleRoutes({
    fromChain: KnownChainId.BRC20.Mainnet,
    toChain: KnownChainId.EVM.Ethereum,
    fromToken: brc20Token as KnownTokenId.BRC20Token,
    toToken: evmToken as KnownTokenId.EVMToken,
  });
}

// Bridge From Stacks

import { makeContractCall, broadcastTransaction, deserializeCV } from "@stacks/transactions";
import { ContractCallOptions } from "../src/stacksUtils/contractHelpers";
import { BridgeFromStacksInput, toSDKNumberOrUndefined } from "../src/index";

// Retrieve bridge information
const bridgeInfo = await sdk.bridgeInfoFromStacks({
  fromChain: KnownChainId.Stacks.Mainnet,
  toChain: KnownChainId.EVM.Ethereum,
  fromToken: stacksToken as KnownTokenId.StacksToken,
  toToken: evmToken as KnownTokenId.EVMToken,
  amount: toSDKNumberOrUndefined(100_000_000),
});

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
  // TODO: ContractCallOptions is not included as an export type in index.ts.
  // This type was omitted on the snippet, but consider exporting call options type
  sendTransaction: async (tx: ContractCallOptions) => {
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
      // Deserialize each element of functionArgs and convert it into ClarityValue[]
      functionArgs: tx.functionArgs.map(arg => deserializeCV(arg)),
      postConditions: [] /* Add post conditions */,
      validateWithAbi: true,
      senderKey:
        "b244296d5907de9864c0b0d51f98a13c52890be0404e83f273144cd5b9960eed01",
      network: "mainnet",
    });

    const broadcastResponse = await broadcastTransaction({
      transaction,
      network: "mainnet",
    });
    return { txid: broadcastResponse.txid };
  },
};

// Perform the bridge operation
const result = await sdk.bridgeFromStacks(bridgeFromStacksInput);
console.log("Transaction ID:", result.txid);

// Bridge From EVM

import { BridgeFromEVMInput, EVMAddress, SDKNumber } from "../src/index";
// Choose your preferred web3 lib here
import { ethers } from "ethers";

// Example signer setup using ethers.js
const provider = new ethers.JsonRpcProvider(
  "https://mainnet.someprovider.io/YOUR_PROJECT_ID",
);
const signer = new ethers.Wallet(
  "000000000000000000000000000000000000000000000000000000000000002d",
  provider,
);
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
     * See https://docs.ethers.org/v6/api/contract/ for reference
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
const result2 = await sdk.bridgeFromEVM(bridgeFromEVMInput);
console.log("Transaction ID:", result2.txHash);

// Bridge From BTC

import { BridgeFromBitcoinInput } from "../src/index";
import {
  GetConfirmedSpendableUTXOFn,
  reselectSpendableUTXOsFactory,
  UTXOBasic,
} from "../src/bitcoinHelpers";
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

// Get address and scriptPubKey
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
  networkFeeRate: 10n,
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
  networkFeeRate: 10n, // Expressed in satoshis per virtual byte (sat/vbyte).
  reselectSpendableUTXOs,
  signPsbt,
  sendTransaction,
};

// Perform the bridge operation
const result3 = await sdk.bridgeFromBitcoin(bridgeFromBitcoinInput);
console.log("Bitcoin Transaction ID:", result3.txid);

// Bridge From BRC20

import { BridgeFromBRC20Input } from "../src/index"

// Select UTXOs to spend
const reselectSpendableNetworkFeeUTXOs: BridgeFromBRC20Input["reselectSpendableNetworkFeeUTXOs"] =
  async (satsToSend, lastTimeSelectedUTXOs) => {
    // Example of available UTXOs from a Bitcoin node or API
    const availableUTXOs: UTXOBasic[] = [
      {
        txId: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        index: 0,
        amount: 5000n,
      },
      {
        txId: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        index: 1,
        amount: 3000n,
      },
      {
        txId: "7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456",
        index: 2,
        amount: 2000n,
      },
    ]

    // Function to convert basic UTXOs to spendable UTXOs with scriptPubKey
    const getUTXOSpendable: GetConfirmedSpendableUTXOFn = async (
      utxo: UTXOBasic,
    ) => {
      // For this example, we'll create a simple UTXOSpendable object
      return {
        ...utxo,
        scriptPubKey: scriptPubKey!,
        addressType: "p2wpkh",
        blockHeight: 800000n, // Example block height
      }
    }

    // Create the reselect function with factory helper
    const reselectFn = reselectSpendableUTXOsFactory(
      availableUTXOs,
      getUTXOSpendable,
    )

    return reselectFn(satsToSend, lastTimeSelectedUTXOs)
  }

const bridgeFromBRC20Input: BridgeFromBRC20Input = {
  fromChain: KnownChainId.BRC20.Mainnet,
  fromToken: brc20Token as KnownTokenId.BRC20Token,
  toChain: KnownChainId.EVM.Ethereum,
  toToken: evmToken as KnownTokenId.EVMToken,
  fromAddress: senderAddress!,
  fromAddressScriptPubKey: scriptPubKey!,
  toAddress: "0x31751a152F1e95F966C041291644129144233b0B",
  inputInscriptionUTXO: {
    txId: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    index: 0,
    amount: 1000n,
    scriptPubKey: scriptPubKey!,
    addressType: "p2wpkh",
  },
  networkFeeRate: 10n,
  reselectSpendableNetworkFeeUTXOs,
  networkFeeChangeAddress: senderAddress!,
  networkFeeChangeAddressScriptPubKey: scriptPubKey!,
  signPsbt: async tx => {
    const signer: Signer = {
      publicKey: Buffer.from(keyPair.publicKey),
      sign: hash => Buffer.from(keyPair.sign(hash)),
    }
    const psbt = Psbt.fromBuffer(Buffer.from(tx.psbt))
    tx.signBitcoinInputs.forEach(index => {
      psbt.signInput(index, signer)
    })
    tx.signInscriptionInputs.forEach(index => {
      psbt.signInput(index, signer)
    })
    psbt.finalizeAllInputs()
    return { psbt: psbt.toBuffer() }
  },
  sendTransaction,
}

// Perform the bridge operation
const result4 = await sdk.bridgeFromBRC20(bridgeFromBRC20Input)
console.log("Bitcoin Transaction ID:", result4.txid)

// Bridge From Runes

import { BridgeFromRunesInput, RunesUTXOSpendable } from "../src/index"

// Select UTXOs to spend for network fees
const reselectSpendableNetworkFeeUTXOsForRunes: BridgeFromRunesInput["reselectSpendableNetworkFeeUTXOs"] =
  async (satsToSend, lastTimeSelectedUTXOs) => {
    // Example of available UTXOs from a Bitcoin node or API
    const availableUTXOs: UTXOBasic[] = [
      {
        txId: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        index: 0,
        amount: 5000n,
      },
      {
        txId: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        index: 1,
        amount: 3000n,
      },
      {
        txId: "7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456",
        index: 2,
        amount: 2000n,
      },
    ]

    // Function to convert basic UTXOs to spendable UTXOs with scriptPubKey
    const getUTXOSpendable: GetConfirmedSpendableUTXOFn = async (
      utxo: UTXOBasic,
    ) => {
      // For this example, we'll create a simple UTXOSpendable object
      return {
        ...utxo,
        scriptPubKey: scriptPubKey!,
        addressType: "p2wpkh",
        blockHeight: 800000n, // Example block height
      }
    }

    // Create the reselect function with factory helper
    const reselectFn = reselectSpendableUTXOsFactory(
      availableUTXOs,
      getUTXOSpendable,
    )

    return reselectFn(satsToSend, lastTimeSelectedUTXOs)
  }

// Example Runes UTXOs
const runesUTXOs: RunesUTXOSpendable[] = [
  {
    txId: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    index: 0,
    amount: 1000n,
    scriptPubKey: scriptPubKey!,
    addressType: "p2wpkh",
    runes: [
      {
        runeId: "500:20",
        runeDivisibility: 8,
        runeAmount: 100000000n, // 1.0 rune
      },
    ],
  },
]

// Sign a Bitcoin PSBT for Runes
const signPsbtForRunes: BridgeFromRunesInput["signPsbt"] = async tx => {
  const signer: Signer = {
    publicKey: Buffer.from(keyPair.publicKey),
    sign: hash => Buffer.from(keyPair.sign(hash)),
  }
  const psbt = Psbt.fromBuffer(Buffer.from(tx.psbt))
  tx.signBitcoinInputs.forEach(index => {
    psbt.signInput(index, signer)
  })
  tx.signRunesInputs.forEach(index => {
    psbt.signInput(index, signer)
  })
  psbt.finalizeAllInputs()
  return { psbt: psbt.toBuffer() }
}

// Broadcast the signed transaction
const sendTransactionForRunes: BridgeFromRunesInput["sendTransaction"] =
  async tx => {
    const response = await axios.post(
      "https://blockstream.info/api/tx",
      tx.hex,
      {
        headers: { "Content-Type": "text/plain" },
      },
    )
    return { txid: response.data }
  }

// Create the bridge input
const bridgeFromRunesInput: BridgeFromRunesInput = {
  fromChain: KnownChainId.Runes.Mainnet,
  fromToken: runesToken as KnownTokenId.RunesToken,
  toChain: KnownChainId.EVM.Ethereum,
  toToken: evmToken as KnownTokenId.EVMToken,
  fromAddress: senderAddress!,
  fromAddressScriptPubKey: scriptPubKey!,
  toAddress: "0x31751a152F1e95F966C041291644129144233b0B",
  amount: toSDKNumberOrUndefined(1), // 1.0 rune
  inputRuneUTXOs: runesUTXOs,
  networkFeeRate: 10n,
  reselectSpendableNetworkFeeUTXOs: reselectSpendableNetworkFeeUTXOsForRunes,
  networkFeeChangeAddress: senderAddress!,
  networkFeeChangeAddressScriptPubKey: scriptPubKey!,
  signPsbt: signPsbtForRunes,
  sendTransaction: sendTransactionForRunes,
}

// Perform the bridge operation
const result5 = await sdk.bridgeFromRunes(bridgeFromRunesInput)
console.log("Bitcoin Transaction ID:", result5.txid)
