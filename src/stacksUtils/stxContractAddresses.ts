import {
  STACKS_CONTRACT_DEPLOYER_MAINNET,
  STACKS_CONTRACT_DEPLOYER_TESTNET,
} from "../config"
import { KnownChainId, KnownTokenId } from "../utils/types.internal"

interface ContractInfo {
  contractAddress: string
  contractName: string
}

export const stxTokenContractAddresses: Partial<
  Record<string, Record<KnownChainId.StacksChain, ContractInfo>>
> = {
  [KnownTokenId.Stacks.ALEX]: {
    [KnownChainId.Stacks.Mainnet]: {
      contractAddress: STACKS_CONTRACT_DEPLOYER_MAINNET,
      contractName: "age000-governance-token",
    },
    [KnownChainId.Stacks.Testnet]: {
      contractAddress: STACKS_CONTRACT_DEPLOYER_TESTNET,
      contractName: "age000-governance-token",
    },
  },
  [KnownTokenId.Stacks.aBTC]: {
    [KnownChainId.Stacks.Mainnet]: {
      contractAddress: STACKS_CONTRACT_DEPLOYER_MAINNET,
      contractName: "token-abtc",
    },
    [KnownChainId.Stacks.Testnet]: {
      contractAddress: STACKS_CONTRACT_DEPLOYER_TESTNET,
      contractName: "token-abtc",
    },
  },
  [KnownTokenId.Stacks.sUSDT]: {
    [KnownChainId.Stacks.Mainnet]: {
      contractAddress: STACKS_CONTRACT_DEPLOYER_MAINNET,
      contractName: "token-susdt",
    },
    [KnownChainId.Stacks.Testnet]: {
      contractAddress: STACKS_CONTRACT_DEPLOYER_TESTNET,
      contractName: "token-susdt",
    },
  },
  [KnownTokenId.Stacks.sLUNR]: {
    [KnownChainId.Stacks.Mainnet]: {
      contractAddress: STACKS_CONTRACT_DEPLOYER_MAINNET,
      contractName: "token-slunr",
    },
    [KnownChainId.Stacks.Testnet]: {
      contractAddress: STACKS_CONTRACT_DEPLOYER_TESTNET,
      contractName: "token-slunr",
    },
  },
  [KnownTokenId.Stacks.sSKO]: {
    [KnownChainId.Stacks.Mainnet]: {
      contractAddress: STACKS_CONTRACT_DEPLOYER_MAINNET,
      contractName: "token-ssko",
    },
    [KnownChainId.Stacks.Testnet]: {
      contractAddress: STACKS_CONTRACT_DEPLOYER_TESTNET,
      contractName: "token-ssko",
    },
  },
}
