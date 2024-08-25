import { Client, encodeFunctionData, zeroAddress } from "viem"
import { estimateGas, readContract } from "viem/actions"
import { bridgeEndpointAbi } from "../evmUtils/contractAbi/bridgeEndpoint"
import { bridgeTimeLockAbi } from "../evmUtils/contractAbi/bridgeTimeLock"
import {
  getEVMContractCallInfo,
  getEVMTokenContractInfo,
  numberFromSolidityContractNumber,
} from "../evmUtils/xlinkContractHelpers"
import { BigNumber } from "../utils/BigNumber"
import { UnsupportedChainError } from "../utils/errors"
import { decodeHex } from "../utils/hexHelpers"
import { isNotNull } from "../utils/typeHelpers"
import {
  KnownChainId,
  KnownTokenId,
  _allKnownEVMTokens,
} from "../utils/types/knownIds"
import { EVMAddress, SDKNumber, toSDKNumberOrUndefined } from "./types"
import { SDKGlobalContext } from "./types.internal"

export interface TimeLockedAsset {
  id: string
  chain: KnownChainId.EVMChain
  token: KnownTokenId.EVMToken
  amount: SDKNumber
  releaseTime: Date
}

const getTimeLockContractCallInfo = async (
  ctx: SDKGlobalContext,
  chain: KnownChainId.EVMChain,
): Promise<
  | undefined
  | {
      client: Client
      timeLockContractAddress: EVMAddress
    }
> => {
  const info = await getEVMContractCallInfo(ctx, chain)
  if (info == null) return

  const timeLockContractAddress = await readContract(info.client, {
    abi: bridgeEndpointAbi,
    address: info.bridgeEndpointContractAddress,
    functionName: "timeLock",
  }).catch(err => {
    console.groupCollapsed(
      `Failed to read timeLock contract address from ${info.bridgeEndpointContractAddress} (${chain})`,
    )
    console.debug(err)
    console.groupEnd()
    return zeroAddress
  })
  if (timeLockContractAddress === zeroAddress) return

  return { client: info.client, timeLockContractAddress }
}

export interface GetTimeLockedAssetsInput {
  walletAddress: EVMAddress
  chains: KnownChainId.EVMChain[]
}
export interface GetTimeLockedAssetsOutput {
  assets: TimeLockedAsset[]
}
export async function getTimeLockedAssetsFromEVM(
  ctx: SDKGlobalContext,
  input: GetTimeLockedAssetsInput,
): Promise<GetTimeLockedAssetsOutput> {
  const promises = input.chains.map(async chain => {
    const timeLockCallInfo = await getTimeLockContractCallInfo(ctx, chain)
    if (timeLockCallInfo == null) return []

    const tokenCallInfos = (
      await Promise.all(
        _allKnownEVMTokens.map(token =>
          getEVMTokenContractInfo(ctx, chain, token).then(info =>
            info == null ? info : { ...info, chain, token },
          ),
        ),
      )
    ).filter(isNotNull)

    const results: TimeLockedAsset[] = []
    for (const info of tokenCallInfos) {
      const agreementId = await readContract(timeLockCallInfo.client, {
        abi: bridgeTimeLockAbi,
        address: timeLockCallInfo.timeLockContractAddress,
        functionName: "agreementsByUser",
        args: [input.walletAddress, 0, info.tokenContractAddress, "0x"],
      })
      if (agreementId === 0n) continue

      const agreement = await readContract(timeLockCallInfo.client, {
        abi: bridgeTimeLockAbi,
        address: timeLockCallInfo.timeLockContractAddress,
        functionName: "agreements",
        args: [agreementId],
      })
      results.push({
        id: String(agreementId),
        chain: info.chain,
        token: info.token,
        amount: toSDKNumberOrUndefined(
          numberFromSolidityContractNumber(agreement[0]),
        ),
        releaseTime: new Date(agreement[6] * 1000),
      })
    }
    return results
  })

  return {
    assets: (await Promise.all(promises)).flat(),
  }
}

export interface ClaimTimeLockedAssetsInput {
  chain: KnownChainId.EVMChain
  lockedAssetIds: string[]
  sendTransaction: (tx: {
    to: EVMAddress
    data: Uint8Array
    recommendedGasLimit: SDKNumber
  }) => Promise<{
    txHash: string
  }>
}
export interface ClaimTimeLockedAssetsOutput {
  txHash: string
}
export const claimTimeLockedAssetsFromEVM = async (
  ctx: SDKGlobalContext,
  input: ClaimTimeLockedAssetsInput,
): Promise<undefined | ClaimTimeLockedAssetsOutput> => {
  const info = await getTimeLockContractCallInfo(ctx, input.chain)
  if (info == null) throw new UnsupportedChainError(input.chain)

  const functionData = encodeFunctionData({
    abi: bridgeTimeLockAbi,
    functionName: "claim",
    args: [
      input.lockedAssetIds.map(id =>
        BigNumber.toBigInt({ roundingMode: BigNumber.roundDown }, id),
      ),
    ],
  })
  const estimated = await estimateGas(info.client, {
    to: info.timeLockContractAddress,
    data: functionData,
  })
    .then(n => BigNumber.mul(n, 1.2))
    .catch(
      // add a fallback in case estimate failed
      () =>
        // https://bscscan.com/tx/0x28a81312ca7bc93e7ef07867c9906a41b251ea3ea630b0a4837bdb3066489b32
        1 * 1e5,
    )
  return await input.sendTransaction({
    to: info.timeLockContractAddress,
    data: decodeHex(functionData),
    recommendedGasLimit: toSDKNumberOrUndefined(estimated),
  })
}
