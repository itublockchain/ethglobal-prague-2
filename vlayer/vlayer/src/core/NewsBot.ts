import { TelegramService } from "../services/TelegramService";
import { VlayerService } from "../services/VlayerService";
import { ContractService } from "../services/ContractService";
import axios from "axios";

export class NewsBot {
  private telegramService: TelegramService;
  private vlayerService: VlayerService;
  private contractService: ContractService;

  private proverAddress: string = "";
  private verifierAddress: string = "";
  private proverSpec: any;
  private verifierSpec: any;

  private isInitialized: boolean = false;
  private isRunning: boolean = false;

  private ethClient: any;
  private account: any;
  private confirmations: number;

  constructor(
    config: any,
    ethClient: any,
    account: any,
    chain: any,
    proverUrl: string,
    notaryUrl: string,
    confirmations: number,
    proverSpec: any,
    verifierSpec: any,
    botToken: string
  ) {
    this.telegramService = new TelegramService(botToken);
    this.vlayerService = new VlayerService(config, proverUrl, notaryUrl, chain);
    this.contractService = new ContractService(
      ethClient,
      account,
      chain,
      confirmations
    );

    this.ethClient = ethClient;
    this.account = account;
    this.confirmations = confirmations;

    this.proverSpec = proverSpec;
    this.verifierSpec = verifierSpec;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log("⚠️ Bot is already initialized");
      return;
    }

    try {
      console.log("🎯 STARTING NEWS BOT BACKEND...");
      console.log("=".repeat(60));

      // 1. Kontratları deploy et
      const { prover, verifier } = await this.contractService.deployContracts(
        this.proverSpec,
        this.verifierSpec
      );

      this.proverAddress = prover;
      this.verifierAddress = verifier;

      console.log("=".repeat(60));
      console.log(
        "✅ Initialization completed! Switching to long polling mode..."
      );

      this.isInitialized = true;
    } catch (error) {
      console.error("💥 Error during initialization:", error);
      throw error;
    }
  }

  async startLongPollingOperation(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error("Bot must be initialized first!");
    }

    if (this.isRunning) {
      console.log("⚠️ Bot is already running!");
      return;
    }

    console.log(
      "📡 Automatic processing will start for each new message from Telegram"
    );

    this.isRunning = true;

    // Long polling başlat - yeni mesaj geldiğinde callback çalışacak
    await this.telegramService.startLongPolling(
      async (updates) => {
        await this.handleNewMessages(updates);
      },
      30 // 30 saniye timeout
    );
  }

  // Yeni mesajlar geldiğinde çalışacak handler
  private async handleNewMessages(updates: any): Promise<void> {
    const cycleStart = Date.now();
    console.log("\n" + "=".repeat(50));
    console.log(
      `⚡ NEW MESSAGE(S) RECEIVED! (${new Date().toLocaleTimeString()})`
    );
    console.log(`📊 ${updates.result.length} updates will be processed`);

    try {
      // 1. Önce mevcut getUpdates metodunu çağır (istediğiniz gibi)
      console.log("📞 Calling getUpdates method...");
      const telegramData = await this.telegramService.getUpdates();

      const response = await axios.post(
        "http://localhost:3000/api/chat",
        {
          userInput: telegramData.result[0].channel_post.text,
          sessionId: "vlayer-bot-usdc-swapper",
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log(response.data);

      // 2. Hemen ardından webproof oluştur
      const webProof = await this.vlayerService.generateWebProof(
        this.telegramService.getApiUrl()
      );

      // 3. Proof generate et
      console.log("⚙️ Generating proof...");
      const { proof, avgPrice } = await this.vlayerService.prove(
        this.proverAddress,
        this.proverSpec.abi,
        webProof
      );

      // 4. Verify et - artık VlayerService'den çağırıyoruz
      const txHash = await this.vlayerService.verify(
        this.verifierAddress,
        this.verifierSpec.abi,
        proof,
        avgPrice,
        this.ethClient,
        this.account,
        this.confirmations
      );

      const cycleTime = Date.now() - cycleStart;
      console.log(`🎉 Message processing completed! (${cycleTime}ms)`);
      console.log(`📋 TX Hash: ${txHash}`);
      console.log("🔄 Waiting for new messages...");
    } catch (error) {
      console.error("❌ Error during message processing:", error);
      console.log("🔄 System continues waiting for new messages...");
    }
  }

  shutdown(): void {
    console.log("🔄 Shutting down bot...");
    this.isRunning = false;
    console.log("✅ Bot shut down successfully");
  }

  getStatus(): any {
    return {
      initialized: this.isInitialized,
      running: this.isRunning,
      proverAddress: this.proverAddress,
      verifierAddress: this.verifierAddress,
      lastUpdateId: this.telegramService.getLastUpdateId(),
    };
  }
}
