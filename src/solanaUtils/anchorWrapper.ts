import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, web3, Idl } from "@coral-xyz/anchor";
import bridgeRegistryIdl from "./idl/bridge_registry.idl.json";
import bridgeEndpointIdl from "./idl/bridge_endpoint.idl.json";
import { BridgeRegistry } from "./idl/bridge_registry";
import { BridgeEndpoint } from "./idl/bridge_endpoint";
import { numberFromSolanaContractNumber } from "./contractHelpers";
import { BigNumber } from "../utils/BigNumber";

export interface TokenConfigAccount {
  feePct: BigNumber;
  minFee: BigNumber;
  minAmount: BigNumber;
  maxAmount: BigNumber;
}

export class AnchorWrapper {
  private registryProgram: Program<BridgeRegistry>;
  private endpointProgram: Program<BridgeEndpoint>;
  private provider: AnchorProvider;

  constructor(
    rpcEndpoint: string,
    registryProgramId: string,
    endpointProgramId: string
  ) {
    // Create a dummy wallet since we're only reading data
    const dummyWallet = {
      publicKey: PublicKey.default,
      signTransaction: () => Promise.reject(),
      signAllTransactions: () => Promise.reject(),
    };

    const connection = new Connection(rpcEndpoint);

    this.provider = new AnchorProvider(
      connection,
      dummyWallet,
      { commitment: "confirmed" }
    );

    // Initialize the registry program with the bridge registry IDL
    this.registryProgram = new Program<BridgeRegistry>(
      {
        ...bridgeRegistryIdl,
        address: registryProgramId,
      },
      this.provider
    );

    // Initialize the endpoint program with the bridge endpoint IDL
    this.endpointProgram = new Program<BridgeEndpoint>(
      {
        ...bridgeEndpointIdl,
        address: endpointProgramId,
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
      this.registryProgram.programId
    );

    try {
      const tokenConfigAccount = await this.registryProgram.account.tokenConfigAccount.fetch(tokenConfigPda);
      
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