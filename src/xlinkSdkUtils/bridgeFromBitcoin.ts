import * as btc from "@scure/btc-signer"
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
import {
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
}

export interface BridgeFromBitcoinOutput {
  tx: string
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
  > & {
    fromChain: KnownChainId.BitcoinChain
    toChain: KnownChainId.StacksChain
    fromToken: KnownTokenId.BitcoinToken
    toToken: KnownTokenId.StacksToken
  },
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
    fromAddressScriptPubKey: info.fromAddressScriptPubKey,
    fromAmount: info.amount,
    opReturnData,
    pegInAddressScriptPubKey: pegInAddress.scriptPubKey,
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

  const { data: opReturnData } = await createBridgeOrder_BitcoinToEVM(
    {
      network: contractCallInfo.network,
      endpointDeployerAddress: contractCallInfo.deployerAddress,
    },
    {
      targetChain: info.toChain,
      fromBitcoinScriptPubKey: info.fromAddressScriptPubKey,
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
    fromAddressScriptPubKey: info.fromAddressScriptPubKey,
    fromAmount: info.amount,
    opReturnData,
    pegInAddressScriptPubKey: pegInAddress.scriptPubKey,
  })
}

async function constructBitcoinTransaction(
  info: PrepareBitcoinTransactionInput &
    Pick<BridgeFromBitcoinInput, "signPsbt"> & {
      validateBridgeOrder: (
        btcTx: Uint8Array,
        swapRoute: BridgeSwapRoute_FromBitcoin,
      ) => Promise<void>
    },
): Promise<BridgeFromBitcoinOutput> {
  const txOptions = await prepareBitcoinTransaction(info)

  const tx = createTransaction(
    txOptions.inputs,
    txOptions.recipients.concat({
      addressScriptPubKey: info.fromAddressScriptPubKey,
      satsAmount: txOptions.changeAmount,
    }),
    [info.opReturnData],
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

  await info.validateBridgeOrder(decodeHex(hex), [])

  return {
    tx: hex,
  }
}

export type PrepareBitcoinTransactionInput = Pick<
  BridgeFromBitcoinInput,
  "networkFeeRate" | "reselectSpendableUTXOs" | "fromAddressScriptPubKey"
> & {
  fromChain: KnownChainId.BitcoinChain
  fromAmount: string
  opReturnData: Uint8Array
  pegInAddressScriptPubKey: Uint8Array
}
export async function prepareBitcoinTransaction(
  info: PrepareBitcoinTransactionInput,
): Promise<
  BitcoinTransactionPrepareResult & {
    bitcoinNetwork: typeof btc.NETWORK
  }
> {
  const bitcoinNetwork =
    info.fromChain === KnownChainId.Bitcoin.Mainnet
      ? btc.NETWORK
      : btc.TEST_NETWORK

  const result = await prepareTransaction({
    recipients: [
      {
        addressScriptPubKey: info.pegInAddressScriptPubKey,
        satsAmount: bitcoinToSatoshi(info.fromAmount),
      },
    ],
    changeAddressScriptPubKey: info.fromAddressScriptPubKey,
    opReturnData: [info.opReturnData],
    feeRate: info.networkFeeRate,
    reselectSpendableUTXOs: info.reselectSpendableUTXOs,
  })

  return {
    ...result,
    bitcoinNetwork,
  }
}
