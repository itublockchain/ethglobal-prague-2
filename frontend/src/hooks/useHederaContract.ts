import { useState, useEffect, useCallback } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import { hederaService, CONTRACT_ADDRESSES } from "../services/HederaService";
import type { VaultData } from "../services/HederaService";

export interface TransactionState {
  isLoading: boolean;
  hash?: string;
  error?: string;
}

export interface ContractConstants {
  usdcAddress: string;
  whbarAddress: string;
  routerAddress: string;
  poolFee: number;
  dripInterval: number;
  dripPercent: number;
}

export const useHederaContract = () => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [isInitialized, setIsInitialized] = useState(false);
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [contractConstants, setContractConstants] =
    useState<ContractConstants | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [transactionState, setTransactionState] = useState<TransactionState>({
    isLoading: false,
  });

  // Initialize the Hedera service when wallet is connected
  useEffect(() => {
    const initializeService = async () => {
      if (walletClient && isConnected) {
        try {
          // Convert wagmi wallet client to ethers signer
          const provider = new ethers.BrowserProvider(walletClient);
          const signer = await provider.getSigner();

          await hederaService.initialize(signer);
          setIsInitialized(true);
          console.log("✅ Hedera service initialized");

          // Fetch contract constants once initialized
          try {
            const constants = await hederaService.getContractConstants();
            setContractConstants(constants);
            console.log("📋 Contract constants fetched:", constants);
          } catch (error) {
            console.warn("⚠️  Failed to fetch contract constants:", error);
          }
        } catch (error) {
          console.error("❌ Failed to initialize Hedera service:", error);
          setIsInitialized(false);
        }
      } else {
        setIsInitialized(false);
        setVaultData(null);
        setContractConstants(null);
      }
    };

    initializeService();
  }, [walletClient, isConnected]);

  // Fetch vault data
  const fetchVaultData = useCallback(async () => {
    if (!isInitialized || !address) return;

    setIsLoadingData(true);
    try {
      const data = await hederaService.getVaultData(address);
      setVaultData(data);
      console.log("📊 Vault data fetched:", data);
    } catch (error) {
      console.error("❌ Failed to fetch vault data:", error);
    } finally {
      setIsLoadingData(false);
    }
  }, [isInitialized, address]);

  // Fetch data when service is initialized
  useEffect(() => {
    if (isInitialized) {
      fetchVaultData();
    }
  }, [isInitialized, fetchVaultData]);

  // Helper function to handle transactions
  const executeTransaction = useCallback(
    async (
      transactionFn: () => Promise<ethers.TransactionResponse>,
      onSuccess?: (hash: string) => void
    ) => {
      setTransactionState({ isLoading: true });

      try {
        const tx = await transactionFn();
        console.log("📤 Transaction sent:", tx.hash);

        setTransactionState({
          isLoading: true,
          hash: tx.hash,
        });

        // Wait for confirmation
        const receipt = await hederaService.waitForTransaction(tx.hash);

        if (receipt) {
          console.log("✅ Transaction confirmed:", receipt.hash);
          setTransactionState({ isLoading: false });

          // Refresh vault data after successful transaction
          await fetchVaultData();

          if (onSuccess) {
            onSuccess(receipt.hash);
          }
        } else {
          throw new Error("Transaction failed");
        }
      } catch (error: unknown) {
        console.error("❌ Transaction failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Transaction failed";
        setTransactionState({
          isLoading: false,
          error: errorMessage,
        });
        throw error;
      }
    },
    [fetchVaultData]
  );

  // Check approval status using the contract's checkApproval function
  const checkApproval = useCallback(
    async (userAddress: string): Promise<boolean> => {
      if (!isInitialized) return false;

      try {
        return await hederaService.checkApproval(userAddress);
      } catch (error) {
        console.error("❌ Failed to check approval:", error);
        return false;
      }
    },
    [isInitialized]
  );

  // Contract interaction functions
  const approveUSDC = useCallback(
    async (amount: string) => {
      if (!isInitialized) throw new Error("Service not initialized");

      return executeTransaction(
        () => hederaService.approveUSDC(amount),
        (hash) => console.log(`✅ USDC approval confirmed: ${hash}`)
      );
    },
    [isInitialized, executeTransaction]
  );

  const deposit = useCallback(
    async (amount: string) => {
      if (!isInitialized) throw new Error("Service not initialized");

      return executeTransaction(
        () => hederaService.deposit(amount),
        (hash) => console.log(`✅ Deposit confirmed: ${hash}`)
      );
    },
    [isInitialized, executeTransaction]
  );

  const withdraw = useCallback(
    async (amount: string) => {
      if (!isInitialized) throw new Error("Service not initialized");

      return executeTransaction(
        () => hederaService.withdraw(amount),
        (hash) => console.log(`✅ Withdrawal confirmed: ${hash}`)
      );
    },
    [isInitialized, executeTransaction]
  );

  const swapUsdcForWhbar = useCallback(
    async (amountIn: string, amountOutMin: string) => {
      if (!isInitialized) throw new Error("Service not initialized");

      return executeTransaction(
        () => hederaService.swapUsdcForWhbar(amountIn, amountOutMin),
        (hash) => console.log(`✅ Swap confirmed: ${hash}`)
      );
    },
    [isInitialized, executeTransaction]
  );

  const giveApproveToContracts = useCallback(async () => {
    if (!isInitialized) throw new Error("Service not initialized");

    return executeTransaction(
      () => hederaService.giveApproveToContracts(),
      (hash) => console.log(`✅ Contract approvals confirmed: ${hash}`)
    );
  }, [isInitialized, executeTransaction]);

  const dripToInstantWithdraw = useCallback(async () => {
    if (!isInitialized) throw new Error("Service not initialized");

    return executeTransaction(
      () => hederaService.dripToInstantWithdraw(),
      (hash) => console.log(`✅ Drip to instant withdraw confirmed: ${hash}`)
    );
  }, [isInitialized, executeTransaction]);

  // Clear transaction state
  const clearTransactionState = useCallback(() => {
    setTransactionState({ isLoading: false });
  }, []);

  // Check if user needs to approve USDC before deposit
  const needsApproval = useCallback(
    (amount: string): boolean => {
      if (!vaultData) return true;
      return parseFloat(vaultData.userAllowance) < parseFloat(amount);
    },
    [vaultData]
  );

  // Enhanced approval check that uses contract's checkApproval function
  const hasContractApproval = useCallback(async (): Promise<boolean> => {
    if (!address || !isInitialized) return false;
    return await checkApproval(address);
  }, [address, isInitialized, checkApproval]);

  // Get max deposit amount directly from ERC20 balanceOf
  const getMaxDepositAmount = useCallback(async (): Promise<string> => {
    if (!address || !isInitialized) return "0";

    try {
      const balance = await hederaService.getProvider().call({
        to: CONTRACT_ADDRESSES.USDC,
        data: new ethers.Interface([
          "function balanceOf(address) view returns (uint256)",
        ]).encodeFunctionData("balanceOf", [address]),
      });

      const decoded = new ethers.Interface([
        "function balanceOf(address) view returns (uint256)",
      ]).decodeFunctionResult("balanceOf", balance);
      return ethers.formatUnits(decoded[0], 6); // USDC has 6 decimals
    } catch (error) {
      console.error("❌ Failed to get max deposit amount:", error);
      return "0";
    }
  }, [address, isInitialized]);

  // Get max withdraw amount directly from vault balances mapping
  const getMaxWithdrawAmount = useCallback(async (): Promise<string> => {
    if (!address || !isInitialized) return "0";

    try {
      const balance = await hederaService.getProvider().call({
        to: CONTRACT_ADDRESSES.VAULT_SWAPPER,
        data: new ethers.Interface([
          "function balances(address) view returns (uint256)",
        ]).encodeFunctionData("balances", [address]),
      });

      const decoded = new ethers.Interface([
        "function balances(address) view returns (uint256)",
      ]).decodeFunctionResult("balances", balance);
      return ethers.formatUnits(decoded[0], 6); // USDC has 6 decimals
    } catch (error) {
      console.error("❌ Failed to get max withdraw amount:", error);
      return "0";
    }
  }, [address, isInitialized]);

  return {
    // State
    isConnected,
    address,
    isInitialized,
    vaultData,
    contractConstants,
    isLoadingData,
    transactionState,

    // Actions
    fetchVaultData,
    approveUSDC,
    deposit,
    withdraw,
    swapUsdcForWhbar,
    giveApproveToContracts,
    dripToInstantWithdraw,
    clearTransactionState,

    // Checks
    needsApproval,
    checkApproval,
    hasContractApproval,

    // Utilities
    formatAddress: hederaService.formatAddress,
    getMaxDepositAmount,
    getMaxWithdrawAmount,
  };
};
