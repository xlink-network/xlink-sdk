import * as btc from "@scure/btc-signer"
import { bitcoinToSatoshi } from "../bitcoinUtils/bitcoinHelpers"
import { getBTCPegInAddress } from "../bitcoinUtils/btcAddresses"
import { createTransaction } from "../bitcoinUtils/createTransaction"
import { isSupportedBitcoinRoute } from "../bitcoinUtils/peggingHelpers"
import {
  ReselectSpendableUTXOsFn,
  prepareTransaction,
} from "../bitcoinUtils/prepareTransaction"
import {
  BridgeSwapRoute_FromBitcoin,
  createBridgeOrder_BitcoinToEVM,
  createBridgeOrder_BitcoinToStacks,
} from "../stacksUtils/createBridgeOrder"
import {
  validateBridgeOrder_BitcoinToEVM,
  validateBridgeOrder_BitcoinToStacks,
} from "../stacksUtils/validateBridgeOrder"
import {
  getStacksContractCallInfo,
  numberToStacksContractNumber,
} from "../stacksUtils/xlinkContractHelpers"
import {
  buildSupportedRoutes,
  defineRoute,
} from "../utils/buildSupportedRoutes"
import { UnsupportedBridgeRouteError } from "../utils/errors"
import { assertExclude, checkNever } from "../utils/typeHelpers"
import {
  KnownChainId,
  KnownTokenId,
  _allKnownEVMMainnetChains,
  _allKnownEVMTestnetChains,
} from "../utils/types.internal"
import { ChainId, SDKNumber, TokenId } from "./types"

export const supportedRoutes = buildSupportedRoutes(
  [
    // from mainnet
    //     to Stacks
    ...defineRoute(
      [[KnownChainId.Bitcoin.Mainnet], [KnownChainId.Stacks.Mainnet]],
      [[KnownTokenId.Bitcoin.BTC, KnownTokenId.Stacks.aBTC]],
    ),
    //     to EVM
    ...defineRoute(
      [[KnownChainId.Bitcoin.Mainnet], [..._allKnownEVMMainnetChains]],
      [
        [KnownTokenId.Bitcoin.BTC, KnownTokenId.EVM.WBTC],
        [KnownTokenId.Bitcoin.BTC, KnownTokenId.EVM.BTCB],
        [KnownTokenId.Bitcoin.BTC, KnownTokenId.EVM.aBTC],
      ],
    ),

    // from testnet
    //      to Stacks
    ...defineRoute(
      [[KnownChainId.Bitcoin.Testnet], [KnownChainId.Stacks.Testnet]],
      [[KnownTokenId.Bitcoin.BTC, KnownTokenId.Stacks.aBTC]],
    ),
    //      to EVM
    ...defineRoute(
      [[KnownChainId.Bitcoin.Testnet], [..._allKnownEVMTestnetChains]],
      [[KnownTokenId.Bitcoin.BTC, KnownTokenId.EVM.WBTC]],
    ),
  ],
  {
    isSupported: isSupportedBitcoinRoute,
  },
)

export interface BridgeFromBitcoinInput {
  fromChain: ChainId
  toChain: ChainId
  fromToken: TokenId
  toToken: TokenId
  fromAddress: string
  toAddress: string
  amount: SDKNumber
  networkFeeRate: bigint
  reselectSpendableUTXOs: ReselectSpendableUTXOsFn
  signPsbt: (tx: { psbt: Uint8Array }) => Promise<{ psbt: Uint8Array }>
}

export interface BridgeFromBitcoinOutput {
  network: "mainnet" | "testnet"
  tx: string
}

export async function bridgeFromBitcoin(
  info: BridgeFromBitcoinInput,
): Promise<BridgeFromBitcoinOutput> {
  const route = await supportedRoutes.checkRouteValid(info)

  if (KnownChainId.isBitcoinChain(route.fromChain)) {
    if (KnownChainId.isStacksChain(route.toChain)) {
      if (
        KnownTokenId.isBitcoinToken(route.fromToken) &&
        KnownTokenId.isStacksToken(route.toToken)
      ) {
        return bridgeFromBitcoin_toStacks({
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isEVMChain(route.toChain)) {
      if (
        KnownTokenId.isBitcoinToken(route.fromToken) &&
        KnownTokenId.isEVMToken(route.toToken)
      ) {
        return bridgeFromBitcoin_toEVM({
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else {
      assertExclude(route.toChain, assertExclude.i<KnownChainId.BitcoinChain>())
      checkNever(route)
    }
  } else {
    assertExclude(route.fromChain, assertExclude.i<KnownChainId.EVMChain>())
    assertExclude(route.fromChain, assertExclude.i<KnownChainId.StacksChain>())
    checkNever(route)
  }

  throw new UnsupportedBridgeRouteError(
    info.fromChain,
    info.toChain,
    info.fromToken,
    info.toToken,
  )
}

async function bridgeFromBitcoin_toStacks(
  info: Omit<
    BridgeFromBitcoinInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > & {
    fromChain: KnownChainId.BitcoinChain
    toChain: KnownChainId.StacksChain
    fromToken: KnownTokenId.BitcoinToken
    toToken: KnownTokenId.StacksToken
  },
): Promise<BridgeFromBitcoinOutput> {
  const pegInAddress = getBTCPegInAddress(info.fromChain)
  const contractCallInfo = getStacksContractCallInfo(info.toChain)
  if (pegInAddress == null || contractCallInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
    )
  }

  const { data: opReturnData } = await createBridgeOrder_BitcoinToStacks(
    {
      network: contractCallInfo.network,
      endpointDeployerAddress: contractCallInfo.deployerAddress,
    },
    {
      receiverAddr: info.toAddress,
      swapSlippedAmount: numberToStacksContractNumber(info.amount),
      swapRoute: [],
    },
  )

  return constructBitcoinTransaction({
    validateBridgeOrder: (btcTx, swapRoute) =>
      validateBridgeOrder_BitcoinToStacks(
        {
          network: contractCallInfo.network,
          endpointDeployerAddress: contractCallInfo.deployerAddress,
        },
        { btcTx, swapRoute },
      ),
    networkFeeRate: info.networkFeeRate,
    reselectSpendableUTXOs: info.reselectSpendableUTXOs,
    signPsbt: info.signPsbt,
    fromChain: info.fromChain,
    fromAddress: info.fromAddress,
    fromAmount: info.amount,
    opReturnData,
    pegInAddress: pegInAddress.address,
  })
}

async function bridgeFromBitcoin_toEVM(
  info: Omit<
    BridgeFromBitcoinInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > & {
    fromChain: KnownChainId.BitcoinChain
    toChain: KnownChainId.EVMChain
    fromToken: KnownTokenId.BitcoinToken
    toToken: KnownTokenId.EVMToken
  },
): Promise<BridgeFromBitcoinOutput> {
  const pegInAddress = getBTCPegInAddress(info.fromChain)
  const contractCallInfo = getStacksContractCallInfo(
    info.fromChain === KnownChainId.Bitcoin.Mainnet
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet,
  )
  if (pegInAddress == null || contractCallInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
    )
  }

  const { data: opReturnData } = await createBridgeOrder_BitcoinToEVM(
    {
      network: contractCallInfo.network,
      endpointDeployerAddress: contractCallInfo.deployerAddress,
    },
    {
      targetChain: info.toChain,
      receiverAddr: info.toAddress,
      swapSlippedAmount: numberToStacksContractNumber(info.amount),
      swapRoute: [],
    },
  )

  return constructBitcoinTransaction({
    validateBridgeOrder: (btcTx, swapRoute) =>
      validateBridgeOrder_BitcoinToEVM(
        {
          network: contractCallInfo.network,
          endpointDeployerAddress: contractCallInfo.deployerAddress,
        },
        { btcTx, swapRoute },
      ),
    networkFeeRate: info.networkFeeRate,
    reselectSpendableUTXOs: info.reselectSpendableUTXOs,
    signPsbt: info.signPsbt,
    fromChain: info.fromChain,
    fromAddress: info.fromAddress,
    fromAmount: info.amount,
    opReturnData,
    pegInAddress: pegInAddress.address,
  })
}

async function constructBitcoinTransaction(
  info: Pick<
    BridgeFromBitcoinInput,
    "networkFeeRate" | "reselectSpendableUTXOs" | "signPsbt"
  > & {
    validateBridgeOrder: (
      btcTx: Uint8Array,
      swapRoute: BridgeSwapRoute_FromBitcoin,
    ) => Promise<void>
    fromChain: KnownChainId.BitcoinChain
    fromAddress: string
    fromAmount: string
    opReturnData: Uint8Array
    pegInAddress: string
  },
): Promise<BridgeFromBitcoinOutput> {
  const bitcoinNetwork =
    info.fromChain === KnownChainId.Bitcoin.Mainnet
      ? btc.NETWORK
      : btc.TEST_NETWORK

  const txOptions = await prepareTransaction({
    network: bitcoinNetwork,
    recipients: [
      {
        address: info.pegInAddress,
        satsAmount: bitcoinToSatoshi(info.fromAmount),
      },
    ],
    changeAddress: info.fromAddress,
    opReturnData: [info.opReturnData],
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
    [info.opReturnData],
  )

  await info.validateBridgeOrder(tx.toBytes(true, true), [])

  const { psbt } = await info.signPsbt({
    psbt: tx.toPSBT(),
  })

  const signedTx = btc.Transaction.fromPSBT(psbt, {
    allowUnknownInputs: true,
    allowUnknownOutputs: true,
  })
  signedTx.finalize()

  return {
    network:
      info.fromChain === KnownChainId.Bitcoin.Mainnet ? "mainnet" : "testnet",
    tx: signedTx.hex,
  }
}
