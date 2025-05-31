if (typeof window === "undefined") {
  (global as any).window = {};
}
if (typeof self === "undefined") {
  (global as any).self = global;
}

import * as dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { ServerSigner } from "../src/signer/server-signer";
import {
  HederaConversationalAgent,
  AgentResponse,
  HederaConversationalAgentConfig,
} from "../src/agent/conversational-agent";
import { HelloWorldPlugin } from "./hello-world-plugin";
import { IPlugin } from "@hashgraphonline/standards-agent-kit";
import { HederaNetworkType } from "../src/types";
import { SwapperPlugin } from "./swapper-plugin";

async function main() {
  console.log(
    "Starting Hedera Agent Kit with Express API using HederaConversationalAgent..."
  );

  const operatorId = process.env.HEDERA_ACCOUNT_ID;
  const operatorKey = process.env.HEDERA_PRIVATE_KEY;
  const network = (process.env.HEDERA_NETWORK ||
    "testnet") as HederaNetworkType;
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const userAccountId = process.env.USER_ACCOUNT_ID;

  if (!operatorId || !operatorKey) {
    throw new Error(
      "HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY must be set in .env"
    );
  }
  if (!openaiApiKey) {
    console.warn(
      "OPENAI_API_KEY is not explicitly checked here, ensure it is set for default LLM in ConversationalAgent."
    );
  }

  console.log(`Using Agent Operator ID: ${operatorId} on ${network}`);
  if (userAccountId) {
    console.log(
      `User Account ID (for agent awareness): ${userAccountId} is configured.`
    );
  } else {
    console.warn(
      "USER_ACCOUNT_ID is not set. Agent will operate without specific user account context for some operations."
    );
  }

  const agentSigner = new ServerSigner(operatorId, operatorKey, network);

  const agentConfig: HederaConversationalAgentConfig = {
    operationalMode: "directExecution",
    verbose: false,
    scheduleUserTransactionsInBytesMode: false,
    openAIModelName: "gpt-4o-mini",
    pluginConfig: {
      plugins: [new SwapperPlugin() as IPlugin],
    },
  };

  if (userAccountId) {
    agentConfig.userAccountId = userAccountId;
  }
  if (openaiApiKey) {
    agentConfig.openAIApiKey = openaiApiKey;
  }

  const conversationalAgent = new HederaConversationalAgent(
    agentSigner,
    agentConfig
  );

  await conversationalAgent.initialize();
  console.log("HederaConversationalAgent initialized.");

  const app = express();
  app.use(bodyParser.json());

  const chatHistories: {
    [sessionId: string]: Array<{ type: "human" | "ai"; content: string }>;
  } = {};

  app.post("/api/chat", async (req: Request, res: Response) => {
    const { userInput, sessionId, chatHistory: clientChatHistory } = req.body;

    if (!userInput) {
      res.status(400).json({ error: "userInput is required" });
      return;
    }

    let currentChatHistory: Array<{ type: "human" | "ai"; content: string }> =
      [];
    if (sessionId) {
      if (!chatHistories[sessionId]) {
        chatHistories[sessionId] = [];
      }
      currentChatHistory = chatHistories[sessionId];
    } else if (clientChatHistory && Array.isArray(clientChatHistory)) {
      currentChatHistory = clientChatHistory;
    }

    currentChatHistory.push({ type: "human", content: userInput });

    try {
      const agentResponse: AgentResponse =
        await conversationalAgent.processMessage(userInput, currentChatHistory);

      currentChatHistory.push({
        type: "ai",
        content: agentResponse.message || agentResponse.output,
      });
      if (sessionId) {
        chatHistories[sessionId] = currentChatHistory;
      }

      console.log("Agent API Response:", agentResponse);
      res.json(agentResponse);
    } catch (error: any) {
      console.error("Error processing message via API:", error);
      currentChatHistory.push({
        type: "ai",
        content: `Sorry, an error occurred: ${error.message || String(error)}`,
      });
      if (sessionId) {
        chatHistories[sessionId] = currentChatHistory;
      }
      res.status(500).json({
        error: "Failed to process message",
        details: error.message || String(error),
        chatHistory: currentChatHistory,
      });
    }
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Hedera Agent API server listening on port ${port}`);
    console.log(
      `Try POSTing to http://localhost:${port}/api/chat with JSON: { "userInput": "your message", "sessionId": "some-session-id" }`
    );
  });
}

main().catch(console.error);
