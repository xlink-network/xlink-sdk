import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, web3, Idl } from "@coral-xyz/anchor";
import bridgeRegistryIdl from "./idl/bridge_registry.idl.json";
import { BridgeRegistry } from "./idl/bridge_registry";
import { numberFromSolanaContractNumber } from "./contractHelpers";
import { BigNumber } from "../utils/BigNumber";

export interface TokenConfigAccount {
  feePct: BigNumber;
  minFee: BigNumber;
  minAmount: BigNumber;
  maxAmount: BigNumber;
}

export class AnchorWrapper {
  private program: Program<BridgeRegistry>;
  private provider: AnchorProvider;

  constructor(
    connection: Connection,
    programId: string
  ) {
    // Create a dummy wallet since we're only reading data
    const dummyWallet = {
      publicKey: PublicKey.default,
      signTransaction: () => Promise.reject(),
      signAllTransactions: () => Promise.reject(),
    };

    this.provider = new AnchorProvider(
      connection,
      dummyWallet,
      { commitment: "confirmed" }
    );

    // Initialize the program with the bridge registry IDL
    this.program = new Program<BridgeRegistry>(
      {
        ...bridgeRegistryIdl,
        address: programId,
      },
      this.provider
    );
  }

  /**
   * Get the token config account for a specific token mint
   * @param mintAddress The mint address of the token
   * @returns The token config account data with BigNumber values
   */
  async getTokenConfigAccount(mintAddress: PublicKey): Promise<TokenConfigAccount> {
    const [tokenConfigPda] = PublicKey.findProgramAddressSync(
      [
        new TextEncoder().encode("token_config"),
        mintAddress.toBuffer(),
      ],
      this.program.programId
    );

    try {
      const tokenConfigAccount = await this.program.account.tokenConfigAccount.fetch(tokenConfigPda);
      
      // Map BN values to BigNumber
      return {
        feePct: numberFromSolanaContractNumber(tokenConfigAccount.feePct),
        minFee: numberFromSolanaContractNumber(tokenConfigAccount.minFee),
        minAmount: numberFromSolanaContractNumber(tokenConfigAccount.minAmount),
        maxAmount: numberFromSolanaContractNumber(tokenConfigAccount.maxAmount),
      };
    } catch (error) {
      throw new Error(`Failed to fetch token config account: ${error}`);
    }
  }
} 

// if (require.main === module) {
//   (async () => {
//     const anchorWrapper = new AnchorWrapper(
//       new Connection("https://api.devnet.solana.com"),
//       "7ek62Vb634rwMhe44XC4FAs6Kff7MqrGx4XvSdsnDNoU"
//     );

//     const tokenConfigAccount = await anchorWrapper.getTokenConfigAccount(new PublicKey("8hS2fqr3Zk1LNJ3Q8iiQD49goH5zVkQZvmk4tW3HNXmo"));
//     console.log(tokenConfigAccount);
//   })();
// }