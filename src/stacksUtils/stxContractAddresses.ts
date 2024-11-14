import { contractNameOverrides } from "../config"
import { KnownRoute_FromStacks_ToEVM } from "../utils/buildSupportedRoutes"
import { KnownChainId, KnownTokenId } from "../utils/types/knownIds"
import {
  isStacksContractAddressEqual,
  StacksContractAddress,
} from "../xlinkSdkUtils/types"

export const xlinkContractsDeployerMainnet =
  "SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK"
export const xlinkContractsDeployerTestnet =
  "ST2QXSK64YQX3CQPC530K79XWQ98XFAM9W3XKEH3N"

export const xlinkContractsMultisigMainnet =
  "SP673Z4BPB4R73359K9HE55F2X91V5BJTN5SXZ5T"
export const xlinkContractsMultisigTestnet =
  "ST2QXSK64YQX3CQPC530K79XWQ98XFAM9W3XKEH3N"

export const alexContractDeployerMainnet =
  "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM"
export const alexContractDeployerTestnet =
  "ST1J4G6RR643BCG8G8SR6M2D9Z9KXT2NJDRK3FBTK"

export const legacyAlexContractDeployerMainnet =
  "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9"
export const legacyAlexContractDeployerTestnet =
  "ST1J2JTYXGRMZYNKE40GM87ZCACSPSSEEQVSNB7DC"

const wrapContractAddress = (
  address: StacksContractAddress,
): StacksContractAddress => {
  const contractName =
    (contractNameOverrides as any)?.[address.contractName] ??
    address.contractName
  return {
    ...address,
    contractName,
  }
}

export const stxContractAddresses = {
  "btc-peg-in-endpoint-v2-05": {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress({
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: "btc-peg-in-endpoint-v2-05",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress({
      deployerAddress: xlinkContractsMultisigTestnet,
      contractName: "btc-peg-in-endpoint-v2-05",
    }),
  },
  "btc-peg-in-endpoint-v2-05-swap": {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress({
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: "btc-peg-in-endpoint-v2-05-swap",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress({
      deployerAddress: xlinkContractsMultisigTestnet,
      contractName: "btc-peg-in-endpoint-v2-05-swap",
    }),
  },
  "btc-peg-out-endpoint-v2-01": {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress({
      deployerAddress: xlinkContractsDeployerMainnet,
      contractName: "btc-peg-out-endpoint-v2-01",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress({
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "btc-peg-out-endpoint-v2-01",
    }),
  },
  "cross-peg-in-endpoint-v2-04": {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress({
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: "cross-peg-in-endpoint-v2-04",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress({
      deployerAddress: xlinkContractsMultisigTestnet,
      contractName: "cross-peg-in-endpoint-v2-04",
    }),
  },
  "cross-peg-in-endpoint-v2-04-swap": {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress({
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: "cross-peg-in-endpoint-v2-04-swap",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress({
      deployerAddress: xlinkContractsMultisigTestnet,
      contractName: "cross-peg-in-endpoint-v2-04-swap",
    }),
  },
  "cross-peg-out-endpoint-v2-01": {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress({
      deployerAddress: xlinkContractsDeployerMainnet,
      contractName: "cross-peg-out-endpoint-v2-01",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress({
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "cross-peg-out-endpoint-v2-01",
    }),
  },
  "meta-peg-in-endpoint-v2-04": {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress({
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: "meta-peg-in-endpoint-v2-04",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress({
      deployerAddress: xlinkContractsMultisigTestnet,
      contractName: "meta-peg-in-endpoint-v2-04",
    }),
  },
  "meta-peg-in-endpoint-v2-04-swap": {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress({
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: "meta-peg-in-endpoint-v2-04-swap",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress({
      deployerAddress: xlinkContractsMultisigTestnet,
      contractName: "meta-peg-in-endpoint-v2-04-swap",
    }),
  },
  "meta-peg-out-endpoint-v2-04": {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress({
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: "meta-peg-out-endpoint-v2-04",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress({
      deployerAddress: xlinkContractsMultisigTestnet,
      contractName: "meta-peg-out-endpoint-v2-04",
    }),
  },
} satisfies Record<
  string,
  Record<KnownChainId.StacksChain, StacksContractAddress>
>

export const stxTokenContractAddresses: Record<
  KnownTokenId.StacksToken,
  Record<KnownChainId.StacksChain, StacksContractAddress>
> = {
  [KnownTokenId.Stacks.ALEX]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress({
      deployerAddress: alexContractDeployerMainnet,
      contractName: "token-alex",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress({
      deployerAddress: alexContractDeployerTestnet,
      contractName: "token-alex",
    }),
  },
  [KnownTokenId.Stacks.aBTC]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress({
      deployerAddress: xlinkContractsDeployerMainnet,
      contractName: "token-abtc",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress({
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "token-abtc",
    }),
  },
  [KnownTokenId.Stacks.sUSDT]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress({
      deployerAddress: xlinkContractsDeployerMainnet,
      contractName: "token-susdt",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress({
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "token-susdt",
    }),
  },
  [KnownTokenId.Stacks.sLUNR]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress({
      deployerAddress: xlinkContractsDeployerMainnet,
      contractName: "token-slunr",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress({
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "token-slunr",
    }),
  },
  [KnownTokenId.Stacks.sSKO]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress({
      deployerAddress: xlinkContractsDeployerMainnet,
      contractName: "token-ssko",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress({
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "token-ssko",
    }),
  },
  [KnownTokenId.Stacks.vLiSTX]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress({
      deployerAddress: alexContractDeployerMainnet,
      contractName: "token-wvlqstx",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress({
      deployerAddress: alexContractDeployerTestnet,
      contractName: "token-wvlqstx",
    }),
  },
  [KnownTokenId.Stacks.vLiALEX]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress({
      deployerAddress: alexContractDeployerMainnet,
      contractName: "token-wvlialex",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress({
      deployerAddress: alexContractDeployerTestnet,
      contractName: "token-wvlialex",
    }),
  },
  [KnownTokenId.Stacks.vLiaBTC]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress({
      deployerAddress: alexContractDeployerMainnet,
      contractName: "token-wvliabtc",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress({
      deployerAddress: alexContractDeployerTestnet,
      contractName: "token-wvliabtc",
    }),
  },
  [KnownTokenId.Stacks.uBTC]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress({
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: "token-ubtc",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress({
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "token-ubtc",
    }),
  },
  [KnownTokenId.Stacks.DB20]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress({
      deployerAddress: legacyAlexContractDeployerMainnet,
      contractName: "brc20-db20",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress({
      deployerAddress: legacyAlexContractDeployerTestnet,
      contractName: "brc20-db20",
    }),
  },
  [KnownTokenId.Stacks.DOG]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress({
      deployerAddress: legacyAlexContractDeployerMainnet,
      contractName: "runes-dog",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress({
      deployerAddress: legacyAlexContractDeployerTestnet,
      contractName: "runes-dog",
    }),
  },
}

const terminatingStacksTokenContractAddresses = {
  wbtc: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress({
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: "token-wbtc",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress({
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "token-wbtc",
    }),
  },
  btcb: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress({
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: "token-wbtc",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress({
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "token-btcb",
    }),
  },
  cbBTC: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress({
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: "token-wbtc",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress({
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "token-wbtc",
    }),
  },
  usdt: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress({
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: "token-usdt",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress({
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "token-usdt",
    }),
  },
} satisfies Record<
  string,
  Record<KnownChainId.StacksChain, StacksContractAddress>
>
export const getTerminatingStacksTokenContractAddress = (
  route: KnownRoute_FromStacks_ToEVM,
): undefined | StacksContractAddress => {
  const { fromToken, toChain, toToken } = route
  if (fromToken === KnownTokenId.Stacks.aBTC) {
    if (
      (toChain === KnownChainId.EVM.Ethereum ||
        toChain === KnownChainId.EVM.Sepolia) &&
      toToken === KnownTokenId.EVM.WBTC
    ) {
      return terminatingStacksTokenContractAddresses.wbtc[route.fromChain]
    }
    if (
      (toChain === KnownChainId.EVM.BSC ||
        toChain === KnownChainId.EVM.BSCTestnet) &&
      toToken === KnownTokenId.EVM.BTCB
    ) {
      return terminatingStacksTokenContractAddresses.btcb[route.fromChain]
    }
    if (
      toChain === KnownChainId.EVM.Base &&
      toToken === KnownTokenId.EVM.cbBTC
    ) {
      return terminatingStacksTokenContractAddresses.cbBTC[route.fromChain]
    }
  }
  if (fromToken === KnownTokenId.Stacks.sUSDT) {
    if (toToken === KnownTokenId.EVM.USDT) {
      return terminatingStacksTokenContractAddresses.usdt[route.fromChain]
    }
  }
  return undefined
}
export const getEVMTokenIdFromTerminatingStacksTokenContractAddress = (route: {
  evmChain: KnownChainId.EVMChain
  stacksChain: KnownChainId.StacksChain
  stacksTokenAddress: StacksContractAddress
}): undefined | KnownTokenId.EVMToken => {
  if (
    (route.evmChain === KnownChainId.EVM.Ethereum ||
      route.evmChain === KnownChainId.EVM.Sepolia) &&
    isStacksContractAddressEqual(
      route.stacksTokenAddress,
      terminatingStacksTokenContractAddresses.wbtc[route.stacksChain],
    )
  ) {
    return KnownTokenId.EVM.WBTC
  }

  if (
    (route.evmChain === KnownChainId.EVM.BSC ||
      route.evmChain === KnownChainId.EVM.BSCTestnet) &&
    isStacksContractAddressEqual(
      route.stacksTokenAddress,
      terminatingStacksTokenContractAddresses.btcb[route.stacksChain],
    )
  ) {
    return KnownTokenId.EVM.BTCB
  }

  if (
    route.evmChain === KnownChainId.EVM.Base &&
    isStacksContractAddressEqual(
      route.stacksTokenAddress,
      terminatingStacksTokenContractAddresses.cbBTC[route.stacksChain],
    )
  ) {
    return KnownTokenId.EVM.cbBTC
  }

  if (
    isStacksContractAddressEqual(
      route.stacksTokenAddress,
      terminatingStacksTokenContractAddresses.usdt[route.stacksChain],
    )
  ) {
    return KnownTokenId.EVM.USDT
  }

  return undefined
}
