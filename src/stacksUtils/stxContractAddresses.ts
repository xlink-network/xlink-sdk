import {
  STACKS_CONTRACT_DEPLOYER_MAINNET,
  STACKS_CONTRACT_DEPLOYER_TESTNET,
} from "../config"
import { KnownChainId, KnownTokenId } from "../utils/knownIds"
import { StacksContractAddress } from "../xlinkSdkUtils/types"

const xlinkContractsDeployerMainnet = STACKS_CONTRACT_DEPLOYER_MAINNET
const xlinkContractsDeployerTestnet = STACKS_CONTRACT_DEPLOYER_TESTNET

const alexContractDeployerMainnet = "SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM"
const alexContractDeployerTestnet = "ST1J4G6RR643BCG8G8SR6M2D9Z9KXT2NJDRK3FBTK"

export const stxTokenContractAddresses: Partial<
  Record<
    KnownTokenId.StacksToken,
    Record<KnownChainId.StacksChain, StacksContractAddress>
  >
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
}
