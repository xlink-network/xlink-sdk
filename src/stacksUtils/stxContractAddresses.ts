import { KnownChainId, KnownTokenId } from "../utils/types/knownIds"
import { StacksContractAddress } from "../xlinkSdkUtils/types"

export const xlinkContractsDeployerMainnet =
  "SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK"
export const xlinkContractsDeployerTestnet =
  "ST2QXSK64YQX3CQPC530K79XWQ98XFAM9W3XKEH3N"

export const alexContractDeployerMainnet =
  "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM"
export const alexContractDeployerTestnet =
  "ST1J4G6RR643BCG8G8SR6M2D9Z9KXT2NJDRK3FBTK"

export const legacyAlexContractDeployerMainnet =
  "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9"
export const legacyAlexContractDeployerTestnet =
  "ST1J2JTYXGRMZYNKE40GM87ZCACSPSSEEQVSNB7DC"

export const stxAlternativeTokenContractAddresses = {
  wbtc: {
    [KnownChainId.Stacks.Mainnet]: {
      deployerAddress: "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9",
      contractName: "token-wbtc",
    },
    [KnownChainId.Stacks.Testnet]: {
      deployerAddress: "ST1J2JTYXGRMZYNKE40GM87ZCACSPSSEEQVSNB7DC",
      contractName: "token-wbtc",
    },
  },
  btcb: {
    [KnownChainId.Stacks.Mainnet]: {
      deployerAddress: "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9",
      contractName: "token-btcb",
    },
    [KnownChainId.Stacks.Testnet]: {
      deployerAddress: "ST1J2JTYXGRMZYNKE40GM87ZCACSPSSEEQVSNB7DC",
      contractName: "token-btcb",
    },
  },
}
export const getStacksAlternativeFromTokenContractAddress = (
  fromStacksChain: KnownChainId.StacksChain,
  fromStacksToken: KnownTokenId.StacksToken,
  toEVMChain: KnownChainId.EVMChain,
  toEVMToken: KnownTokenId.EVMToken,
): undefined | StacksContractAddress => {
  if (fromStacksToken === KnownTokenId.Stacks.aBTC) {
    if (toEVMToken === KnownTokenId.EVM.WBTC) {
      return stxAlternativeTokenContractAddresses.wbtc[fromStacksChain]
    }
    if (toEVMToken === KnownTokenId.EVM.BTCB) {
      return stxAlternativeTokenContractAddresses.btcb[fromStacksChain]
    }
  }
  return undefined
}

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
      deployerAddress: "SP673Z4BPB4R73359K9HE55F2X91V5BJTN5SXZ5T",
      contractName: "token-ubtc",
    },
    [KnownChainId.Stacks.Testnet]: {
      deployerAddress: xlinkContractsDeployerTestnet,
      contractName: "token-ubtc",
    },
  },
}
