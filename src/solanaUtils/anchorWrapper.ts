import './solanaLibraryBufferFix'
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, web3, Idl, BN } from "@coral-xyz/anchor";
import bridgeRegistryIdl from "./idl/bridge_registry.idl.json";
import bridgeEndpointIdl from "./idl/bridge_endpoint.idl.json";
import { BridgeRegistry } from "./idl/bridge_registry";
import { BridgeEndpoint } from "./idl/bridge_endpoint";
import { numberFromSolanaContractNumber } from "./contractHelpers";
import { BigNumber } from "../utils/BigNumber";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getMint } from "@solana/spl-token";
import { Buffer } from 'buffer'

export interface TokenConfigAccount {
  mint: PublicKey;
  feePct: BigNumber;
  minFee: BigNumber;
  minAmount: BigNumber;
  maxAmount: BigNumber;
}

export interface SendMessageWithTokenParams {
  mint: PublicKey;
  amount: number;
  payload: Uint8Array;
  sender: PublicKey;
  senderTokenAccount: PublicKey;
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
        Buffer.from("token_config"),
        mintAddress.toBuffer(),
      ],
      this.registryProgram.programId
    );

    try {
      const tokenConfigAccount = await this.registryProgram.account.tokenConfigAccount.fetch(tokenConfigPda);
      
      // Map BN values to BigNumber
      return {
        mint: tokenConfigAccount.tokenMint,
        feePct: numberFromSolanaContractNumber(tokenConfigAccount.feePct),
        minFee: numberFromSolanaContractNumber(tokenConfigAccount.minFee),
        minAmount: numberFromSolanaContractNumber(tokenConfigAccount.minAmount),
        maxAmount: numberFromSolanaContractNumber(tokenConfigAccount.maxAmount),
      };
    } catch (error) {
      throw new Error(`Failed to fetch token config account: ${error}`);
    }
  }

  /**
   * Creates a transaction for sending a message with token transfer/burn
   * @param params Parameters for the send message with token transaction
   * @returns The transaction object (not broadcast)
   */
  async createSendMessageWithTokenTx(params: SendMessageWithTokenParams): Promise<web3.Transaction> {
    const {
      mint,
      amount,
      payload,
      sender,
      senderTokenAccount,
    } = params;

    const mintInfo = await getMint(this.provider.connection, mint);

    // Check if mint authority exists and equals the bridge registry PDA

    // Get the bridge endpoint PDA
    const [bridgeEndpointPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("bridge_endpoint")],
      this.endpointProgram.programId
    );
    const isBurnable = mintInfo.mintAuthority?.equals(bridgeEndpointPda) ?? false;

    // Get the peg-in ATA
    const bridgeEndpoint = await this.endpointProgram.account.bridgeEndpoint.fetch(bridgeEndpointPda);

    // Create the instruction
    const ix = await this.endpointProgram.methods
      .sendMessageWithToken(
        new BN(amount),
        Buffer.from(payload)
      )
      .accounts({
        sender: sender,
        mint: mint,
        senderTokenAccount: senderTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        bridgeRegistryProgram: this.registryProgram.programId,
        pegInAddress: isBurnable ? bridgeEndpoint.pegInAddress : null,
     })
      .instruction();

    // Create and return the transaction
    const tx = new web3.Transaction().add(ix);
    return tx;
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