import {
  contractNameOverrides_mainnet,
  contractNameOverrides_testnet,
} from "../config"
import { KnownRoute_FromStacks_ToEVM } from "../utils/buildSupportedRoutes"
import { assertExclude, checkNever } from "../utils/typeHelpers"
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

export const alexContractMultisigMainnet =
  "SP1E0XBN9T4B10E9QMR7XMFJPMA19D77WY3KP2QKC"
export const alexContractMultisigTestnet =
  "ST1J4G6RR643BCG8G8SR6M2D9Z9KXT2NJDRK3FBTK"

export const legacyAlexContractDeployerMainnet =
  "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9"
export const legacyAlexContractDeployerTestnet =
  "ST1J2JTYXGRMZYNKE40GM87ZCACSPSSEEQVSNB7DC"

const wrapContractAddress = (
  network: "mainnet" | "testnet",
  address: StacksContractAddress,
): StacksContractAddress => {
  const contractNameOverrides =
    network === "mainnet"
      ? contractNameOverrides_mainnet
      : contractNameOverrides_testnet
  const contractName =
    (contractNameOverrides as any)?.[address.contractName] ??
    address.contractName
  return {
    ...address,
    contractName,
  }
}

export enum StacksContractName {
  BTCPegInEndpoint = "btc-peg-in-endpoint-v2-05",
  BTCPegInEndpointSwap = "btc-peg-in-endpoint-v2-07-swap",
  BTCPegInEndpointLaunchpad = "btc-peg-in-endpoint-v2-05-launchpad",
  BTCPegOutEndpoint = "btc-peg-out-endpoint-v2-01",
  MetaPegInEndpoint = "meta-peg-in-endpoint-v2-04",
  MetaPegInEndpointSwap = "meta-peg-in-endpoint-v2-06-swap",
  MetaPegOutEndpoint = "meta-peg-out-endpoint-v2-04",
  EVMPegInEndpoint = "cross-peg-in-endpoint-v2-04",
  EVMPegOutEndpoint = "cross-peg-out-endpoint-v2-01",
}

export const stxContractAddresses = {
  [StacksContractName.BTCPegInEndpoint]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress("mainnet", {
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: StacksContractName.BTCPegInEndpoint,
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress("testnet", {
      deployerAddress: xlinkContractsMultisigTestnet,
      contractName: StacksContractName.BTCPegInEndpoint,
    }),
  },
  [StacksContractName.BTCPegInEndpointSwap]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress("mainnet", {
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: StacksContractName.BTCPegInEndpointSwap,
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress("testnet", {
      deployerAddress: xlinkContractsMultisigTestnet,
      contractName: StacksContractName.BTCPegInEndpointSwap,
    }),
  },
  [StacksContractName.BTCPegInEndpointLaunchpad]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress("mainnet", {
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: StacksContractName.BTCPegInEndpointLaunchpad,
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress("testnet", {
      deployerAddress: xlinkContractsMultisigTestnet,
      contractName: StacksContractName.BTCPegInEndpointLaunchpad,
    }),
  },
  [StacksContractName.BTCPegOutEndpoint]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress("mainnet", {
      deployerAddress: xlinkContractsDeployerMainnet,
      contractName: StacksContractName.BTCPegOutEndpoint,
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress("testnet", {
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: StacksContractName.BTCPegOutEndpoint,
    }),
  },
  [StacksContractName.EVMPegInEndpoint]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress("mainnet", {
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: StacksContractName.EVMPegInEndpoint,
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress("testnet", {
      deployerAddress: xlinkContractsMultisigTestnet,
      contractName: StacksContractName.EVMPegInEndpoint,
    }),
  },
  [StacksContractName.EVMPegOutEndpoint]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress("mainnet", {
      deployerAddress: xlinkContractsDeployerMainnet,
      contractName: StacksContractName.EVMPegOutEndpoint,
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress("testnet", {
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: StacksContractName.EVMPegOutEndpoint,
    }),
  },
  [StacksContractName.MetaPegInEndpoint]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress("mainnet", {
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: StacksContractName.MetaPegInEndpoint,
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress("testnet", {
      deployerAddress: xlinkContractsMultisigTestnet,
      contractName: StacksContractName.MetaPegInEndpoint,
    }),
  },
  [StacksContractName.MetaPegInEndpointSwap]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress("mainnet", {
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: StacksContractName.MetaPegInEndpointSwap,
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress("testnet", {
      deployerAddress: xlinkContractsMultisigTestnet,
      contractName: StacksContractName.MetaPegInEndpointSwap,
    }),
  },
  [StacksContractName.MetaPegOutEndpoint]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress("mainnet", {
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: StacksContractName.MetaPegOutEndpoint,
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress("testnet", {
      deployerAddress: xlinkContractsMultisigTestnet,
      contractName: StacksContractName.MetaPegOutEndpoint,
    }),
  },
} satisfies Record<
  StacksContractName,
  Record<KnownChainId.StacksChain, StacksContractAddress>
>

/**
 * @deprecated
 *
 * use `getStacksTokenContractInfo` instead
 */
export const stxTokenContractAddresses: Record<
  string,
  Record<KnownChainId.StacksChain, StacksContractAddress>
> = {
  [KnownTokenId.Stacks.ALEX]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress("mainnet", {
      deployerAddress: alexContractDeployerMainnet,
      contractName: "token-alex",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress("testnet", {
      deployerAddress: alexContractDeployerTestnet,
      contractName: "token-alex",
    }),
  },
  [KnownTokenId.Stacks.aBTC]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress("mainnet", {
      deployerAddress: xlinkContractsDeployerMainnet,
      contractName: "token-abtc",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress("testnet", {
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "token-abtc",
    }),
  },
  [KnownTokenId.Stacks.sUSDT]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress("mainnet", {
      deployerAddress: xlinkContractsDeployerMainnet,
      contractName: "token-susdt",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress("testnet", {
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "token-susdt",
    }),
  },
  [KnownTokenId.Stacks.sLUNR]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress("mainnet", {
      deployerAddress: xlinkContractsDeployerMainnet,
      contractName: "token-slunr",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress("testnet", {
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "token-slunr",
    }),
  },
  [KnownTokenId.Stacks.sSKO]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress("mainnet", {
      deployerAddress: xlinkContractsDeployerMainnet,
      contractName: "token-ssko",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress("testnet", {
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "token-ssko",
    }),
  },
  [KnownTokenId.Stacks.vLiSTX]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress("mainnet", {
      deployerAddress: alexContractDeployerMainnet,
      contractName: "token-wvlqstx",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress("testnet", {
      deployerAddress: alexContractDeployerTestnet,
      contractName: "token-wvlqstx",
    }),
  },
  [KnownTokenId.Stacks.vLiALEX]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress("mainnet", {
      deployerAddress: alexContractDeployerMainnet,
      contractName: "token-wvlialex",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress("testnet", {
      deployerAddress: alexContractDeployerTestnet,
      contractName: "token-wvlialex",
    }),
  },
  [KnownTokenId.Stacks.vLiaBTC]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress("mainnet", {
      deployerAddress: alexContractMultisigMainnet,
      contractName: "token-wvliabtc",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress("testnet", {
      deployerAddress: alexContractDeployerTestnet,
      contractName: "token-wvliabtc",
    }),
  },
  [KnownTokenId.Stacks.uBTC]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress("mainnet", {
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: "token-ubtc",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress("testnet", {
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "token-ubtc",
    }),
  },
  [KnownTokenId.Stacks.DB20]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress("mainnet", {
      deployerAddress: legacyAlexContractDeployerMainnet,
      contractName: "brc20-db20",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress("testnet", {
      deployerAddress: legacyAlexContractDeployerTestnet,
      contractName: "brc20-db20",
    }),
  },
  [KnownTokenId.Stacks.DOG]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress("mainnet", {
      deployerAddress: legacyAlexContractDeployerMainnet,
      contractName: "runes-dog",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress("testnet", {
      deployerAddress: legacyAlexContractDeployerTestnet,
      contractName: "runes-dog",
    }),
  },
  [KnownTokenId.Stacks.STX]: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress("mainnet", {
      deployerAddress: alexContractDeployerMainnet,
      contractName: "token-wstx-v2",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress("testnet", {
      deployerAddress: alexContractDeployerTestnet,
      contractName: "token-wstx-v2",
    }),
  },
}

const terminatingStacksTokenContractAddresses = {
  wbtc: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress("mainnet", {
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: "token-wbtc",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress("testnet", {
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "token-wbtc",
    }),
  },
  btcb: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress("mainnet", {
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: "token-wbtc",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress("testnet", {
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "token-btcb",
    }),
  },
  cbBTC: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress("mainnet", {
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: "token-wbtc",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress("testnet", {
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "token-wbtc",
    }),
  },
  usdt: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress("mainnet", {
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: "token-usdt",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress("testnet", {
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "token-usdt",
    }),
  },
  usdc: {
    [KnownChainId.Stacks.Mainnet]: wrapContractAddress("mainnet", {
      deployerAddress: xlinkContractsMultisigMainnet,
      contractName: "token-usdt",
    }),
    [KnownChainId.Stacks.Testnet]: wrapContractAddress("testnet", {
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
    const restChains = assertExclude.i<ChainsHaveAlternativeBTC>()

    if (
      (toChain === KnownChainId.EVM.Ethereum ||
        toChain === KnownChainId.EVM.Sepolia) &&
      toToken === KnownTokenId.EVM.WBTC
    ) {
      return terminatingStacksTokenContractAddresses.wbtc[route.fromChain]
    }
    assertExclude(restChains, KnownChainId.EVM.Ethereum)
    assertExclude(restChains, KnownChainId.EVM.Sepolia)

    if (
      (toChain === KnownChainId.EVM.BSC ||
        toChain === KnownChainId.EVM.BSCTestnet) &&
      toToken === KnownTokenId.EVM.BTCB
    ) {
      return terminatingStacksTokenContractAddresses.btcb[route.fromChain]
    }
    assertExclude(restChains, KnownChainId.EVM.BSC)
    assertExclude(restChains, KnownChainId.EVM.BSCTestnet)

    if (
      toChain === KnownChainId.EVM.Base &&
      toToken === KnownTokenId.EVM.cbBTC
    ) {
      return terminatingStacksTokenContractAddresses.cbBTC[route.fromChain]
    }
    assertExclude(restChains, KnownChainId.EVM.Base)

    checkNever(restChains)
  }

  if (fromToken === KnownTokenId.Stacks.sUSDT) {
    const restChains = assertExclude.i<ChainsHaveAlternativeStableUSD>()

    if (
      (toChain === KnownChainId.EVM.Ethereum ||
        toChain === KnownChainId.EVM.Sepolia ||
        toChain === KnownChainId.EVM.BSC ||
        toChain === KnownChainId.EVM.BSCTestnet) &&
      toToken === KnownTokenId.EVM.USDT
    ) {
      return terminatingStacksTokenContractAddresses.usdt[route.fromChain]
    }
    assertExclude(restChains, KnownChainId.EVM.Ethereum)
    assertExclude(restChains, KnownChainId.EVM.Sepolia)
    assertExclude(restChains, KnownChainId.EVM.BSC)
    assertExclude(restChains, KnownChainId.EVM.BSCTestnet)

    if (
      toChain === KnownChainId.EVM.Base &&
      toToken === KnownTokenId.EVM.USDC
    ) {
      return terminatingStacksTokenContractAddresses.usdc[route.fromChain]
    }
    assertExclude(restChains, KnownChainId.EVM.Base)

    checkNever(restChains)
  }
  return undefined
}
export const getEVMTokenIdFromTerminatingStacksTokenContractAddress = (route: {
  evmChain: KnownChainId.EVMChain
  stacksChain: KnownChainId.StacksChain
  stacksTokenAddress: StacksContractAddress
}): undefined | KnownTokenId.EVMToken => {
  const restStableUSDChains = assertExclude.i<ChainsHaveAlternativeStableUSD>()
  const restBTCChains = assertExclude.i<ChainsHaveAlternativeBTC>()

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
  assertExclude(restBTCChains, KnownChainId.EVM.Ethereum)
  assertExclude(restBTCChains, KnownChainId.EVM.Sepolia)

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
  assertExclude(restBTCChains, KnownChainId.EVM.BSC)
  assertExclude(restBTCChains, KnownChainId.EVM.BSCTestnet)

  if (
    route.evmChain === KnownChainId.EVM.Base &&
    isStacksContractAddressEqual(
      route.stacksTokenAddress,
      terminatingStacksTokenContractAddresses.cbBTC[route.stacksChain],
    )
  ) {
    return KnownTokenId.EVM.cbBTC
  }
  assertExclude(restBTCChains, KnownChainId.EVM.Base)

  if (
    (route.evmChain === KnownChainId.EVM.Ethereum ||
      route.evmChain === KnownChainId.EVM.Sepolia ||
      route.evmChain === KnownChainId.EVM.BSC ||
      route.evmChain === KnownChainId.EVM.BSCTestnet) &&
    isStacksContractAddressEqual(
      route.stacksTokenAddress,
      terminatingStacksTokenContractAddresses.usdt[route.stacksChain],
    )
  ) {
    return KnownTokenId.EVM.USDT
  }
  assertExclude(restStableUSDChains, KnownChainId.EVM.Ethereum)
  assertExclude(restStableUSDChains, KnownChainId.EVM.Sepolia)
  assertExclude(restStableUSDChains, KnownChainId.EVM.BSC)
  assertExclude(restStableUSDChains, KnownChainId.EVM.BSCTestnet)

  if (
    route.evmChain === KnownChainId.EVM.Base &&
    isStacksContractAddressEqual(
      route.stacksTokenAddress,
      terminatingStacksTokenContractAddresses.usdc[route.stacksChain],
    )
  ) {
    return KnownTokenId.EVM.USDC
  }
  assertExclude(restStableUSDChains, KnownChainId.EVM.Base)

  checkNever(restStableUSDChains)
  checkNever(restBTCChains)
  return undefined
}
type ChainsHaveAlternativeStableUSD =
  | typeof KnownChainId.EVM.Ethereum
  | typeof KnownChainId.EVM.Sepolia
  | typeof KnownChainId.EVM.BSC
  | typeof KnownChainId.EVM.BSCTestnet
  | typeof KnownChainId.EVM.Base
type ChainsHaveAlternativeBTC =
  | typeof KnownChainId.EVM.Ethereum
  | typeof KnownChainId.EVM.Sepolia
  | typeof KnownChainId.EVM.BSC
  | typeof KnownChainId.EVM.BSCTestnet
  | typeof KnownChainId.EVM.Base
