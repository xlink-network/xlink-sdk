import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, web3, Idl, Wallet } from "@coral-xyz/anchor";
import bridgeRegistryIdl from "./idl/bridge_registry.json";
import { BridgeRegistry } from "./idl/bridge_registry";

export class AnchorWrapper {
  private program: Program<BridgeRegistry>;
  private provider: AnchorProvider;

  constructor(
    connection: Connection,
    programId: string
  ) {
    // Create a dummy wallet since we're only reading data
    const dummyWallet = new web3.Keypair();
    
    this.provider = new AnchorProvider(
      connection,
      new Wallet(dummyWallet),
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
   * @returns The token config account data
   */
  async getTokenConfigAccount(mintAddress: PublicKey) {
    const [tokenConfigPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("token_config"),
        mintAddress.toBuffer(),
      ],
      this.program.programId
    );

    try {
      const tokenConfigAccount = await this.program.account.tokenConfigAccount.fetch(tokenConfigPda);
      return tokenConfigAccount;
    } catch (error) {
      throw new Error(`Failed to fetch token config account: ${error}`);
    }
  }
} 

if (require.main === module) {
  (async () => {
    const anchorWrapper = new AnchorWrapper(
      new Connection("https://api.devnet.solana.com"),
      "7ek62Vb634rwMhe44XC4FAs6Kff7MqrGx4XvSdsnDNoU"
    );

    const tokenConfigAccount = await anchorWrapper.getTokenConfigAccount(new PublicKey("8hS2fqr3Zk1LNJ3Q8iiQD49goH5zVkQZvmk4tW3HNXmo"));
    console.log(tokenConfigAccount);
  })();
}