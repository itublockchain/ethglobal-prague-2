import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { defineChain } from "viem";
import { injected, walletConnect } from "wagmi/connectors";
import "./index.css";
import App from "./App.tsx";

// Define custom Hedera testnet
const hederaTestnet = defineChain({
  id: 296,
  name: "Hedera Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "HBAR",
    symbol: "HBAR",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet.hashio.io/api"],
    },
  },
  blockExplorers: {
    default: {
      name: "HashScan",
      url: "https://hashscan.io/testnet",
    },
  },
  testnet: true,
});

const config = createConfig({
  chains: [hederaTestnet],
  connectors: [
    injected(),
    walletConnect({
      projectId:
        import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "your-project-id",
    }),
  ],
  transports: {
    [hederaTestnet.id]: http("https://testnet.hashio.io/api"),
  },
});

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          <App />
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
