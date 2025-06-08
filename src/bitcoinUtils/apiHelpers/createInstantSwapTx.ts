import { toHex } from "viem"
import { SDKGlobalContext } from "../../sdkUtils/types.internal"
import { requestAPI } from "../../utils/apiHelpers"
import { decodeHex } from "../../utils/hexHelpers"
import { getChainIdNetworkType, KnownChainId } from "../../utils/types/knownIds"
import {
  InstantSwapOrderSerialized,
  InstantSwapOrder,
  serializeInstantSwapOrder,
} from "./InstantSwapOrder"

export enum InstantSwapFinalizeJobStatus {
  Pending = "pending",
  Broadcasting = "broadcasting",
  Finalized = "finalized",
  Failed = "failed",
}

export enum InstantSwapFinalizeJobReasonCode {
  Timeout = "timeout",
  BroadcastFailed = "broadcast_failed",
}

type InstantSwapFinalizeJob = {
  jobId: string
  instantSwapOrder: InstantSwapOrderSerialized
} & (
  | {
      status: InstantSwapFinalizeJobStatus.Pending
      psbtHex: `0x${string}`
    }
  | {
      status: InstantSwapFinalizeJobStatus.Broadcasting
      finalizeTxHex: `0x${string}`
    }
  | {
      status: InstantSwapFinalizeJobStatus.Finalized
      finalizeTxHex: `0x${string}`
    }
  | {
      status: InstantSwapFinalizeJobStatus.Failed
      reasonCode: InstantSwapFinalizeJobReasonCode
      reasonDetails: string
    }
)

export async function createInstantSwapTx(
  sdkContext: SDKGlobalContext,
  info: {
    fromChain: KnownChainId.BitcoinChain | KnownChainId.RunesChain
    instantSwapOrder: InstantSwapOrder
    psbt: Uint8Array
  },
): Promise<{ tx: Uint8Array }> {
  const network =
    getChainIdNetworkType(info.fromChain) === "mainnet" ? "mainnet" : "testnet"

  const createdJob = await requestAPI<{ jobId: string }>(sdkContext, {
    path: `/2024-10-01/instant-swap/jobs`,
    method: "POST",
    body: {
      network,
      instantSwapOrder: serializeInstantSwapOrder(
        network,
        info.instantSwapOrder,
      ),
      psbtHex: toHex(info.psbt),
    },
  })

  while (true) {
    const jobs = await requestAPI<{ jobs: InstantSwapFinalizeJob[] }>(
      sdkContext,
      {
        path: `/2024-10-01/instant-swap/jobs`,
        method: "GET",
        query: {
          network,
          ["jobIds[]"]: createdJob.jobId,
        },
      },
    )

    const job = jobs.jobs.find(job => job.jobId === createdJob.jobId)

    if (job?.status === InstantSwapFinalizeJobStatus.Finalized) {
      return { tx: decodeHex(job.finalizeTxHex) }
    }
  }
}
