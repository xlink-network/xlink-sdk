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

const stxAlternativeTokenContractAddresses = {
  wbtc: {
    [KnownChainId.Stacks.Mainnet]: {
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: "token-wbtc",
    },
    [KnownChainId.Stacks.Testnet]: {
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "token-wbtc",
    },
  },
  btcb: {
    [KnownChainId.Stacks.Mainnet]: {
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: "token-wbtc",
    },
    [KnownChainId.Stacks.Testnet]: {
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "token-btcb",
    },
  },
  cbBTC: {
    [KnownChainId.Stacks.Mainnet]: {
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: "token-wbtc",
    },
    [KnownChainId.Stacks.Testnet]: {
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "token-wbtc",
    },
  },
  usdt: {
    [KnownChainId.Stacks.Mainnet]: {
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: "token-usdt",
    },
    [KnownChainId.Stacks.Testnet]: {
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "token-usdt",
    },
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
      return stxAlternativeTokenContractAddresses.wbtc[route.fromChain]
    }
    if (
      (toChain === KnownChainId.EVM.BSC ||
        toChain === KnownChainId.EVM.BSCTestnet) &&
      toToken === KnownTokenId.EVM.BTCB
    ) {
      return stxAlternativeTokenContractAddresses.btcb[route.fromChain]
    }
    if (
      toChain === KnownChainId.EVM.Base &&
      toToken === KnownTokenId.EVM.cbBTC
    ) {
      return stxAlternativeTokenContractAddresses.cbBTC[route.fromChain]
    }
  }
  if (fromToken === KnownTokenId.Stacks.sUSDT) {
    if (toToken === KnownTokenId.EVM.USDT) {
      return stxAlternativeTokenContractAddresses.usdt[route.fromChain]
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
      stxAlternativeTokenContractAddresses.wbtc[route.stacksChain],
    )
  ) {
    return KnownTokenId.EVM.WBTC
  }

  if (
    (route.evmChain === KnownChainId.EVM.BSC ||
      route.evmChain === KnownChainId.EVM.BSCTestnet) &&
    isStacksContractAddressEqual(
      route.stacksTokenAddress,
      stxAlternativeTokenContractAddresses.btcb[route.stacksChain],
    )
  ) {
    return KnownTokenId.EVM.BTCB
  }

  if (
    route.evmChain === KnownChainId.EVM.Base &&
    isStacksContractAddressEqual(
      route.stacksTokenAddress,
      stxAlternativeTokenContractAddresses.cbBTC[route.stacksChain],
    )
  ) {
    return KnownTokenId.EVM.cbBTC
  }

  if (
    isStacksContractAddressEqual(
      route.stacksTokenAddress,
      stxAlternativeTokenContractAddresses.usdt[route.stacksChain],
    )
  ) {
    return KnownTokenId.EVM.USDT
  }

  return undefined
}

export const stxContractDeployers = {
  "btc-peg-in-endpoint-v2-05": {
    [KnownChainId.Stacks.Mainnet]: {
      deployerAddress: xlinkContractsMultisigMainnet,
    },
    [KnownChainId.Stacks.Testnet]: {
      deployerAddress: xlinkContractsMultisigTestnet,
    },
  },
  "btc-peg-out-endpoint-v2-01": {
    [KnownChainId.Stacks.Mainnet]: {
      deployerAddress: xlinkContractsDeployerMainnet,
    },
    [KnownChainId.Stacks.Testnet]: {
      deployerAddress: xlinkContractsDeployerTestnet,
    },
  },
  "cross-peg-in-endpoint-v2-04": {
    [KnownChainId.Stacks.Mainnet]: {
      deployerAddress: xlinkContractsMultisigMainnet,
    },
    [KnownChainId.Stacks.Testnet]: {
      deployerAddress: xlinkContractsMultisigTestnet,
    },
  },
  "cross-peg-out-endpoint-v2-01": {
    [KnownChainId.Stacks.Mainnet]: {
      deployerAddress: xlinkContractsDeployerMainnet,
    },
    [KnownChainId.Stacks.Testnet]: {
      deployerAddress: xlinkContractsDeployerTestnet,
    },
  },
  "meta-peg-in-endpoint-v2-04": {
    [KnownChainId.Stacks.Mainnet]: {
      deployerAddress: xlinkContractsMultisigMainnet,
    },
    [KnownChainId.Stacks.Testnet]: {
      deployerAddress: xlinkContractsMultisigTestnet,
    },
  },
  "meta-peg-out-endpoint-v2-04": {
    [KnownChainId.Stacks.Mainnet]: {
      deployerAddress: xlinkContractsMultisigMainnet,
    },
    [KnownChainId.Stacks.Testnet]: {
      deployerAddress: xlinkContractsMultisigTestnet,
    },
  },
} satisfies Record<
  string,
  Record<KnownChainId.StacksChain, { deployerAddress: string }>
>

export const stxTokenContractAddresses: Record<
  KnownTokenId.StacksToken,
  Record<KnownChainId.StacksChain, StacksContractAddress>
> = {
  [KnownTokenId.Stacks.ALEX]: {
    [KnownChainId.Stacks.Mainnet]: {
      deployerAddress: alexContractDeployerMainnet,
      contractName: "token-alex",
    },
    [KnownChainId.Stacks.Testnet]: {
      deployerAddress: alexContractDeployerTestnet,
      contractName: "token-alex",
    },
  },
  [KnownTokenId.Stacks.aBTC]: {
    [KnownChainId.Stacks.Mainnet]: {
      deployerAddress: xlinkContractsDeployerMainnet,
      contractName: "token-abtc",
    },
    [KnownChainId.Stacks.Testnet]: {
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "token-abtc",
    },
  },
  [KnownTokenId.Stacks.sUSDT]: {
    [KnownChainId.Stacks.Mainnet]: {
      deployerAddress: xlinkContractsDeployerMainnet,
      contractName: "token-susdt",
    },
    [KnownChainId.Stacks.Testnet]: {
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "token-susdt",
    },
  },
  [KnownTokenId.Stacks.sLUNR]: {
    [KnownChainId.Stacks.Mainnet]: {
      deployerAddress: xlinkContractsDeployerMainnet,
      contractName: "token-slunr",
    },
    [KnownChainId.Stacks.Testnet]: {
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "token-slunr",
    },
  },
  [KnownTokenId.Stacks.sSKO]: {
    [KnownChainId.Stacks.Mainnet]: {
      deployerAddress: xlinkContractsDeployerMainnet,
      contractName: "token-ssko",
    },
    [KnownChainId.Stacks.Testnet]: {
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "token-ssko",
    },
  },
  [KnownTokenId.Stacks.vLiSTX]: {
    [KnownChainId.Stacks.Mainnet]: {
      deployerAddress: alexContractDeployerMainnet,
      contractName: "token-wvlqstx",
    },
    [KnownChainId.Stacks.Testnet]: {
      deployerAddress: alexContractDeployerTestnet,
      contractName: "token-wvlqstx",
    },
  },
  [KnownTokenId.Stacks.vLiALEX]: {
    [KnownChainId.Stacks.Mainnet]: {
      deployerAddress: alexContractDeployerMainnet,
      contractName: "token-wvlialex",
    },
    [KnownChainId.Stacks.Testnet]: {
      deployerAddress: alexContractDeployerTestnet,
      contractName: "token-wvlialex",
    },
  },
  [KnownTokenId.Stacks.uBTC]: {
    [KnownChainId.Stacks.Mainnet]: {
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: "token-ubtc",
    },
    [KnownChainId.Stacks.Testnet]: {
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "token-ubtc",
    },
  },
  [KnownTokenId.Stacks.DB20]: {
    [KnownChainId.Stacks.Mainnet]: {
      deployerAddress: legacyAlexContractDeployerMainnet,
      contractName: "brc20-db20",
    },
    [KnownChainId.Stacks.Testnet]: {
      deployerAddress: legacyAlexContractDeployerTestnet,
      contractName: "brc20-db20",
    },
  },
  [KnownTokenId.Stacks.DOG]: {
    [KnownChainId.Stacks.Mainnet]: {
      deployerAddress: legacyAlexContractDeployerMainnet,
      contractName: "runes-dog",
    },
    [KnownChainId.Stacks.Testnet]: {
      deployerAddress: legacyAlexContractDeployerTestnet,
      contractName: "runes-dog",
    },
  },
}
