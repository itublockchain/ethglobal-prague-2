/* eslint-disable  */
import {
  IPlugin,
  BasePluginContext,
  ToolCreator,
} from "@hashgraphonline/standards-agent-kit";
import { CallIncrementOnCounter006089867Tool } from "../src/langchain/tools/custom/increment-counter-tool";
import { BaseHederaTransactionToolParams } from "../src/langchain/tools/common/base-hedera-transaction-tool";
import { StructuredTool } from "@langchain/core/tools";
import { HederaAgentKit } from "../../src/agent/agent"; // Adjusted path assuming CustomCounterPlugin is in examples/

// Define a more specific context interface if HederaAgentKit passes one
interface CustomPluginContext extends BasePluginContext {
  hederaKit: HederaAgentKit; // Assuming hederaKit is passed in the context by the main agent kit
}

export class CustomCounterPlugin implements IPlugin<CustomPluginContext> {
  public readonly id = "custom-counter-plugin";
  public readonly name = "Custom Counter Plugin";
  public readonly version = "0.0.1";
  public readonly author = "AI Assistant"; // You can change this
  public readonly description =
    "A plugin that provides a tool to increment a specific counter contract (0.0.6089867).";

  private context?: CustomPluginContext;

  public async initialize(context: CustomPluginContext): Promise<void> {
    this.context = context;
    if (!this.context.hederaKit) {
      this.context.logger.error(
        "HederaAgentKit not found in plugin context during initialization."
      );
      throw new Error("HederaAgentKit is required for this plugin.");
    }
    this.context.logger.info(`CustomCounterPlugin initialized.`);
  }

  /**
   * Provides an array of ToolCreator functions.
   * HederaAgentKit will be responsible for calling these functions with the
   * necessary BaseHederaTransactionToolParams when it aggregates tools.
   */
  public getTools(): StructuredTool[] {
    if (!this.context || !this.context.hederaKit) {
      //This check might be redundant if initialize throws, but good for safety
      throw new Error(
        "Plugin not initialized properly or hederaKit not available. Call initialize() with proper context before getTools()."
      );
    }

    const toolParams: BaseHederaTransactionToolParams = {
      hederaKit: this.context.hederaKit,
      logger: this.context.logger,
    };

    return [new CallIncrementOnCounter006089867Tool(toolParams)];
  }
}
