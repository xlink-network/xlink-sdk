import * as btc from "@scure/btc-signer"
import { broadcastRevealableTransaction } from "../bitcoinUtils/apiHelpers/broadcastRevealableTransaction"
import { createBitcoinPegInRecipients } from "../bitcoinUtils/apiHelpers/createBitcoinPegInRecipients"
import { createRevealTx } from "../bitcoinUtils/apiHelpers/createRevealTx"
import { bitcoinToSatoshi } from "../bitcoinUtils/bitcoinHelpers"
import {
  getBitcoinHardLinkageAddress,
  getBTCPegInAddress,
} from "../bitcoinUtils/btcAddresses"
import { createTransaction } from "../bitcoinUtils/createTransaction"
import { isSupportedBitcoinRoute } from "../bitcoinUtils/peggingHelpers"
import {
  BitcoinTransactionPrepareResult,
  ReselectSpendableUTXOsFn,
  prepareTransaction,
} from "../bitcoinUtils/prepareTransaction"
import {
  CreateBridgeOrderResult,
  createBridgeOrder_BitcoinToEVM,
  createBridgeOrder_BitcoinToMeta,
  createBridgeOrder_BitcoinToStacks,
} from "../stacksUtils/createBridgeOrderFromBitcoin"
import { validateBridgeOrder } from "../stacksUtils/validateBridgeOrder"
import { getStacksTokenContractInfo } from "../stacksUtils/xlinkContractHelpers"
import { range } from "../utils/arrayHelpers"
import { BigNumber } from "../utils/BigNumber"
import {
  KnownRoute_FromBitcoin,
  KnownRoute_FromBitcoin_ToBRC20,
  KnownRoute_FromBitcoin_ToEVM,
  KnownRoute_FromBitcoin_ToRunes,
  KnownRoute_FromBitcoin_ToStacks,
  buildSupportedRoutes,
  defineRoute,
} from "../utils/buildSupportedRoutes"
import {
  BridgeValidateFailedError,
  InvalidMethodParametersError,
  UnsupportedBridgeRouteError,
} from "../utils/errors"
import { decodeHex } from "../utils/hexHelpers"
import { assertExclude, checkNever } from "../utils/typeHelpers"
import {
  KnownChainId,
  KnownTokenId,
  _allKnownEVMMainnetChains,
  _allKnownEVMTestnetChains,
  _knownChainIdToErrorMessagePart,
} from "../utils/types/knownIds"
import { ChainId, SDKNumber, TokenId } from "./types"
import { SwapRoute_WithMinimumAmountsToReceive_Public } from "../utils/SwapRouteHelpers"
import { SwapRoute } from "../utils/SwapRouteHelpers"
import { SDKGlobalContext } from "./types.internal"
import { BITCOIN_OUTPUT_MINIMUM_AMOUNT } from "../bitcoinUtils/constants"

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
  /**
   * **Required** when `toChain` is one of bitcoin chains
   */
  toAddressScriptPubKey?: Uint8Array
  amount: SDKNumber
  networkFeeRate: bigint
  swapRoute?: SwapRoute_WithMinimumAmountsToReceive_Public
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
        return bridgeFromBitcoin_toStacks(ctx, {
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
        return bridgeFromBitcoin_toEVM(ctx, {
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isBRC20Chain(route.toChain)) {
      if (
        KnownTokenId.isBitcoinToken(route.fromToken) &&
        KnownTokenId.isBRC20Token(route.toToken)
      ) {
        return bridgeFromBitcoin_toMeta(ctx, {
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isRunesChain(route.toChain)) {
      if (
        KnownTokenId.isBitcoinToken(route.fromToken) &&
        KnownTokenId.isRunesToken(route.toToken)
      ) {
        return bridgeFromBitcoin_toMeta(ctx, {
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
  sdkContext: SDKGlobalContext,
  info: Omit<
    BridgeFromBitcoinInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    KnownRoute_FromBitcoin_ToStacks,
): Promise<BridgeFromBitcoinOutput> {
  const pegInAddress = getBTCPegInAddress(info.fromChain, info.toChain)
  const toTokenContractInfo = await getStacksTokenContractInfo(
    sdkContext,
    info.toChain,
    info.toToken,
  )
  if (pegInAddress == null || toTokenContractInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
    )
  }

  const createdOrder = await createBridgeOrder_BitcoinToStacks(sdkContext, {
    fromChain: info.fromChain,
    fromBitcoinScriptPubKey: info.fromAddressScriptPubKey,
    toChain: info.toChain,
    toToken: info.toToken,
    toStacksAddress: info.toAddress,
    swap:
      info.swapRoute == null
        ? undefined
        : {
            ...info.swapRoute,
            minimumAmountsToReceive: BigNumber.from(
              info.swapRoute.minimumAmountsToReceive,
            ),
          },
  })
  if (createdOrder == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
    )
  }

  return broadcastBitcoinTransaction(
    sdkContext,
    { ...info, withHardLinkageOutput: false },
    createdOrder,
  )
}

async function bridgeFromBitcoin_toEVM(
  sdkContext: SDKGlobalContext,
  info: Omit<
    BridgeFromBitcoinInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    KnownRoute_FromBitcoin_ToEVM,
): Promise<BridgeFromBitcoinOutput> {
  const createdOrder = await createBridgeOrder_BitcoinToEVM(sdkContext, {
    fromChain: info.fromChain,
    toChain: info.toChain,
    toToken: info.toToken,
    fromBitcoinScriptPubKey: info.fromAddressScriptPubKey,
    toEVMAddress: info.toAddress,
    swap:
      info.swapRoute == null
        ? undefined
        : {
            ...info.swapRoute,
            minimumAmountsToReceive: BigNumber.from(
              info.swapRoute.minimumAmountsToReceive,
            ),
          },
  })
  if (createdOrder == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
    )
  }

  return broadcastBitcoinTransaction(
    sdkContext,
    { ...info, withHardLinkageOutput: false },
    createdOrder,
  )
}

async function bridgeFromBitcoin_toMeta(
  sdkContext: SDKGlobalContext,
  info: Omit<
    BridgeFromBitcoinInput,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    (KnownRoute_FromBitcoin_ToBRC20 | KnownRoute_FromBitcoin_ToRunes),
): Promise<BridgeFromBitcoinOutput> {
  if (info.toAddressScriptPubKey == null) {
    throw new InvalidMethodParametersError(
      [
        "XLinkSDK",
        `bridgeFromBitcoin (to ${_knownChainIdToErrorMessagePart(info.toChain)})`,
      ],
      [
        {
          name: "toAddressScriptPubKey",
          expected: "Uint8Array",
          received: "undefined",
        },
      ],
    )
  }

  const createdOrder = await createBridgeOrder_BitcoinToMeta(sdkContext, {
    ...info,
    fromBitcoinScriptPubKey: info.fromAddressScriptPubKey,
    toBitcoinScriptPubKey: info.toAddressScriptPubKey,
    swap:
      info.swapRoute == null
        ? undefined
        : {
            ...info.swapRoute,
            minimumAmountsToReceive: BigNumber.from(
              info.swapRoute.minimumAmountsToReceive,
            ),
          },
  })
  if (createdOrder == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
    )
  }

  return broadcastBitcoinTransaction(
    sdkContext,
    { ...info, withHardLinkageOutput: true },
    createdOrder,
  )
}

async function broadcastBitcoinTransaction(
  sdkContext: SDKGlobalContext,
  info: Omit<
    ConstructBitcoinTransactionInput,
    "validateBridgeOrder" | "orderData" | "pegInAddress" | "hardLinkageOutput"
  > & {
    withHardLinkageOutput: boolean
    sendTransaction: BridgeFromBitcoinInput["sendTransaction"]
  },
  createdOrder: CreateBridgeOrderResult,
): Promise<{ txid: string }> {
  const pegInAddress = getBTCPegInAddress(info.fromChain, info.toChain)
  if (pegInAddress == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
    )
  }

  const tx = await constructBitcoinTransaction(sdkContext, {
    ...(info as any),
    validateBridgeOrder: (btcTx, revealTx, swapRoute) => {
      if (revealTx == null) {
        throw new UnsupportedBridgeRouteError(
          info.fromChain,
          info.toChain,
          KnownTokenId.Bitcoin.BTC,
        )
      }

      return validateBridgeOrder({
        chainId: info.fromChain,
        commitTx: btcTx,
        revealTx,
        terminatingStacksToken: createdOrder.terminatingStacksToken,
        swapRoute,
      })
    },
    orderData: createdOrder.data,
    pegInAddress,
    hardLinkageOutput: info.withHardLinkageOutput
      ? await getBitcoinHardLinkageAddress(info.fromChain, info.toChain as any)
      : null,
  })

  if (tx.revealOutput == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
    )
  }

  const { txid: apiBroadcastedTxId } = await broadcastRevealableTransaction(
    sdkContext,
    {
      fromChain: info.fromChain,
      transactionHex: `0x${tx.hex}`,
      orderData: createdOrder.data,
      orderOutputIndex: tx.revealOutput.index,
      orderOutputSatsAmount: tx.revealOutput.satsAmount,
      xlinkPegInAddress: pegInAddress,
    },
  )

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

type ConstructBitcoinTransactionInput = PrepareBitcoinTransactionInput & {
  signPsbt: BridgeFromBitcoinInput["signPsbt"]
  pegInAddress: {
    address: string
    scriptPubKey: Uint8Array
  }
  validateBridgeOrder: (
    pegInTx: Uint8Array,
    revealTx: undefined | Uint8Array,
    swapRoute?: SwapRoute,
  ) => Promise<void>
}
async function constructBitcoinTransaction(
  sdkContext: SDKGlobalContext,
  info: ConstructBitcoinTransactionInput,
): Promise<{
  hex: string
  revealOutput?: {
    index: number
    satsAmount: bigint
  }
}> {
  const txOptions = await prepareBitcoinTransaction(sdkContext, info)

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

  let revealTx: undefined | Uint8Array
  if (txOptions.revealOutput != null) {
    const created = await createRevealTx(sdkContext, {
      fromChain: info.fromChain,
      txId: signedTx.id,
      vout: txOptions.revealOutput.index,
      satsAmount: txOptions.revealOutput.satsAmount,
      orderData: info.orderData,
      xlinkPegInAddress: info.pegInAddress,
    })
    revealTx = decodeHex(created.txHex)
  }

  await info
    .validateBridgeOrder(signedTx.extract(), revealTx, info.swapRoute)
    .catch(err => {
      if (sdkContext.btc.ignoreValidateResult) {
        console.error(
          "Bridge tx validation failed, but ignoreValidateResult is true, so we ignore the error",
          err,
        )
      } else {
        throw new BridgeValidateFailedError(err)
      }
    })

  return {
    hex: signedTx.hex,
    revealOutput: txOptions.revealOutput,
  }
}

export type PrepareBitcoinTransactionInput = KnownRoute_FromBitcoin & {
  fromAddressScriptPubKey: BridgeFromBitcoinInput["fromAddressScriptPubKey"]
  fromAddress: BridgeFromBitcoinInput["fromAddress"]
  toAddress: BridgeFromBitcoinInput["toAddress"]
  amount: BridgeFromBitcoinInput["amount"]
  swapRoute?: BridgeFromBitcoinInput["swapRoute"]
  networkFeeRate: BridgeFromBitcoinInput["networkFeeRate"]
  reselectSpendableUTXOs: BridgeFromBitcoinInput["reselectSpendableUTXOs"]
  orderData: Uint8Array
  hardLinkageOutput: null | {
    address: string
    scriptPubKey: Uint8Array
  }
  pegInAddress: {
    address: string
    scriptPubKey: Uint8Array
  }
}
/**
 * Bitcoin Tx Structure:
 *
 * * Inputs: ...
 * * Outputs:
 *    * Order data
 *    * Send to ALEX
 *    * Hard linkage
 *    * Changes
 */
export async function prepareBitcoinTransaction(
  sdkContext: Pick<SDKGlobalContext, "backendAPI">,
  info: PrepareBitcoinTransactionInput,
): Promise<
  BitcoinTransactionPrepareResult & {
    bitcoinNetwork: typeof btc.NETWORK
    revealOutput?: {
      index: number
      satsAmount: bigint
    }
    hardLinkageOutput?: {
      index: number
      satsAmount: bigint
    }
  }
> {
  const bitcoinNetwork =
    info.fromChain === KnownChainId.Bitcoin.Mainnet
      ? btc.NETWORK
      : btc.TEST_NETWORK

  const recipient = await createBitcoinPegInRecipients(sdkContext, {
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
      ...(info.hardLinkageOutput == null
        ? []
        : [
            {
              addressScriptPubKey: info.hardLinkageOutput.scriptPubKey,
              satsAmount: BITCOIN_OUTPUT_MINIMUM_AMOUNT,
            },
          ]),
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
    hardLinkageOutput:
      info.hardLinkageOutput == null
        ? undefined
        : {
            index: 2,
            satsAmount: BITCOIN_OUTPUT_MINIMUM_AMOUNT,
          },
  }
}
