import { createVlayerClient } from "@vlayer/sdk";

export class VlayerService {
  private vlayer: any;
  private notaryUrl: string;
  private config: any;
  private chain: any;

  constructor(config: any, proverUrl: string, notaryUrl: string, chain: any) {
    this.config = config;
    this.notaryUrl = notaryUrl;
    this.chain = chain;
    
    this.vlayer = createVlayerClient({
      url: proverUrl,
      token: config.token,
    });
  }

  async generateWebProof(url: string): Promise<string> {
    try {
      console.log("🔐 Generating web proof...");
      
      // Gerçek vlayer web-proof-fetch komutunu çalıştır
      const command = `vlayer web-proof-fetch --notary ${this.notaryUrl} --url ${url}`;
      console.log("🔧 Running command:", command);
      
      // Bun ile komutu çalıştır
      const proc = Bun.spawn({
        cmd: ["vlayer", "web-proof-fetch", "--notary", this.notaryUrl, "--url", url],
        stdout: "pipe",
        stderr: "pipe"
      });
      
      const output = await new Response(proc.stdout).text();
      const error = await new Response(proc.stderr).text();
      
      await proc.exited;
      
      if (error) {
        console.error("❌ Web proof command error:", error);
      }
      
      console.log("✅ Web proof generated successfully:", output);
      return output;
    } catch (error) {
      console.error("❌ Web proof generation failed:", error);
      throw error;
    }
  }

  async prove(proverAddress: string, proverAbi: any, webProof: string): Promise<{ proof: any; avgPrice: any }> {
    try {
      console.log("⚡ Proving...");
      
      const hash = await this.vlayer.prove({
        address: proverAddress,
        functionName: "main",
        proverAbi: proverAbi,
        args: [
          {
            webProofJson: webProof,
          },
        ],
        chainId: this.chain.id,
        gasLimit: this.config.gasLimit,
      });

      const result = await this.vlayer.waitForProvingResult({ hash });
      const [proof, avgPrice] = result;
      
      console.log("✅ Successfully proved");
      return { proof, avgPrice };
    } catch (error) {
      console.error("❌ Prove failed:", error);
      throw error;
    }
  }

  async verify(
    verifierAddress: string, 
    verifierAbi: any, 
    proof: any, 
    avgPrice: any,
    ethClient: any,
    account: any,
    confirmations: number
  ): Promise<string> {
    try {
      console.log("🔍 Verifying proof...");

      // Gas estimation
      const gas = await ethClient.estimateContractGas({
        address: verifierAddress,
        abi: verifierAbi,
        functionName: "verify",
        args: [proof, avgPrice],
        account: account,
        blockTag: "pending",
      });

      console.log("⛽ Estimated gas:", gas);

      // Transaction gönder
      const txHash = await ethClient.writeContract({
        address: verifierAddress,
        abi: verifierAbi,
        functionName: "verify",
        args: [proof, avgPrice],
        chain: this.chain,
        account: account,
        gas,
      });

      console.log("📤 Transaction sent:");
      console.log("📋 TX Hash:", txHash);

      // Transaction'ın onaylanmasını bekle
      const receipt = await ethClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations: confirmations,
        retryCount: 60,
        retryDelay: 1000,
      });

      console.log("✅ Proof verified successfully!");
      console.log("📋 Transaction Receipt:");
      console.log(receipt);
    
      return txHash;
    } catch (error) {
      console.error("❌ Proof verification failed:", error);
      throw error;
    }
  }
} 