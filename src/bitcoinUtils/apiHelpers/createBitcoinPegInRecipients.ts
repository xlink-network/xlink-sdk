import { estimateInputVSizeAfterSign } from "@c4/btc-utils"
import { toHex } from "viem"
import { requestAPI } from "../../utils/apiHelpers"
import { BigNumber } from "../../utils/BigNumber"
import { UnsupportedBridgeRouteError } from "../../utils/errors"
import { decodeHex } from "../../utils/hexHelpers"
import { KnownChainId, KnownTokenId } from "../../utils/types/knownIds"
import { SDKGlobalContext } from "../../xlinkSdkUtils/types.internal"
import { getBTCPegInAddress } from "../btcAddresses"
import { BITCOIN_OUTPUT_MINIMUM_AMOUNT } from "../constants"
import { calculateFee } from "../prepareTransaction"

const REVEAL_TX_OUTPUT_AMOUNT = BITCOIN_OUTPUT_MINIMUM_AMOUNT

export async function createBitcoinPegInRecipients(
  sdkContext: Pick<SDKGlobalContext, "backendAPI">,
  info: {
    fromChain: KnownChainId.BitcoinChain
    fromToken: KnownTokenId.BitcoinToken
    toChain:
      | KnownChainId.StacksChain
      | KnownChainId.EVMChain
      | KnownChainId.BRC20Chain
      | KnownChainId.RunesChain
    toToken:
      | KnownTokenId.StacksToken
      | KnownTokenId.EVMToken
      | KnownTokenId.BRC20Token
      | KnownTokenId.RunesToken
    fromAddress: {
      address: string
      scriptPubKey: Uint8Array
    }
    toAddress: string
    fromAmount: BigNumber
    feeRate: bigint
    orderData: Uint8Array
  },
): Promise<{
  address: string
  scriptPubKey: Uint8Array
  satsAmount: bigint
}> {
  const pegInAddress = await getBTCPegInAddress(info.fromChain, info.toChain)
  if (pegInAddress == null) {
    throw new UnsupportedBridgeRouteError(
      info.fromChain,
      info.toChain,
      KnownTokenId.Bitcoin.BTC,
    )
  }

  const resp = await requestAPI<{
    addresses: BitcoinPegInRecipient[]
  }>(sdkContext, {
    path: `/2024-10-01/bitcoin/peg-in-recipients`,
    method: "POST",
    body: {
      fromChain: info.fromChain,
      toChain: info.toChain,
      fromToken: info.fromToken,
      toToken: info.toToken,
      fromAddress: {
        address: info.fromAddress.address,
        scriptPubKeyHex: toHex(info.fromAddress.scriptPubKey),
      },
      toAddress: info.toAddress,
      fromAmount: BigNumber.toString(info.fromAmount),
      orderDataHex: toHex(info.orderData),
    },
  })

  const recipient = resp.addresses.find(
    address => address.type === "commitOrder",
  )!

  const revealInputSize = estimateInputVSizeAfterSign({
    addressType: "p2tr-leafScript",
    tapLeafScriptArgumentByteLengths: [/* signature */ 64],
    tapLeafScriptByteLength: recipient.tapScriptHex.length / 2,
    controlBlockByteLength: 33,
  })
  const { fee: newTxFee } = await calculateFee({
    recipientAddressScriptPubKeys: [pegInAddress.scriptPubKey],
    opReturnData: [],
    selectedUTXOs: [],
    feeRate: info.feeRate,
    extraSize: revealInputSize.inputSize + revealInputSize.witnessDataSize / 4,
  })

  const revealUTXOSatsAmount = BigNumber.sum([
    newTxFee,
    REVEAL_TX_OUTPUT_AMOUNT,
  ])

  return {
    address: recipient.address,
    scriptPubKey: decodeHex(recipient.scriptPubKeyHex),
    satsAmount: BigNumber.toBigInt(
      { roundingMode: BigNumber.roundUp },
      revealUTXOSatsAmount,
    ),
  }
}

export interface BitcoinPegInRecipient {
  type: "commitOrder"
  address: string
  scriptPubKeyHex: string
  tapScriptHex: `0x${string}`
}
