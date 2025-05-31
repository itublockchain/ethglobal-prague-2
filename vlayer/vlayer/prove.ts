/// <reference types="bun" />

// Vlayer klasörü içindeki modüler backend yapısını kullan
import { NewsBot } from "./src/core/NewsBot";
import proverSpec from "../out/KrakenProver.sol/KrakenProver";
import verifierSpec from "../out/KrakenVerifier.sol/KrakenVerifier";
import { getConfig, createContext } from "@vlayer/sdk/config";

// Telegram bot token'ı
import dotenv from "dotenv";

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function main() {
  try {
    console.log("🎯 NEWS BOT MODÜLER BACKEND BAŞLATILIYOR...");
    console.log("=".repeat(60));

    // vlayer konfigürasyonu
    const config = getConfig();
    const { chain, ethClient, account, proverUrl, confirmations, notaryUrl } =
      createContext(config);

    if (!account) {
      throw new Error(
        "No account found make sure EXAMPLES_TEST_PRIVATE_KEY is set in your environment variables"
      );
    }

    console.log("✅ Konfigürasyon yüklendi");
    console.log("📋 Chain:", chain.name);
    console.log("📋 Account:", account.address);

    // NewsBot instance oluştur
    const newsBot = new NewsBot(
      config,
      ethClient,
      account,
      chain,
      proverUrl || "",
      notaryUrl || "",
      confirmations,
      proverSpec,
      verifierSpec,
      BOT_TOKEN!
    );

    console.log("=".repeat(60));

    // Bot'u başlat
    await newsBot.initialize();

    console.log("=".repeat(60));

    await newsBot.startLongPollingOperation();

    // Bu noktaya asla gelinmeyecek çünkü üstteki Promise asla resolve olmayacak
  } catch (error) {
    console.error("💥 HATA OLUŞTU:", error);
    // process.exit yerine daha güvenli error handling
    throw error;
  }
}

// Backend'i başlat
await main();
