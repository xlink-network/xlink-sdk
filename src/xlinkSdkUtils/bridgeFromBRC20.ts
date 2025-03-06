import * as btc from "@scure/btc-signer"
import { broadcastRevealableTransaction } from "../bitcoinUtils/apiHelpers/broadcastRevealableTransaction"
import { createBitcoinPegInRecipients } from "../bitcoinUtils/apiHelpers/createBitcoinPegInRecipients"
import { createRevealTx } from "../bitcoinUtils/apiHelpers/createRevealTx"
import {
  UTXOSpendable,
  bitcoinToSatoshi,
  isSameUTXO,
  sumUTXO,
} from "../bitcoinUtils/bitcoinHelpers"
import {
  BitcoinAddress,
  getBTCPegInAddress,
  getBitcoinHardLinkageAddress,
} from "../bitcoinUtils/btcAddresses"
import { BITCOIN_OUTPUT_MINIMUM_AMOUNT } from "../bitcoinUtils/constants"
import { createTransaction } from "../bitcoinUtils/createTransaction"
import {
  BitcoinTransactionPrepareResult,
  prepareTransaction,
} from "../bitcoinUtils/prepareTransaction"
import { getMetaPegInAddress } from "../metaUtils/btcAddresses"
import {
  getMeta2StacksFeeInfo,
  isSupportedBRC20Route,
} from "../metaUtils/peggingHelpers"
import { CreateBridgeOrderResult } from "../stacksUtils/createBridgeOrderFromBitcoin"
import {
  createBridgeOrder_MetaToBitcoin,
  createBridgeOrder_MetaToEVM,
  createBridgeOrder_MetaToMeta,
  createBridgeOrder_MetaToStacks,
} from "../stacksUtils/createBridgeOrderFromMeta"
import { validateBridgeOrderFromMeta } from "../stacksUtils/validateBridgeOrderFromMeta"
import { getStacksTokenContractInfo } from "../stacksUtils/xlinkContractHelpers"
import { range } from "../utils/arrayHelpers"
import { BigNumber } from "../utils/BigNumber"
import {
  KnownRoute_FromBRC20,
  KnownRoute_FromBRC20_ToBRC20,
  KnownRoute_FromBRC20_ToBitcoin,
  KnownRoute_FromBRC20_ToEVM,
  KnownRoute_FromBRC20_ToRunes,
  KnownRoute_FromBRC20_ToStacks,
  KnownRoute_FromMeta,
  checkRouteValid,
} from "../utils/buildSupportedRoutes"
import {
  BridgeValidateFailedError,
  InvalidMethodParametersError,
  UnsupportedBridgeRouteError,
} from "../utils/errors"
import { decodeHex } from "../utils/hexHelpers"
import {
  SwapRoute,
  SwapRoute_WithMinimumAmountsToReceive_Public,
  SwapRouteViaALEX,
  SwapRouteViaALEX_WithMinimumAmountsToReceive_Public,
  SwapRouteViaEVMDexAggregator,
  SwapRouteViaEVMDexAggregator_WithMinimumAmountsToReceive_Public,
  toCorrespondingStacksToken,
} from "../utils/SwapRouteHelpers"
import { assertExclude, checkNever } from "../utils/typeHelpers"
import {
  KnownChainId,
  KnownTokenId,
  _knownChainIdToErrorMessagePart,
  getChainIdNetworkType,
} from "../utils/types/knownIds"
import { TransferProphet_Fee_Fixed } from "../utils/types/TransferProphet"
import { ChainId, TokenId, isEVMAddress } from "./types"
import { SDKGlobalContext } from "./types.internal"

export type BridgeFromBRC20Input_signPsbtFn = (tx: {
  psbt: Uint8Array
  signBitcoinInputs: number[]
  signInscriptionInputs: number[]
}) => Promise<{ psbt: Uint8Array }>

export type BridgeFromBRC20Input_ReselectNetworkFeeUTXOs = (
  satsToSend: bigint,
  lastTimeSelectedUTXOs: UTXOSpendable[],
) => Promise<UTXOSpendable[]>

export interface BridgeFromBRC20Input {
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

  inputInscriptionUTXO: UTXOSpendable

  networkFeeRate: bigint
  swapRoute?: SwapRoute_WithMinimumAmountsToReceive_Public
  reselectSpendableNetworkFeeUTXOs: BridgeFromBRC20Input_ReselectNetworkFeeUTXOs
  signPsbt: BridgeFromBRC20Input_signPsbtFn
  sendTransaction: (tx: {
    hex: string
    pegInOrderOutput: {
      index: number
      amount: bigint
      orderData: Uint8Array
    }
  }) => Promise<{
    txid: string
  }>
}

export interface BridgeFromBRC20Output {
  txid: string
}

export async function bridgeFromBRC20(
  ctx: SDKGlobalContext,
  info: BridgeFromBRC20Input,
): Promise<BridgeFromBRC20Output> {
  const route = await checkRouteValid(ctx, isSupportedBRC20Route, info)

  if (KnownChainId.isBRC20Chain(route.fromChain)) {
    if (KnownChainId.isStacksChain(route.toChain)) {
      if (
        KnownTokenId.isBRC20Token(route.fromToken) &&
        KnownTokenId.isStacksToken(route.toToken)
      ) {
        return bridgeFromBRC20_toStacks(ctx, {
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isEVMChain(route.toChain)) {
      if (
        KnownTokenId.isBRC20Token(route.fromToken) &&
        KnownTokenId.isEVMToken(route.toToken)
      ) {
        return bridgeFromBRC20_toEVM(ctx, {
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isBitcoinChain(route.toChain)) {
      if (
        KnownTokenId.isBRC20Token(route.fromToken) &&
        KnownTokenId.isBitcoinToken(route.toToken)
      ) {
        return bridgeFromBRC20_toBitcoin(ctx, {
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isBRC20Chain(route.toChain)) {
      if (
        KnownTokenId.isBRC20Token(route.fromToken) &&
        KnownTokenId.isBRC20Token(route.toToken)
      ) {
        return bridgeFromBRC20_toMeta(ctx, {
          ...info,
          fromChain: route.fromChain,
          toChain: route.toChain,
          fromToken: route.fromToken,
          toToken: route.toToken,
        })
      }
    } else if (KnownChainId.isRunesChain(route.toChain)) {
      if (
        KnownTokenId.isBRC20Token(route.fromToken) &&
        KnownTokenId.isRunesToken(route.toToken)
      ) {
        return bridgeFromBRC20_toMeta(ctx, {
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
    assertExclude(route.fromChain, assertExclude.i<KnownChainId.BitcoinChain>())
    assertExclude(route.fromChain, assertExclude.i<KnownChainId.RunesChain>())
    checkNever(route)
  }

  throw new UnsupportedBridgeRouteError(
    info.fromChain,
    info.toChain,
    info.fromToken,
    info.toToken,
  )
}

export async function getBridgeFeeOutput(
  sdkContext: SDKGlobalContext,
  info: KnownRoute_FromMeta & {
    swapRoute?: SwapRoute
  },
): Promise<null | {
  address: string
  scriptPubKey: Uint8Array
  satsAmount: BigNumber
}> {
  const btcPegInAddress = getBTCPegInAddress(
    getChainIdNetworkType(info.fromChain) === "mainnet"
      ? KnownChainId.Bitcoin.Mainnet
      : KnownChainId.Bitcoin.Testnet,
    info.toChain,
  )
  const transitStacksChain =
    getChainIdNetworkType(info.fromChain) === "mainnet"
      ? KnownChainId.Stacks.Mainnet
      : KnownChainId.Stacks.Testnet
  const transitStacksToken = await toCorrespondingStacksToken(
    sdkContext,
    info.fromChain,
    info.fromToken,
  )
  if (btcPegInAddress == null || transitStacksToken == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const step1FeeInfo = await getMeta2StacksFeeInfo(
    sdkContext,
    {
      fromChain: info.fromChain as KnownChainId.BRC20Chain,
      fromToken: info.fromToken as KnownTokenId.BRC20Token,
      toChain: transitStacksChain,
      toToken: transitStacksToken,
    },
    { swapRoute: info.swapRoute ?? null },
  )
  if (step1FeeInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const bridgeFeeInBTC = step1FeeInfo.fees.find(
    (f): f is TransferProphet_Fee_Fixed =>
      f.type === "fixed" && f.token === KnownTokenId.Bitcoin.BTC,
  )

  if (bridgeFeeInBTC == null) return null
  if (BigNumber.isZero(bridgeFeeInBTC.amount)) return null

  return {
    ...btcPegInAddress,
    satsAmount: BigNumber.from(
      bitcoinToSatoshi(BigNumber.toString(bridgeFeeInBTC.amount)),
    ),
  }
}

async function bridgeFromBRC20_toStacks(
  sdkContext: SDKGlobalContext,
  info: Omit<
    BridgeFromBRC20Input,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    KnownRoute_FromBRC20_ToStacks,
): Promise<BridgeFromBRC20Output> {
  const swapRoute = info.swapRoute

  const pegInAddress = getMetaPegInAddress(info.fromChain, info.toChain)
  const toTokenContractInfo = await getStacksTokenContractInfo(
    sdkContext,
    info.toChain,
    info.toToken,
  )
  if (pegInAddress == null || toTokenContractInfo == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const createdOrder = await createBridgeOrder_MetaToStacks(sdkContext, {
    fromChain: info.fromChain,
    fromToken: info.fromToken,
    fromBitcoinScriptPubKey: info.fromAddressScriptPubKey,
    toChain: info.toChain,
    toToken: info.toToken,
    toStacksAddress: info.toAddress,
    swap:
      swapRoute == null
        ? undefined
        : {
            ...swapRoute,
            minimumAmountsToReceive: BigNumber.from(
              swapRoute.minimumAmountsToReceive,
            ),
          },
  })
  if (createdOrder == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const bridgeFeeOutput = await getBridgeFeeOutput(sdkContext, info)

  return broadcastBRC20Transaction(
    sdkContext,
    {
      ...info,
      withHardLinkageOutput: false,
      bridgeFeeOutput,
      swapRoute: info.swapRoute,
    },
    createdOrder,
  )
}

async function bridgeFromBRC20_toEVM(
  sdkContext: SDKGlobalContext,
  info: Omit<
    BridgeFromBRC20Input,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    KnownRoute_FromBRC20_ToEVM,
): Promise<BridgeFromBRC20Output> {
  const swapRoute = info.swapRoute

  const createdOrder = !isEVMAddress(info.toAddress)
    ? null
    : await createBridgeOrder_MetaToEVM(sdkContext, {
        ...info,
        fromBitcoinScriptPubKey: info.fromAddressScriptPubKey,
        toEVMAddress: info.toAddress,
        swap:
          swapRoute == null
            ? undefined
            : {
                ...swapRoute,
                minimumAmountsToReceive: BigNumber.from(
                  swapRoute.minimumAmountsToReceive,
                ),
              },
      })
  if (createdOrder == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const bridgeFeeOutput = await getBridgeFeeOutput(sdkContext, info)

  return broadcastBRC20Transaction(
    sdkContext,
    {
      ...info,
      withHardLinkageOutput: false,
      bridgeFeeOutput,
      swapRoute: info.swapRoute,
    },
    createdOrder,
  )
}

async function bridgeFromBRC20_toBitcoin(
  sdkContext: SDKGlobalContext,
  info: Omit<
    BridgeFromBRC20Input,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    KnownRoute_FromBRC20_ToBitcoin,
): Promise<BridgeFromBRC20Output> {
  if (info.toAddressScriptPubKey == null) {
    throw new InvalidMethodParametersError(
      [
        "XLinkSDK",
        `bridgeFromBRC20 (to ${_knownChainIdToErrorMessagePart(info.toChain)})`,
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

  const swapRoute = info.swapRoute
  const createdOrder = await createBridgeOrder_MetaToBitcoin(sdkContext, {
    ...info,
    fromBitcoinScriptPubKey: info.fromAddressScriptPubKey,
    toBitcoinScriptPubKey: info.toAddressScriptPubKey,
    swap:
      swapRoute == null
        ? undefined
        : {
            ...swapRoute,
            minimumAmountsToReceive: BigNumber.from(
              swapRoute.minimumAmountsToReceive,
            ),
          },
  })
  if (createdOrder == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const bridgeFeeOutput = await getBridgeFeeOutput(sdkContext, info)

  return broadcastBRC20Transaction(
    sdkContext,
    {
      ...info,
      withHardLinkageOutput: true,
      bridgeFeeOutput,
      swapRoute: info.swapRoute,
    },
    createdOrder,
  )
}

async function bridgeFromBRC20_toMeta(
  sdkContext: SDKGlobalContext,
  info: Omit<
    BridgeFromBRC20Input,
    "fromChain" | "toChain" | "fromToken" | "toToken"
  > &
    (KnownRoute_FromBRC20_ToBRC20 | KnownRoute_FromBRC20_ToRunes),
): Promise<BridgeFromBRC20Output> {
  if (info.toAddressScriptPubKey == null) {
    throw new InvalidMethodParametersError(
      [
        "XLinkSDK",
        `bridgeFromBRC20 (to ${_knownChainIdToErrorMessagePart(info.toChain)})`,
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

  const swapRoute = info.swapRoute
  const createdOrder = await createBridgeOrder_MetaToMeta(sdkContext, {
    ...info,
    fromBitcoinScriptPubKey: info.fromAddressScriptPubKey,
    toBitcoinScriptPubKey: info.toAddressScriptPubKey,
    swap:
      swapRoute == null
        ? undefined
        : {
            ...swapRoute,
            minimumAmountsToReceive: BigNumber.from(
              swapRoute.minimumAmountsToReceive,
            ),
          },
  })
  if (createdOrder == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const bridgeFeeOutput = await getBridgeFeeOutput(sdkContext, info)

  return broadcastBRC20Transaction(
    sdkContext,
    {
      ...info,
      withHardLinkageOutput: true,
      bridgeFeeOutput,
      swapRoute: info.swapRoute,
    },
    createdOrder,
  )
}

async function broadcastBRC20Transaction(
  sdkContext: SDKGlobalContext,
  info: Omit<
    ConstructBitcoinTransactionInput,
    "validateBridgeOrder" | "orderData" | "pegInAddress" | "hardLinkageOutput"
  > & {
    withHardLinkageOutput: boolean
    sendTransaction: BridgeFromBRC20Input["sendTransaction"]
  },
  createdOrder: CreateBridgeOrderResult,
): Promise<{ txid: string }> {
  const pegInAddress = getMetaPegInAddress(info.fromChain, info.toChain)
  if (pegInAddress == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
    )
  }

  const route: KnownRoute_FromBRC20 = {
    fromChain: info.fromChain,
    fromToken: info.fromToken,
    toChain: info.toChain,
    toToken: info.toToken,
  } as any

  const tx = await constructBRC20Transaction(sdkContext, {
    ...info,
    ...route,
    validateBridgeOrder: async (btcTx, revealTx, extra) => {
      if (revealTx == null) {
        throw new UnsupportedBridgeRouteError(
          info.fromChain,
          info.toChain,
          info.fromToken,
          info.toToken,
        )
      }

      /**
       * due to contract limit, we are unable to validate this tx before the
       * commit tx be confirmed, so we will skip it and fix it in the future
       */
      void validateBridgeOrderFromMeta({
        chainId: info.fromChain,
        commitTx: btcTx,
        revealTx,
        terminatingStacksToken: createdOrder.tokenOutTrait,
        transferOutputIndex: extra.transferOutputIndex,
        bridgeFeeOutputIndex: extra.bridgeFeeOutputIndex,
        swapRoute: extra.swapRoute,
      })
    },
    orderData: createdOrder.data,
    pegInAddress,
    hardLinkageOutput: info.withHardLinkageOutput
      ? ((await getBitcoinHardLinkageAddress(info.fromChain, info.toChain)) ??
        null)
      : null,
  })

  if (tx.revealOutput == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      info.fromToken,
      info.toToken,
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
    pegInOrderOutput: {
      index: tx.revealOutput.index,
      amount: tx.revealOutput.satsAmount,
      orderData: createdOrder.data,
    },
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

type ConstructBitcoinTransactionInput = PrepareBRC20TransactionInput & {
  swapRoute:
    | undefined
    | SwapRouteViaALEX_WithMinimumAmountsToReceive_Public
    | SwapRouteViaEVMDexAggregator_WithMinimumAmountsToReceive_Public
  signPsbt: BridgeFromBRC20Input["signPsbt"]
  pegInAddress: BitcoinAddress
  validateBridgeOrder: (
    pegInTx: Uint8Array,
    revealTx: undefined | Uint8Array,
    info: {
      transferOutputIndex: number
      bridgeFeeOutputIndex: undefined | number
      swapRoute: undefined | SwapRouteViaALEX | SwapRouteViaEVMDexAggregator
    },
  ) => Promise<void>
}
async function constructBRC20Transaction(
  sdkContext: SDKGlobalContext,
  info: ConstructBitcoinTransactionInput,
): Promise<{
  hex: string
  revealOutput?: {
    index: number
    satsAmount: bigint
  }
}> {
  const txOptions = await prepareBRC20Transaction(sdkContext, info)

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
    signInscriptionInputs: [0],
    signBitcoinInputs: range(1, tx.inputsLength),
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
    .validateBridgeOrder(signedTx.extract(), revealTx, {
      transferOutputIndex: txOptions.transferOutput.index,
      bridgeFeeOutputIndex: txOptions.bridgeFeeOutput?.index,
      swapRoute: info.swapRoute,
    })
    .catch(err => {
      if (sdkContext.brc20.ignoreValidateResult) {
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

export type PrepareBRC20TransactionInput = KnownRoute_FromBRC20 & {
  fromAddressScriptPubKey: BridgeFromBRC20Input["fromAddressScriptPubKey"]
  fromAddress: BridgeFromBRC20Input["fromAddress"]
  toAddress: BridgeFromBRC20Input["toAddress"]
  inputInscriptionUTXO: BridgeFromBRC20Input["inputInscriptionUTXO"]
  networkFeeRate: BridgeFromBRC20Input["networkFeeRate"]
  reselectSpendableNetworkFeeUTXOs: BridgeFromBRC20Input["reselectSpendableNetworkFeeUTXOs"]
  pegInAddress: BitcoinAddress
  orderData: Uint8Array
  bridgeFeeOutput: null | {
    address: string
    scriptPubKey: Uint8Array
    satsAmount: BigNumber
  }
  hardLinkageOutput: null | BitcoinAddress
}
/**
 * Bitcoin Tx Structure:
 *
 * * Inputs: ...
 * * Outputs:
 *    * BRC-20 transfer inscription
 *    * Order data
 *    * Bridge fee (optional)
 *    * Hard linkage (optional)
 *    * Bitcoin Changes
 */
export async function prepareBRC20Transaction(
  sdkContext: Pick<SDKGlobalContext, "backendAPI">,
  info: PrepareBRC20TransactionInput,
): Promise<
  BitcoinTransactionPrepareResult & {
    bitcoinNetwork: typeof btc.NETWORK
    transferOutput: {
      index: number
    }
    revealOutput?: {
      index: number
      satsAmount: bigint
    }
    bridgeFeeOutput?: {
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
    getChainIdNetworkType(info.fromChain) === "mainnet"
      ? btc.NETWORK
      : btc.TEST_NETWORK

  const recipient = await createBitcoinPegInRecipients(sdkContext, {
    fromChain: info.fromChain,
    fromToken: info.fromToken,
    toChain: info.toChain,
    toToken: info.toToken,
    fromAddress: {
      address: info.fromAddress,
      scriptPubKey: info.fromAddressScriptPubKey,
    },
    toAddress: info.toAddress,
    orderData: info.orderData,
    feeRate: info.networkFeeRate,
  })

  const result = await prepareTransaction({
    pinnedUTXOs: [info.inputInscriptionUTXO],
    recipients: [
      {
        addressScriptPubKey: info.pegInAddress.scriptPubKey,
        satsAmount: info.inputInscriptionUTXO.amount,
      },
      {
        addressScriptPubKey: recipient.scriptPubKey,
        satsAmount: recipient.satsAmount,
      },
      ...(info.bridgeFeeOutput == null
        ? []
        : [
            {
              addressScriptPubKey: info.pegInAddress.scriptPubKey,
              satsAmount: BigNumber.toBigInt(
                { roundingMode: BigNumber.roundUp },
                info.bridgeFeeOutput.satsAmount,
              ),
            },
          ]),
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
    reselectSpendableUTXOs: async (
      satsToSend,
      pinnedUTXOs,
      lastTimeSelectedUTXOs,
    ) => {
      satsToSend = satsToSend - sumUTXO(pinnedUTXOs)
      lastTimeSelectedUTXOs = lastTimeSelectedUTXOs.filter(iterUTXO =>
        pinnedUTXOs.find(pinnedUTXO => !isSameUTXO(iterUTXO, pinnedUTXO)),
      )
      const selected = await info.reselectSpendableNetworkFeeUTXOs(
        satsToSend,
        lastTimeSelectedUTXOs,
      )
      return [...pinnedUTXOs, ...selected]
    },
  })

  return {
    ...result,
    bitcoinNetwork,
    transferOutput: {
      index: 0,
    },
    revealOutput: {
      index: 1,
      satsAmount: recipient.satsAmount,
    },
    bridgeFeeOutput:
      info.bridgeFeeOutput == null
        ? undefined
        : {
            index: 2,
            satsAmount: bitcoinToSatoshi(
              BigNumber.toString(info.bridgeFeeOutput.satsAmount),
            ),
          },
    hardLinkageOutput:
      info.hardLinkageOutput == null
        ? undefined
        : {
            index: info.bridgeFeeOutput == null ? 2 : 3,
            satsAmount: BITCOIN_OUTPUT_MINIMUM_AMOUNT,
          },
  }
}
