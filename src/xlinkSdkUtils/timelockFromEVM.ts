import { Client, encodeFunctionData, zeroAddress, zeroHash } from "viem"
import { readContract } from "viem/actions"
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

export interface TimeLockedAsset {
  id: string
  chain: KnownChainId.EVMChain
  token: KnownTokenId.EVMToken
  amount: SDKNumber
  releaseTime: Date
}

const getTimeLockContractCallInfo = async (
  chain: KnownChainId.EVMChain,
): Promise<
  | undefined
  | {
      client: Client
      timeLockContractAddress: EVMAddress
    }
> => {
  const info = await getEVMContractCallInfo(chain)
  if (info == null) return

  const timeLockContractAddress = await readContract(info.client, {
    abi: bridgeEndpointAbi,
    address: info.bridgeEndpointContractAddress,
    functionName: "timeLock",
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
  input: GetTimeLockedAssetsInput,
): Promise<GetTimeLockedAssetsOutput> {
  const promises = input.chains.map(async chain => {
    const timeLockCallInfo = await getTimeLockContractCallInfo(chain)
    if (timeLockCallInfo == null) return []

    const tokenCallInfos = (
      await Promise.all(
        _allKnownEVMTokens.map(token =>
          getEVMTokenContractInfo(chain, token).then(info =>
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
        args: [input.walletAddress, 0, info.tokenContractAddress, zeroHash],
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
  sendTransaction: (tx: { to: EVMAddress; data: Uint8Array }) => Promise<{
    txHash: string
  }>
}
export interface ClaimTimeLockedAssetsOutput {
  txHash: string
}
export const claimTimeLockedAssetsFromEVM = async (
  input: ClaimTimeLockedAssetsInput,
): Promise<undefined | ClaimTimeLockedAssetsOutput> => {
  const info = await getTimeLockContractCallInfo(input.chain)
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
  return await input.sendTransaction({
    to: info.timeLockContractAddress,
    data: decodeHex(functionData),
  })
}
