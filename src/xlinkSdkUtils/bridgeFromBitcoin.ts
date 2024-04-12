import * as btc from "@scure/btc-signer"
import { bitcoinToSatoshi } from "../bitcoinUtils/bitcoinHelpers"
import { broadcastSignedTransaction } from "../bitcoinUtils/broadcastSignedTransaction"
import { getBTCPegInAddress } from "../bitcoinUtils/btcAddresses"
import { createTransaction } from "../bitcoinUtils/createTransaction"
import {
  ReselectSpendableUTXOsFn,
  prepareTransaction,
} from "../bitcoinUtils/prepareTransaction"
import { createBridgeOrder_BitcoinToStack } from "../stacksUtils/createBridgeOrder"
import { validateBridgeOrder_BitcoinToStack } from "../stacksUtils/validateBridgeOrder"
import {
  getContractCallInfo,
  numberToStacksContractNumber,
} from "../stacksUtils/xlinkContractHelpers"
import {
  GetSupportedRoutesFnAnyResult,
  buildSupportedRoutes,
  defineRoute,
} from "../utils/buildSupportedRoutes"
import { UnsupportedBridgeRouteError } from "../utils/errors"
import { checkNever } from "../utils/typeHelpers"
import { KnownChainId, KnownTokenId } from "../utils/types.internal"
import { ChainId } from "./types"

export const supportedRoutes = buildSupportedRoutes(
  [
    // from mainnet
    defineRoute(
      [KnownChainId.Bitcoin.Mainnet, KnownChainId.Stacks.Mainnet],
      [[KnownTokenId.Bitcoin.BTC, KnownTokenId.Stacks.aBTC]],
    ),
    // defineRoute(
    //   [KnownChainId.Bitcoin.Mainnet, KnownChainId.Ethereum.Mainnet],
    //   [[KnownTokenId.Bitcoin.BTC, KnownTokenId.Ethereum.WBTC]],
    // ),
    // defineRoute(
    //   [KnownChainId.Bitcoin.Mainnet, KnownChainId.Ethereum.BSC],
    //   [[KnownTokenId.Bitcoin.BTC, KnownTokenId.Ethereum.BTCB]],
    // ),

    // from testnet
    defineRoute(
      [KnownChainId.Bitcoin.Testnet, KnownChainId.Stacks.Testnet],
      [[KnownTokenId.Bitcoin.BTC, KnownTokenId.Stacks.aBTC]],
    ),
    // defineRoute(
    //   [KnownChainId.Bitcoin.Testnet, KnownChainId.Ethereum.Sepolia],
    //   [[KnownTokenId.Bitcoin.BTC, KnownTokenId.Ethereum.WBTC]],
    // ),
    // defineRoute(
    //   [KnownChainId.Bitcoin.Testnet, KnownChainId.Ethereum.BSCTest],
    //   [[KnownTokenId.Bitcoin.BTC, KnownTokenId.Ethereum.BTCB]],
    // ),
  ],
  {
    async isAvailable(route) {
      const { fromChain } = route

      if (
        fromChain === KnownChainId.Bitcoin.Mainnet ||
        fromChain === KnownChainId.Bitcoin.Testnet
      ) {
        return !!getBTCPegInAddress(fromChain)
      }

      return false
    },
  },
)

export interface BridgeFromBitcoinInput {
  fromChain: ChainId
  toChain: ChainId
  fromAddress: string
  toAddress: string
  amount: string
  networkFeeRate: bigint
  reselectSpendableUTXOs: ReselectSpendableUTXOsFn
  signTransaction: (tx: { psbt: Uint8Array }) => Promise<{
    transaction: Uint8Array
  }>
}

export interface BridgeFromBitcoinOutput {
  txid: string
}

export async function bridgeFromBitcoin(
  info: BridgeFromBitcoinInput,
): Promise<BridgeFromBitcoinOutput> {
  const res: GetSupportedRoutesFnAnyResult =
    await supportedRoutes.getSupportedTokens(info.fromChain, info.toChain)
  if (res.length <= 0) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
    )
  }

  const route = await supportedRoutes.pickLeftToRightRouteOrThrow(
    info.fromChain,
    info.toChain,
    KnownTokenId.Bitcoin.BTC,
    res[0].toToken,
  )

  if (
    route.fromChain === KnownChainId.Bitcoin.Mainnet ||
    route.fromChain === KnownChainId.Bitcoin.Testnet
  ) {
    if (
      route.toChain === KnownChainId.Stacks.Mainnet ||
      route.toChain === KnownChainId.Stacks.Testnet
    ) {
      return bridgeFromBitcoin_toStacks({
        ...info,
        fromChain: route.fromChain,
        toChain: route.toChain,
      })
    }

    // if (
    //   route.toChain === KnownChainId.Ethereum.Mainnet ||
    //   route.toChain === KnownChainId.Ethereum.Sepolia ||
    //   route.toChain === KnownChainId.Ethereum.BNBMainnet ||
    //   route.toChain === KnownChainId.Ethereum.BNBTestnet
    // ) {
    //   return bridgeFromBitcoin_toEthereum({
    //     ...info,
    //     fromChain: route.fromChain,
    //     toChain: route.toChain,
    //   })
    // }

    checkNever(route)
  } else {
    checkNever(route)
  }

  throw new UnsupportedBridgeRouteError(
    info.fromChain,
    info.toChain,
    KnownTokenId.Bitcoin.BTC,
    res[0].toToken,
  )
}

async function bridgeFromBitcoin_toStacks(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  info: Omit<BridgeFromBitcoinInput, "fromChain" | "toChain"> & {
    fromChain:
      | typeof KnownChainId.Bitcoin.Mainnet
      | typeof KnownChainId.Bitcoin.Testnet
    toChain:
      | typeof KnownChainId.Stacks.Mainnet
      | typeof KnownChainId.Stacks.Testnet
  },
): Promise<BridgeFromBitcoinOutput> {
  const pegInAddress = getBTCPegInAddress(info.fromChain)
  const contractCallInfo = getContractCallInfo(info.toChain)
  if (contractCallInfo == null || pegInAddress == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
    )
  }

  const bitcoinNetwork =
    info.fromChain === KnownChainId.Bitcoin.Mainnet
      ? btc.NETWORK
      : btc.TEST_NETWORK

  const { data: opReturnData } = await createBridgeOrder_BitcoinToStack({
    network: contractCallInfo.network,
    endpointDeployerAddress: contractCallInfo.deployerAddress,
    receiverStxAddr: info.toAddress,
    swapSlippedAmount: numberToStacksContractNumber(info.amount),
    swapRoute: [],
  })

  const txOptions = await prepareTransaction({
    network: bitcoinNetwork,
    recipients: [
      {
        address: pegInAddress.address,
        satsAmount: bitcoinToSatoshi(info.amount),
      },
    ],
    changeAddress: info.fromAddress,
    opReturnData: [opReturnData],
    feeRate: info.networkFeeRate,
    reselectSpendableUTXOs: info.reselectSpendableUTXOs,
  })

  const tx = createTransaction(
    bitcoinNetwork,
    txOptions.inputs,
    txOptions.recipients.concat({
      address: info.fromAddress,
      satsAmount: txOptions.changeAmount,
    }),
    [opReturnData],
  )

  await validateBridgeOrder_BitcoinToStack({
    network: contractCallInfo.network,
    endpointDeployerAddress: contractCallInfo.deployerAddress,
    btcTx: tx.toBytes(true, true),
    swapRoute: [],
  })

  const { transaction } = await info.signTransaction({
    psbt: tx.toPSBT(),
  })

  const { txId } = await broadcastSignedTransaction(
    info.fromChain === KnownChainId.Bitcoin.Mainnet ? "mainnet" : "testnet",
    transaction,
  )

  return { txid: txId }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function bridgeFromBitcoin_toEthereum(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  info: Omit<BridgeFromBitcoinInput, "fromChain" | "toChain"> & {
    fromChain:
      | typeof KnownChainId.Bitcoin.Mainnet
      | typeof KnownChainId.Bitcoin.Testnet
    toChain:
      | typeof KnownChainId.Ethereum.Mainnet
      | typeof KnownChainId.Ethereum.Sepolia
      | typeof KnownChainId.Ethereum.BSC
      | typeof KnownChainId.Ethereum.BSCTest
  },
): Promise<BridgeFromBitcoinOutput> {
  // TODO
  return { txid: "" }
}
