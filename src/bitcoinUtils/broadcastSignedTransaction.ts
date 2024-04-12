import { encodeHex } from "../utils/hexHelpers"
import { mempoolFetch } from "./mempoolFetch"

export const broadcastSignedTransaction = async (
  network: "mainnet" | "testnet",
  transaction: string | Uint8Array,
): Promise<{ txId: string }> => {
  const transactionHex =
    typeof transaction === "string" ? transaction : encodeHex(transaction)

  const res = await mempoolFetch<string>({
    network,
    method: "post",
    path: "/tx",
    body: transactionHex,
    parseResponse: resp => resp.text(),
  })

  return {
    txId: res,
  }
}
