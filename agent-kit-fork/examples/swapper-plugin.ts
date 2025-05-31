/* eslint-disable */
import {
  GenericPlugin,
  GenericPluginContext,
} from "@hashgraphonline/standards-agent-kit";
import { StructuredTool, DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import {
  ContractExecuteTransaction,
  Client,
  Hbar,
  ContractFunctionParameters,
  AccountAllowanceApproveTransaction,
} from "@hashgraph/sdk";

/**
 * A plugin that provides tools to interact with the Swapper contract.
 * This plugin enables swapping USDC for WHBAR and managing contract approvals.
 */
export class SwapperPlugin extends GenericPlugin {
  id = "swapper-plugin";
  name = "Swapper Plugin";
  description =
    "A plugin that provides tools to interact with the Swapper contract for token swapping operations.";
  version = "1.0.0";
  author = "Hedera Agent Kit Demo";
  namespace = "swapper";

  // Swapper contract constants
  private readonly SWAPPER_CONTRACT_ID = "0.0.6092626";
  private readonly DEFAULT_GAS = 2800000;

  override async initialize(context: GenericPluginContext): Promise<void> {
    await super.initialize(context);
    this.context.logger.info("SwapperPlugin initialized");
  }

  private getHederaClient(): Client {
    //Create Hedera client from env vars
    const accountId = process.env.HEDERA_ACCOUNT_ID;
    const privateKey = process.env.HEDERA_PRIVATE_KEY;

    if (!accountId || !privateKey) {
      throw new Error(
        "HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be set in .env"
      );
    }

    const client = Client.forTestnet();
    client.setOperator(accountId, privateKey);

    return client;
  }

  getTools(): StructuredTool[] {
    return [
      // Tool to swap USDC for WHBAR
      new DynamicStructuredTool({
        name: "swap_usdc_for_whbar",
        description: "Swaps USDC tokens for WHBAR using the Swapper contract.",
        schema: z.object({
          amountInUsdc: z
            .string()
            .describe(
              "Amount of USDC to swap (in smallest unit, e.g., micro USDC)"
            ),
          amountOutMinWhbar: z
            .string()
            .describe("Minimum amount of WHBAR to receive (in tinybars)"),
          gas: z
            .number()
            .optional()
            .describe("Gas limit for the transaction (defaults to 1000000)"),
          memo: z
            .string()
            .optional()
            .describe("Optional memo for the transaction"),
        }),
        func: async ({
          amountInUsdc,
          amountOutMinWhbar,
          gas,
          memo,
        }: {
          amountInUsdc: string;
          amountOutMinWhbar: string;
          gas?: number;
          memo?: string;
        }): Promise<string> => {
          try {
            this.context.logger.info("=== Starting USDC to WHBAR swap ===");
            this.context.logger.info(
              `Input parameters: amountInUsdc=${amountInUsdc}, amountOutMinWhbar=${amountOutMinWhbar}, gas=${gas}, memo=${memo}`
            );

            const finalGas = this.DEFAULT_GAS || gas;
            this.context.logger.info(`Using gas limit: ${finalGas}`);

            const client = this.getHederaClient();
            this.context.logger.info("Successfully obtained Hedera client");

            // Create function parameters
            this.context.logger.info(
              "Creating contract function parameters..."
            );
            const usdcAmount = Number(amountInUsdc);
            const whbarMinAmount = Number(amountOutMinWhbar + 1);
            this.context.logger.info(
              `Converted amounts: USDC=${usdcAmount}, WHBAR_MIN=${whbarMinAmount}`
            );

            const functionParams = new ContractFunctionParameters()
              .addUint256(usdcAmount)
              .addUint256(whbarMinAmount);
            this.context.logger.info(
              "Function parameters created successfully"
            );

            // Create the contract execute transaction
            this.context.logger.info(
              `Creating contract execute transaction for contract: ${this.SWAPPER_CONTRACT_ID}`
            );
            const transaction = new ContractExecuteTransaction()
              .setContractId(this.SWAPPER_CONTRACT_ID)
              .setGas(finalGas)
              .setFunction("swapUsdcForWhbar", functionParams);

            if (memo) {
              transaction.setTransactionMemo(memo);
              this.context.logger.info(`Added memo to transaction: ${memo}`);
            }

            this.context.logger.info(
              "Transaction created, preparing to execute..."
            );

            // Execute the transaction
            this.context.logger.info("Executing transaction...");
            const response = await transaction.execute(client);
            this.context.logger.info(
              `Transaction submitted with ID: ${response.transactionId}`
            );

            this.context.logger.info("Waiting for transaction receipt...");
            const receipt = await response.getReceipt(client);
            this.context.logger.info(
              `Transaction completed with status: ${receipt.status}`
            );

            const successMessage = `Swap executed successfully! Transaction ID: ${response.transactionId}. Status: ${receipt.status}. Swapped ${amountInUsdc} USDC for WHBAR with minimum ${amountOutMinWhbar} expected.`;
            this.context.logger.info("=== Swap completed successfully ===");
            this.context.logger.info(successMessage);

            return successMessage;
          } catch (error: any) {
            this.context.logger.error("=== Swap failed ===");
            this.context.logger.error(`Error type: ${error.constructor.name}`);
            this.context.logger.error(`Error message: ${error.message}`);
            this.context.logger.error(
              `Full error: ${JSON.stringify(error, null, 2)}`
            );
            this.context.logger.error(`Stack trace: ${error.stack}`);
            throw new Error(`Failed to execute swap: ${error.message}`);
          }
        },
      }),

      // Tool to give approvals to contracts
      new DynamicStructuredTool({
        name: "give_approve_to_contracts",
        description:
          "Gives approval to the Swapper contract and router for USDC token operations.",
        schema: z.object({
          gas: z
            .number()
            .optional()
            .describe("Gas limit for the transaction (defaults to 1000000)"),
          memo: z
            .string()
            .optional()
            .describe("Optional memo for the transaction"),
        }),
        func: async ({
          gas,
          memo,
        }: {
          gas?: number;
          memo?: string;
        }): Promise<string> => {
          try {
            const finalGas = this.DEFAULT_GAS || gas;
            const client = this.getHederaClient();

            // Create the contract execute transaction
            const transaction = new ContractExecuteTransaction()
              .setContractId(this.SWAPPER_CONTRACT_ID)
              .setGas(finalGas)
              .setFunction("giveAproveToContracts");

            if (memo) {
              transaction.setTransactionMemo(memo);
            }

            // Execute the transaction
            const response = await transaction.execute(client);
            const receipt = await response.getReceipt(client);

            this.context.logger.info(
              `Approval transaction executed successfully: ${response.transactionId}`
            );
            return `Approval transaction executed successfully! Transaction ID: ${response.transactionId}. Status: ${receipt.status}. Contract now has approval for USDC operations.`;
          } catch (error: any) {
            this.context.logger.error(`Approval failed: ${error.message}`);
            throw new Error(`Failed to execute approval: ${error.message}`);
          }
        },
      }),

      // Tool to send HBAR to the contract (for the receive function)
      new DynamicStructuredTool({
        name: "send_hbar_to_swapper",
        description:
          "Sends HBAR to the Swapper contract (triggers the receive function).",
        schema: z.object({
          amount: z
            .string()
            .describe('Amount of HBAR to send (in HBAR units, e.g., "1.5")'),
          gas: z
            .number()
            .optional()
            .describe("Gas limit for the transaction (defaults to 1000000)"),
          memo: z
            .string()
            .optional()
            .describe("Optional memo for the transaction"),
        }),
        func: async ({
          amount,
          gas,
          memo,
        }: {
          amount: string;
          gas?: number;
          memo?: string;
        }): Promise<string> => {
          try {
            const finalGas = this.DEFAULT_GAS || gas;
            const client = this.getHederaClient();

            // Create the contract execute transaction with payable amount
            const transaction = new ContractExecuteTransaction()
              .setContractId(this.SWAPPER_CONTRACT_ID)
              .setGas(finalGas)
              .setPayableAmount(new Hbar(parseFloat(amount)));

            if (memo) {
              transaction.setTransactionMemo(memo);
            }

            // Execute the transaction
            const response = await transaction.execute(client);
            const receipt = await response.getReceipt(client);

            this.context.logger.info(
              `HBAR sent successfully: ${response.transactionId}`
            );
            return `HBAR sent successfully! Transaction ID: ${response.transactionId}. Status: ${receipt.status}. Sent ${amount} HBAR to the Swapper contract.`;
          } catch (error: any) {
            this.context.logger.error(`Send HBAR failed: ${error.message}`);
            throw new Error(`Failed to send HBAR: ${error.message}`);
          }
        },
      }),

      // Tool to get contract constants/info
      new DynamicStructuredTool({
        name: "get_swapper_info",
        description:
          "Gets information about the Swapper contract including token addresses and settings.",
        schema: z.object({}),
        func: async (): Promise<string> => {
          return `Swapper Contract Information:
- Contract ID: ${this.SWAPPER_CONTRACT_ID}
- WHBAR Address: 0x0000000000000000000000000000000000003aD2
- USDC Address: 0x0000000000000000000000000000000000120f46
- Router Address: 0x0000000000000000000000000000000000159398
- Pool Fee: 3000 (0.3%)

Available Functions:
1. swapUsdcForWhbar - Swap USDC tokens for WHBAR
2. giveAproveToContracts - Give approvals for token operations
3. receive - Accept HBAR payments (triggered by sending HBAR to contract)`;
        },
      }),
    ];
  }
}
