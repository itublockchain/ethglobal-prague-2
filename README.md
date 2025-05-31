# Project Overview

This project involves the integration of smart contracts deployed on the Hedera network, a frontend application, and an AI agent using the Hedera Agent Kit.

## Contracts

This section includes contracts that have been deployed using Remix and verified on HashScan. Please fill in the contract addresses below:

- **Vault & Swapper Contract**: `0.0.6092626`
- **Router Contract**: `0.0.`
- **Instant Withdraw Contract**:

## Frontend

The frontend of this project is built using modern web technologies. To start the development server, use the following command:

```bash
npm run dev
```

This will launch the application in development mode, allowing you to interact with the deployed contracts.

## Hedera Agent Kit

The Hedera Agent Kit is used to create an AI agent that interacts with the Swapper contract. The swap plugin is implemented using `langchain.ts` in the examples directory. This plugin facilitates token swapping operations and contract interactions on the Hedera network.

For more details on how to use the Hedera Agent Kit and the swap plugin, refer to the documentation in the `hedera-agent-kit` directory.

- **Agent Account** - `0.0.6084394`

---

Please ensure all environment variables are set correctly in your `.env` file for seamless operation of the Hedera client and contract interactions.
