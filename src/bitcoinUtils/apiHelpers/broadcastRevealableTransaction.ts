import { toHex } from "viem"
import { requestAPI } from "../../utils/apiHelpers"
import { KnownChainId } from "../../utils/types/knownIds"

export async function broadcastRevealableTransaction(info: {
  fromChain: KnownChainId.BitcoinChain
  transactionHex: `0x${string}`
  orderData: Uint8Array
  orderOutputIndex: number
  orderOutputSatsAmount: bigint
  xlinkPegInAddress: {
    address: string
    scriptPubKey: Uint8Array
  }
}): Promise<{ txid: string }> {
  const resp = await requestAPI<{
    txId: string
  }>({
    path: `/2024-10-01/bitcoin/broadcast`,
    method: "POST",
    body: {
      fromChain: info.fromChain,
      transactionHex: info.transactionHex,
      orderDataHex: toHex(info.orderData),
      orderOutputIndex: info.orderOutputIndex,
      orderOutputSatoshiAmount: info.orderOutputSatsAmount.toString(),
      xlinkPegInAddress: {
        address: info.xlinkPegInAddress.address,
        scriptPubKey: toHex(info.xlinkPegInAddress.scriptPubKey),
      },
    },
  })

  return { txid: resp.txId }
}
