import { NETWORK, TEST_NETWORK } from "@scure/btc-signer"
import { StacksNetwork } from "@stacks/network"
import {
  c32address,
  c32addressDecode,
  versions as c32addressVersions,
} from "c32check"
import {
  composeTxOptionsFactory,
  executeReadonlyCallFactory,
} from "clarity-codegen"
import { xlinkContracts } from "../../generated/smartContract/contracts_xlink"
import {
  addressToScriptPubKey,
  scriptPubKeyToAddress,
} from "../bitcoinUtils/bitcoinHelpers"
import { STACKS_MAINNET, STACKS_TESTNET } from "../config"
import { BigNumber, BigNumberSource } from "../utils/BigNumber"
import {
  decodeHex,
  encodeHex,
  encodeZeroPrefixedHex,
} from "../utils/hexHelpers"
import { checkNever } from "../utils/typeHelpers"
import { KnownChainId, KnownTokenId } from "../utils/types/knownIds"
import { StacksContractAddress } from "../xlinkSdkUtils/types"
import {
  stxTokenContractAddresses,
  xlinkContractsDeployerMainnet,
  xlinkContractsDeployerTestnet,
  xlinkContractsMultisigMainnet,
  xlinkContractsMultisigTestnet,
} from "./stxContractAddresses"
import { StacksAddressVersionNotSupportedError } from "../utils/errors"

const CONTRACT_COMMON_NUMBER_SCALE = 8
export const numberFromStacksContractNumber = (
  num: bigint,
  decimals?: number,
): BigNumber => {
  return BigNumber.leftMoveDecimals(
    decimals ?? CONTRACT_COMMON_NUMBER_SCALE,
    num,
  )
}
export const numberToStacksContractNumber = (
  num: BigNumberSource,
  decimals?: number,
): bigint => {
  return BigNumber.toBigInt(
    {},
    BigNumber.rightMoveDecimals(decimals ?? CONTRACT_COMMON_NUMBER_SCALE, num),
  )
}

export const composeTxXLINK = composeTxOptionsFactory(xlinkContracts, {})

export const executeReadonlyCallXLINK = executeReadonlyCallFactory(
  xlinkContracts,
  {},
)

export const getStacksContractCallInfo = (
  chainId: KnownChainId.StacksChain,
  contractName:
    | "btc-peg-in-endpoint"
    | "btc-peg-out-endpoint"
    | "evm-peg-in-endpoint"
    | "evm-peg-out-endpoint",
):
  | undefined
  | {
      network: StacksNetwork
      deployerAddress: string
    } => {
  if (chainId === KnownChainId.Stacks.Mainnet) {
    const deployerAddress =
      contractName === "btc-peg-in-endpoint" ||
      contractName === "evm-peg-in-endpoint"
        ? xlinkContractsMultisigMainnet
        : xlinkContractsDeployerMainnet
    return {
      deployerAddress,
      network: STACKS_MAINNET,
    }
  }
  if (chainId === KnownChainId.Stacks.Testnet) {
    const deployerAddress =
      contractName === "btc-peg-in-endpoint" ||
      contractName === "evm-peg-in-endpoint"
        ? xlinkContractsMultisigTestnet
        : xlinkContractsDeployerTestnet
    return {
      deployerAddress,
      network: STACKS_TESTNET,
    }
  }
  checkNever(chainId)
  return
}

export const getStacksTokenContractInfo = (
  chainId: KnownChainId.StacksChain,
  tokenId: KnownTokenId.StacksToken,
): undefined | (StacksContractAddress & { network: StacksNetwork }) => {
  if (stxTokenContractAddresses[tokenId]?.[chainId] == null) {
    return undefined
  }

  const network =
    chainId === KnownChainId.Stacks.Mainnet ? STACKS_MAINNET : STACKS_TESTNET

  return {
    ...stxTokenContractAddresses[tokenId]![chainId],
    network,
  }
}

export async function getStacksToken(
  chain: KnownChainId.StacksChain,
  tokenAddress: StacksContractAddress,
): Promise<undefined | KnownTokenId.StacksToken> {
  for (const token of Object.keys(
    stxTokenContractAddresses,
  ) as (keyof typeof stxTokenContractAddresses)[]) {
    const info = stxTokenContractAddresses[token]?.[chain]
    if (info == null) continue

    if (
      info.deployerAddress === tokenAddress.deployerAddress &&
      info.contractName === tokenAddress.contractName
    ) {
      return token
    }
  }

  return
}

export function addressFromBuffer(
  chain: KnownChainId.KnownChain,
  buffer: Uint8Array,
): string {
  if (KnownChainId.isStacksChain(chain)) {
    return c32address(
      c32addressVersions[
        chain === KnownChainId.Stacks.Mainnet ? "mainnet" : "testnet"
      ].p2pkh,
      encodeHex(buffer),
    )
  }

  if (KnownChainId.isBitcoinChain(chain)) {
    return scriptPubKeyToAddress(
      chain === KnownChainId.Bitcoin.Mainnet ? NETWORK : TEST_NETWORK,
      buffer,
    )
  }

  if (KnownChainId.isEVMChain(chain)) {
    return encodeZeroPrefixedHex(buffer)
  }

  checkNever(chain)
  throw new TypeError("[addressFromBuffer] Unsupported chain: " + chain)
}

export function addressToBuffer(
  chain: KnownChainId.KnownChain,
  address: string,
): Uint8Array {
  if (KnownChainId.isStacksChain(chain)) {
    const [version, hash160] = c32addressDecode(address)

    if (
      (chain === KnownChainId.Stacks.Mainnet &&
        version == c32addressVersions.mainnet.p2sh) ||
      (chain === KnownChainId.Stacks.Testnet &&
        version == c32addressVersions.testnet.p2sh)
    ) {
      throw new StacksAddressVersionNotSupportedError(address, "Multisig")
    } else if (
      (chain === KnownChainId.Stacks.Mainnet &&
        version !== c32addressVersions.mainnet.p2pkh) ||
      (chain === KnownChainId.Stacks.Testnet &&
        version !== c32addressVersions.testnet.p2pkh)
    ) {
      throw new StacksAddressVersionNotSupportedError(address, `${version}`)
    }

    return decodeHex(hash160)
  }

  if (KnownChainId.isBitcoinChain(chain)) {
    return addressToScriptPubKey(
      chain === KnownChainId.Bitcoin.Mainnet ? NETWORK : TEST_NETWORK,
      address,
    )
  }

  if (KnownChainId.isEVMChain(chain)) {
    return decodeHex(address)
  }

  checkNever(chain)
  throw new TypeError("[addressToBuffer] Unsupported chain: " + chain)
}
