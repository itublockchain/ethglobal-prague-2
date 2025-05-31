/* eslint-disable  */
import { z } from "zod";
import {
  BaseHederaTransactionTool,
  BaseHederaTransactionToolParams,
} from "../common/base-hedera-transaction-tool";
import { BaseServiceBuilder } from "../../../builders/base-service-builder";
import { ScsBuilder } from "../../../builders/scs/scs-builder";
import { ExecuteContractParams } from "../../../types";

// Input schema: For this specific tool, we don't need any user input.
const IncrementCounterZodSchema = z.object({});

export class CallIncrementOnCounter006089867Tool extends BaseHederaTransactionTool<
  typeof IncrementCounterZodSchema
> {
  // Expose this name to the agent, it will be used to identify the tool.
  name = "callIncrementOnCounter006089867";

  // This is what the LLM will see.
  description =
    "Calls the increment function on the pre-configured counter smart contract 0.0.6089867. This function takes no parameters from the user.";

  // Set the schema for the tool's input.
  specificInputSchema = IncrementCounterZodSchema;

  // Optional: assign a namespace if you plan to group custom tools
  namespace = "customCounterTools";

  // Contract ID and function details are hardcoded for this specific tool
  private readonly contractId = "0.0.6089867";
  private readonly functionName = "increment";
  private readonly gasLimit = 100000; // Default gas limit

  constructor(params: BaseHederaTransactionToolParams) {
    super(params);
  }

  protected getServiceBuilder(): BaseServiceBuilder {
    // We are interacting with Smart Contract Service (SCS)
    return this.hederaKit.scs();
  }

  protected async callBuilderMethod(
    builder: BaseServiceBuilder
    // specificArgs: z.infer<typeof IncrementCounterZodSchema> // Not needed for z.object({})
  ): Promise<void> {
    // Type assertion for the builder
    const scsBuilder = builder as ScsBuilder;

    const executeParams: ExecuteContractParams = {
      contractId: this.contractId,
      functionName: this.functionName,
      gas: this.gasLimit,
      // No functionParameters needed for increment()
      // No payableAmount needed
    };

    await scsBuilder.executeContract(executeParams);
  }
}
