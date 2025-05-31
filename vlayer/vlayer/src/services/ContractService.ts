import {
  deployVlayerContracts,
  writeEnvVariables,
} from "@vlayer/sdk/config";

export class ContractService {
  private ethClient: any;
  private account: any;
  private chain: any;
  private confirmations: number;

  constructor(ethClient: any, account: any, chain: any, confirmations: number) {
    this.ethClient = ethClient;
    this.account = account;
    this.chain = chain;
    this.confirmations = confirmations;
  }

  async deployContracts(proverSpec: any, verifierSpec: any): Promise<{ prover: string; verifier: string }> {
    try {
      console.log("🚀 Deploying contracts...");
      
      const { prover, verifier } = await deployVlayerContracts({
        proverSpec,
        verifierSpec,
        proverArgs: [],
        verifierArgs: [],
      });

      await writeEnvVariables(".env", {
        VITE_PROVER_ADDRESS: prover,
        VITE_VERIFIER_ADDRESS: verifier,
      });

      console.log("✅ Contracts deployed successfully", { prover, verifier });
      return { prover, verifier };
    } catch (error) {
      console.error("❌ Contract deployment failed:", error);
      throw error;
    }
  }

  async verifyProof(verifierAddress: string, verifierAbi: any, proof: any, avgPrice: any): Promise<string> {
    try {
      console.log("🔍 Proof verify ediliyor...");

      // Gas estimation
      const gas = await this.ethClient.estimateContractGas({
        address: verifierAddress,
        abi: verifierAbi,
        functionName: "verify",
        args: [proof, avgPrice],
        account: this.account,
        blockTag: "pending",
      });

      console.log("⛽ Tahmini gas:", gas);

      // Transaction gönder
      const txHash = await this.ethClient.writeContract({
        address: verifierAddress,
        abi: verifierAbi,
        functionName: "verify",
        args: [proof, avgPrice],
        chain: this.chain,
        account: this.account,
        gas,
      });

      console.log("📤 Transaction gönderildi:");
      console.log("📋 TX Hash:", txHash);

      // Transaction'ın onaylanmasını bekle
      const receipt = await this.ethClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations: this.confirmations,
        retryCount: 60,
        retryDelay: 1000,
      });

      console.log("✅ Proof başarıyla verify edildi!");
      console.log("📋 Transaction Receipt:");
      console.log(receipt);
    

      return txHash;
    } catch (error) {
      console.error("❌ Proof verification failed:", error);
      throw error;
    }
  }
} 