export class TelegramService {
  private readonly apiUrl: string;
  private readonly baseApiUrl: string;
  private lastUpdateId: number = 0;

  constructor(botToken: string) {
    this.baseApiUrl = `https://api.telegram.org/bot${botToken}`;
    this.apiUrl = `${this.baseApiUrl}/getUpdates`;
    console.log(this.apiUrl);
  }

  async getUpdates(): Promise<any> {
    try {
      console.log("📞 Making request to Telegram API...");
      const response = await fetch(this.apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.ok && data.result && data.result.length > 0) {
        console.log(
          "📨 New message received:",
          data.result[0].channel_post.text
        );
      } else {
        console.log("📭 No new updates found");
      }

      return data;
    } catch (error) {
      console.error("❌ Telegram API request failed:", error);
      throw error;
    }
  }

  async getUpdatesLongPolling(timeout: number = 30): Promise<any> {
    try {
      const url = new URL(this.apiUrl);
      url.searchParams.append("timeout", timeout.toString());
      url.searchParams.append("offset", (this.lastUpdateId + 1).toString());

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.ok && data.result && data.result.length > 0) {
        const lastUpdate = data.result[data.result.length - 1];
        this.lastUpdateId = lastUpdate.update_id;

        console.log(`🆕 ${data.result.length} new updates received!`);

        data.result.forEach((update: any, index: number) => {
          if (update.channel_post?.text) {
            console.log(`📨 Message ${index + 1}: ${update.channel_post.text}`);
          }
        });

        return data;
      } else {
        console.log("📭 Long polling timeout - no new messages");
        return data;
      }
    } catch (error) {
      console.error("❌ Long polling request failed:", error);
      throw error;
    }
  }

  async startLongPolling(
    onNewMessage: (updates: any) => Promise<void>,
    timeout: number = 30
  ): Promise<void> {
    console.log("🚀 Starting long polling...");

    while (true) {
      try {
        const updates = await this.getUpdatesLongPolling(timeout);

        if (updates.ok && updates.result && updates.result.length > 0) {
          console.log("⚡ New message detected - starting processing!");
          await onNewMessage(updates);
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error("❌ Long polling error:", error);
        console.log("🔄 Retrying in 5 seconds...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  getApiUrl(): string {
    return this.apiUrl;
  }

  getLastUpdateId(): number {
    return this.lastUpdateId;
  }
}
