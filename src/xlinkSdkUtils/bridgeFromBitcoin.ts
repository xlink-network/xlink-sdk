import * as btc from "@scure/btc-signer"
import { broadcastRevealableTransaction } from "../bitcoinUtils/apiHelpers/broadcastRevealableTransaction"
import { createBitcoinPegInRecipients } from "../bitcoinUtils/apiHelpers/createBitcoinPegInRecipients"
import { bitcoinToSatoshi } from "../bitcoinUtils/bitcoinHelpers"
import { getBTCPegInAddress } from "../bitcoinUtils/btcAddresses"
import { createTransaction } from "../bitcoinUtils/createTransaction"
import { isSupportedBitcoinRoute } from "../bitcoinUtils/peggingHelpers"
import {
  BitcoinTransactionPrepareResult,
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
import { range } from "../utils/arrayHelpers"
import { BigNumber } from "../utils/BigNumber"
import {
  KnownRoute_FromBitcoin,
  KnownRoute_FromBitcoin_ToEVM,
  KnownRoute_FromBitcoin_ToStacks,
  buildSupportedRoutes,
  defineRoute,
} from "../utils/buildSupportedRoutes"
import { UnsupportedBridgeRouteError } from "../utils/errors"
import { decodeHex } from "../utils/hexHelpers"
import { assertExclude, checkNever } from "../utils/typeHelpers"
import {
  KnownChainId,
  KnownTokenId,
  _allKnownEVMMainnetChains,
  _allKnownEVMTestnetChains,
} from "../utils/types/knownIds"
import { ChainId, SDKNumber, TokenId } from "./types"
import { SDKGlobalContext } from "./types.internal"
import { createRevealTx } from "../bitcoinUtils/apiHelpers/createRevealTx"

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
      [
        [KnownTokenId.Bitcoin.BTC, KnownTokenId.EVM.WBTC],
        [KnownTokenId.Bitcoin.BTC, KnownTokenId.EVM.BTCB],
        [KnownTokenId.Bitcoin.BTC, KnownTokenId.EVM.aBTC],
      ],
    ),
  ],
  {
    isSupported: isSupportedBitcoinRoute,
  },
)

export type BridgeFromBitcoinInput_signPsbtFn = (tx: {
  psbt: Uint8Array
  signInputs: number[]
}) => Promise<{ psbt: Uint8Array }>

export interface BridgeFromBitcoinInput {
  fromChain: ChainId
  toChain: ChainId
  fromToken: TokenId
  toToken: TokenId
  fromAddress: string
  fromAddressScriptPubKey: Uint8Array
  toAddress: string
  amount: SDKNumber
  networkFeeRate: bigint
  reselectSpendableUTXOs: ReselectSpendableUTXOsFn
  signPsbt: BridgeFromBitcoinInput_signPsbtFn
  sendTransaction: (tx: { hex: string }) => Promise<{
    txid: string
  }>
}

export interface BridgeFromBitcoinOutput {
  txid: string
}

export async function bridgeFromBitcoin(
  ctx: SDKGlobalContext,
  info: BridgeFromBitcoinInput,
): Promise<BridgeFromBitcoinOutput> {
  const route = await supportedRoutes.checkRouteValid(ctx, info)

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
  > &
    KnownRoute_FromBitcoin_ToStacks,
): Promise<BridgeFromBitcoinOutput> {
  const pegInAddress = getBTCPegInAddress(info.fromChain, info.toChain)
  const contractCallInfo = getStacksContractCallInfo(info.toChain)
  if (pegInAddress == null || contractCallInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
    )
  }

  const { data: orderData } = await createBridgeOrder_BitcoinToStacks(
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

  const tx = await constructBitcoinTransaction({
    ...info,
    validateBridgeOrder: (btcTx, revealTx, swapRoute) =>
      validateBridgeOrder_BitcoinToStacks(
        {
          network: contractCallInfo.network,
          endpointDeployerAddress: contractCallInfo.deployerAddress,
        },
        { btcTx, swapRoute },
      ),
    orderData,
    pegInAddress,
  })

  if (tx.revealOutput != null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
    )
  }

  const { txid: delegateBroadcastedTxId } = await info.sendTransaction({
    hex: tx.hex,
  })

  return { txid: delegateBroadcastedTxId }
}

async function bridgeFromBitcoin_toEVM(
  info: Omit<
    BridgeFromBitcoinInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    KnownRoute_FromBitcoin_ToEVM,
): Promise<BridgeFromBitcoinOutput> {
  const pegInAddress = getBTCPegInAddress(info.fromChain, info.toChain)
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

  const createdOrder = await createBridgeOrder_BitcoinToEVM(
    {
      network: contractCallInfo.network,
      endpointDeployerAddress: contractCallInfo.deployerAddress,
    },
    {
      targetChain: info.toChain,
      targetToken: info.toToken,
      fromBitcoinScriptPubKey: info.fromAddressScriptPubKey,
      receiverAddr: info.toAddress,
      swapSlippedAmount: numberToStacksContractNumber(info.amount),
      swapRoute: [],
    },
  )
  if (createdOrder == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
    )
  }

  const tx = await constructBitcoinTransaction({
    ...info,
    validateBridgeOrder: (btcTx, revealTx, swapRoute) => {
      if (revealTx == null) {
        throw new UnsupportedBridgeRouteError(
          info.fromChain,
          info.toChain,
          KnownTokenId.Bitcoin.BTC,
        )
      }

      return validateBridgeOrder_BitcoinToEVM(
        {
          network: contractCallInfo.network,
          endpointDeployerAddress: contractCallInfo.deployerAddress,
        },
        {
          commitTx: btcTx,
          revealTx,
          intermediateStacksToken: createdOrder.intermediateStacksToken,
          swapRoute,
        },
      ).catch(() => {
        // TODO: fix this
      })
    },
    orderData: createdOrder.data,
    pegInAddress,
  })

  if (tx.revealOutput == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
    )
  }

  const { txid: apiBroadcastedTxId } = await broadcastRevealableTransaction({
    fromChain: info.fromChain,
    transactionHex: `0x${tx.hex}`,
    orderData: createdOrder.data,
    orderOutputIndex: tx.revealOutput.index,
    orderOutputSatsAmount: tx.revealOutput.satsAmount,
    xlinkPegInAddress: pegInAddress,
  })

  const { txid: delegateBroadcastedTxId } = await info.sendTransaction({
    hex: tx.hex,
  })

  if (apiBroadcastedTxId !== delegateBroadcastedTxId) {
    console.warn(
      "[xlink-sdk] Transaction id broadcasted by API and delegatee are different:",
      `API: ${apiBroadcastedTxId}, `,
      `Delegatee: ${delegateBroadcastedTxId}`,
    )
  }

  return { txid: delegateBroadcastedTxId }
}

async function constructBitcoinTransaction(
  info: PrepareBitcoinTransactionInput &
    Pick<BridgeFromBitcoinInput, "signPsbt"> & {
      pegInAddress: {
        address: string
        scriptPubKey: Uint8Array
      }
      validateBridgeOrder: (
        pegInTx: Uint8Array,
        revealTx: undefined | Uint8Array,
        swapRoute: BridgeSwapRoute_FromBitcoin,
      ) => Promise<void>
    },
): Promise<{
  hex: string
  revealOutput?: {
    index: number
    satsAmount: bigint
  }
}> {
  const txOptions = await prepareBitcoinTransaction(info)

  const tx = createTransaction(
    txOptions.inputs,
    txOptions.recipients.concat({
      addressScriptPubKey: info.fromAddressScriptPubKey,
      satsAmount: txOptions.changeAmount,
    }),
    txOptions.revealOutput ? [] : [info.orderData],
  )

  const { psbt } = await info.signPsbt({
    psbt: tx.toPSBT(),
    signInputs: range(0, tx.inputsLength),
  })

  const signedTx = btc.Transaction.fromPSBT(psbt, {
    allowUnknownInputs: true,
    allowUnknownOutputs: true,
  })
  if (!signedTx.isFinal) {
    signedTx.finalize()
  }

  const hex = signedTx.hex

  let revealTx: undefined | Uint8Array
  if (txOptions.revealOutput != null) {
    const created = await createRevealTx({
      fromChain: info.fromChain,
      txId: signedTx.id,
      vout: txOptions.revealOutput.index,
      satsAmount: txOptions.revealOutput.satsAmount,
      orderData: info.orderData,
      xlinkPegInAddress: info.pegInAddress,
    })
    revealTx = decodeHex(created.txHex)
  }

  await info.validateBridgeOrder(decodeHex(hex), revealTx, [])

  return {
    hex,
    revealOutput: txOptions.revealOutput,
  }
}

export type PrepareBitcoinTransactionInput = Omit<
  BridgeFromBitcoinInput,
  | "fromChain"
  | "toChain"
  | "fromToken"
  | "toToken"
  | "signPsbt"
  | "sendTransaction"
> &
  KnownRoute_FromBitcoin & {
    orderData: Uint8Array
    pegInAddress: {
      address: string
      scriptPubKey: Uint8Array
    }
  }
export async function prepareBitcoinTransaction(
  info: PrepareBitcoinTransactionInput,
): Promise<
  BitcoinTransactionPrepareResult & {
    bitcoinNetwork: typeof btc.NETWORK
    revealOutput?: {
      index: number
      satsAmount: bigint
    }
  }
> {
  const bitcoinNetwork =
    info.fromChain === KnownChainId.Bitcoin.Mainnet
      ? btc.NETWORK
      : btc.TEST_NETWORK

  if (KnownChainId.isStacksChain(info.toChain)) {
    const result = await prepareTransaction({
      recipients: [
        {
          addressScriptPubKey: info.pegInAddress.scriptPubKey,
          satsAmount: bitcoinToSatoshi(info.amount),
        },
      ],
      changeAddressScriptPubKey: info.fromAddressScriptPubKey,
      feeRate: info.networkFeeRate,
      reselectSpendableUTXOs: info.reselectSpendableUTXOs,
    })

    return {
      ...result,
      bitcoinNetwork,
    }
  }

  const recipient = await createBitcoinPegInRecipients({
    fromChain: info.fromChain,
    toChain: info.toChain,
    fromToken: info.fromToken,
    toToken: info.toToken,
    fromAddress: {
      address: info.fromAddress,
      scriptPubKey: info.fromAddressScriptPubKey,
    },
    toAddress: info.toAddress,
    fromAmount: BigNumber.from(info.amount),
    orderData: info.orderData,
    feeRate: info.networkFeeRate,
  })

  const result = await prepareTransaction({
    recipients: [
      {
        addressScriptPubKey: recipient.scriptPubKey,
        satsAmount: recipient.satsAmount,
      },
      {
        addressScriptPubKey: info.pegInAddress.scriptPubKey,
        satsAmount: bitcoinToSatoshi(info.amount),
      },
    ],
    changeAddressScriptPubKey: info.fromAddressScriptPubKey,
    feeRate: info.networkFeeRate,
    reselectSpendableUTXOs: info.reselectSpendableUTXOs,
  })

  return {
    ...result,
    bitcoinNetwork,
    revealOutput: {
      index: 0,
      satsAmount: recipient.satsAmount,
    },
  }
}
