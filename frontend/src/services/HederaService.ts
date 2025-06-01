import { ethers } from "ethers";
import { VAULT_ABI } from "./vaultABI";

// Hedera Testnet configuration
export const HEDERA_TESTNET_CONFIG = {
  chainId: 296,
  name: "Hedera Testnet",
  rpcUrl: "https://testnet.hashio.io/api",
  explorerUrl: "https://hashscan.io/testnet",
  nativeCurrency: {
    name: "HBAR",
    symbol: "HBAR",
    decimals: 18,
  },
};

// Contract addresses
export const CONTRACT_ADDRESSES = {
  VAULT_SWAPPER: "0xab298c8018b4e82b1f14cca2d558daca17870606",
  USDC: "0x0000000000000000000000000000000000120f46", // Hedera USDC address
  WHBAR: "0x0000000000000000000000000000000000003aD2", // Wrapped HBAR address
};

// USDC contract ABI for approvals
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function decimals() external view returns (uint8)",
];

export interface VaultData {
  totalSupply: string;
  availableBalance: string;
  userDeposited: string;
  apr: string;
  userUsdcBalance: string;
  userAllowance: string;
  vaultBalance: string;
  dripInterval: string;
  dripPercent: string;
  poolFee: string;
}

export class HederaService {
  private provider: ethers.JsonRpcProvider;
  private signer?: ethers.Signer;
  private vaultContract?: ethers.Contract;
  private usdcContract?: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(HEDERA_TESTNET_CONFIG.rpcUrl);
  }

  /**
   * Initialize the service with a wallet signer
   */
  async initialize(signer: ethers.Signer): Promise<void> {
    this.signer = signer;
    this.vaultContract = new ethers.Contract(
      CONTRACT_ADDRESSES.VAULT_SWAPPER,
      VAULT_ABI,
      signer
    );
    this.usdcContract = new ethers.Contract(
      CONTRACT_ADDRESSES.USDC,
      ERC20_ABI,
      signer
    );
  }

  /**
   * Get provider for read-only operations
   */
  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  /**
   * Check if service is initialized with a signer
   */
  isInitialized(): boolean {
    return !!this.signer && !!this.vaultContract && !!this.usdcContract;
  }

  /**
   * Get vault data for a user
   */
  async getVaultData(userAddress: string): Promise<VaultData> {
    if (!this.vaultContract || !this.usdcContract) {
      throw new Error("Service not initialized");
    }

    try {
      const [
        vaultBalance,
        userBalance,
        userUsdcBalance,
        userAllowance,
        dripInterval,
        dripPercent,
        poolFee,
      ] = await Promise.all([
        this.vaultContract.getVaultBalance(),
        this.vaultContract.balances(userAddress),
        this.usdcContract.balanceOf(userAddress),
        this.usdcContract.balanceOf(CONTRACT_ADDRESSES.VAULT_SWAPPER),
        this.usdcContract.allowance(
          userAddress,
          CONTRACT_ADDRESSES.VAULT_SWAPPER
        ),
        this.vaultContract.DRIP_INTERVAL(),
        this.vaultContract.DRIP_PERCENT(),
        this.vaultContract.POOL_FEE(),
      ]);

      return {
        totalSupply: ethers.formatUnits(vaultBalance, 6), // USDC has 6 decimals
        availableBalance: ethers.formatUnits(vaultBalance, 6), // Same as vault balance
        userDeposited: ethers.formatUnits(userBalance, 6),
        apr: "5.7", // This would come from contract calculation or API
        userUsdcBalance: ethers.formatUnits(userUsdcBalance, 6),
        userAllowance: ethers.formatUnits(userAllowance, 6),
        vaultBalance: ethers.formatUnits(vaultBalance, 6),
        dripInterval: dripInterval.toString(),
        dripPercent: dripPercent.toString(),
        poolFee: poolFee.toString(),
      };
    } catch (error) {
      console.error("Error fetching vault data:", error);
      throw error;
    }
  }

  /**
   * Get contract constants
   */
  async getContractConstants(): Promise<{
    usdcAddress: string;
    whbarAddress: string;
    routerAddress: string;
    poolFee: number;
    dripInterval: number;
    dripPercent: number;
  }> {
    if (!this.vaultContract) {
      throw new Error("Service not initialized");
    }

    try {
      const [
        usdcAddress,
        whbarAddress,
        routerAddress,
        poolFee,
        dripInterval,
        dripPercent,
      ] = await Promise.all([
        this.vaultContract.USDC_ADDRESS(),
        this.vaultContract.WHBAR_ADDRESS(),
        this.vaultContract.ROUTER_ADDRESS(),
        this.vaultContract.POOL_FEE(),
        this.vaultContract.DRIP_INTERVAL(),
        this.vaultContract.DRIP_PERCENT(),
      ]);

      return {
        usdcAddress,
        whbarAddress,
        routerAddress,
        poolFee: Number(poolFee),
        dripInterval: Number(dripInterval),
        dripPercent: Number(dripPercent),
      };
    } catch (error) {
      console.error("Error fetching contract constants:", error);
      throw error;
    }
  }

  /**
   * Check if user has approval for the vault contract
   */
  async checkApproval(userAddress: string): Promise<boolean> {
    if (!this.vaultContract) {
      throw new Error("Service not initialized");
    }

    try {
      return await this.vaultContract.checkApproval(userAddress);
    } catch (error) {
      console.error("Error checking approval:", error);
      throw error;
    }
  }

  /**
   * Approve USDC spending by vault contract
   */
  async approveUSDC(amount: string): Promise<ethers.TransactionResponse> {
    if (!this.usdcContract) {
      throw new Error("Service not initialized");
    }

    const amountWei = ethers.parseUnits(amount, 6); // USDC has 6 decimals
    return await this.usdcContract.approve(
      CONTRACT_ADDRESSES.VAULT_SWAPPER,
      amountWei
    );
  }

  /**
   * Deposit USDC to vault
   */
  async deposit(amount: string): Promise<ethers.TransactionResponse> {
    if (!this.vaultContract) {
      throw new Error("Service not initialized");
    }

    const amountWei = ethers.parseUnits(amount, 6); // USDC has 6 decimals
    return await this.vaultContract.deposit(amountWei);
  }

  /**
   * Withdraw USDC from vault
   */
  async withdraw(amount: string): Promise<ethers.TransactionResponse> {
    if (!this.vaultContract) {
      throw new Error("Service not initialized");
    }

    const amountWei = ethers.parseUnits(amount, 6); // USDC has 6 decimals
    return await this.vaultContract.withdraw(amountWei);
  }

  /**
   * Swap USDC for WHBAR
   */
  async swapUsdcForWhbar(
    amountIn: string,
    amountOutMin: string
  ): Promise<ethers.TransactionResponse> {
    if (!this.vaultContract) {
      throw new Error("Service not initialized");
    }

    const amountInWei = ethers.parseUnits(amountIn, 6); // USDC has 6 decimals
    const amountOutMinWei = ethers.parseUnits(amountOutMin, 18); // WHBAR has 18 decimals

    return await this.vaultContract.swapUsdcForWhbar(
      amountInWei,
      amountOutMinWei
    );
  }

  /**
   * Give approvals to contracts (for swapping)
   */
  async giveApproveToContracts(): Promise<ethers.TransactionResponse> {
    if (!this.vaultContract) {
      throw new Error("Service not initialized");
    }

    return await this.vaultContract.giveAproveToContracts();
  }

  /**
   * Trigger drip to instant withdraw contract
   */
  async dripToInstantWithdraw(): Promise<ethers.TransactionResponse> {
    if (!this.vaultContract) {
      throw new Error("Service not initialized");
    }

    return await this.vaultContract.dripToInstantWithdraw();
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(
    txHash: string
  ): Promise<ethers.TransactionReceipt | null> {
    return await this.provider.waitForTransaction(txHash);
  }

  /**
   * Format address for display
   */
  formatAddress(address: string): string {
    if (address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Convert EVM address to Hedera format (0.0.x)
   */
  static evmToHederaId(evmAddress: string): string {
    // This is a simplified conversion - in practice you'd need proper mapping
    if (evmAddress === CONTRACT_ADDRESSES.VAULT_SWAPPER) {
      return "0.0.6092626";
    }
    // For other addresses, you'd need a proper EVM to Hedera ID mapping service
    return evmAddress;
  }
}

// Singleton instance
export const hederaService = new HederaService();
