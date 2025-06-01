import React, { useState, useEffect } from "react";
import { Button } from "../UI";
import { useHederaContract } from "../../hooks/useHederaContract";
import "./VaultDetail.css";

const VaultDetail: React.FC = () => {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [maxDepositAmount, setMaxDepositAmount] = useState<number>(0);
  const [maxWithdrawAmount, setMaxWithdrawAmount] = useState<number>(0);

  const {
    isConnected,
    address,
    isInitialized,
    vaultData,
    contractConstants,
    isLoadingData,
    transactionState,
    approveUSDC,
    deposit,
    withdraw,
    clearTransactionState,
    needsApproval,
    formatAddress,
    getMaxDepositAmount,
    getMaxWithdrawAmount,
  } = useHederaContract();

  // Clear transaction state when component mounts
  useEffect(() => {
    clearTransactionState();
  }, [clearTransactionState]);

  // Fetch max amounts from contracts
  useEffect(() => {
    const fetchMaxAmounts = async () => {
      if (!isInitialized || !address) return;

      try {
        const [maxDeposit, maxWithdraw] = await Promise.all([
          getMaxDepositAmount(),
          getMaxWithdrawAmount(),
        ]);

        setMaxDepositAmount(parseFloat(maxDeposit));
        setMaxWithdrawAmount(parseFloat(maxWithdraw));
        console.log("📊 Max amounts fetched:", { maxDeposit, maxWithdraw });
      } catch (error) {
        console.error("❌ Failed to fetch max amounts:", error);
      }
    };

    fetchMaxAmounts();
  }, [isInitialized, address, getMaxDepositAmount, getMaxWithdrawAmount]);

  // Refresh max amounts after successful transactions
  useEffect(() => {
    if (
      !transactionState.isLoading &&
      !transactionState.error &&
      transactionState.hash
    ) {
      // Transaction completed successfully, refresh max amounts
      const refreshMaxAmounts = async () => {
        try {
          const [maxDeposit, maxWithdraw] = await Promise.all([
            getMaxDepositAmount(),
            getMaxWithdrawAmount(),
          ]);

          setMaxDepositAmount(parseFloat(maxDeposit));
          setMaxWithdrawAmount(parseFloat(maxWithdraw));
        } catch (error) {
          console.error("❌ Failed to refresh max amounts:", error);
        }
      };

      refreshMaxAmounts();
    }
  }, [transactionState, getMaxDepositAmount, getMaxWithdrawAmount]);

  const handleDeposit = async () => {
    if (!depositAmount || !isInitialized) return;

    try {
      // Check if approval is needed
      if (needsApproval(depositAmount)) {
        console.log("Approving USDC...");
        await approveUSDC(depositAmount);
      }

      console.log("Depositing to vault...");
      await deposit(depositAmount);
      setDepositAmount("");
    } catch (error) {
      console.error("Deposit failed:", error);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !isInitialized) return;

    try {
      console.log("Withdrawing from vault...");
      await withdraw(withdrawAmount);
      setWithdrawAmount("");
    } catch (error) {
      console.error("Withdraw failed:", error);
    }
  };

  const handleMaxDeposit = () => {
    setDepositAmount(maxDepositAmount.toString());
  };

  const handleMaxWithdraw = () => {
    setWithdrawAmount(maxWithdrawAmount.toString());
  };

  // Calculate drip info
  const getDripInfo = () => {
    if (!contractConstants || !vaultData) return null;

    const dripIntervalHours = contractConstants.dripInterval / 3600; // Convert seconds to hours
    const dripPercentFormatted = (contractConstants.dripPercent / 100).toFixed(
      1
    ); // Assuming basis points

    return {
      intervalHours: dripIntervalHours,
      percent: dripPercentFormatted,
    };
  };

  const dripInfo = getDripInfo();

  // Show loading state if not connected
  if (!isConnected) {
    return (
      <div className="vault-detail-page">
        <div className="vault-not-found">
          <h2>Wallet Not Connected</h2>
          <p>Please connect your wallet to view vault details</p>
        </div>
      </div>
    );
  }

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="vault-detail-page">
        <div className="vault-not-found">
          <h2>Initializing...</h2>
          <p>Setting up Hedera connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vault-detail-page">
      {/* Split Layout */}
      <div className="vault-split-layout">
        {/* Left Half - About This Vault */}
        <div className="vault-info-section">
          <h3>About This Vault</h3>
          <p>
            A secure vault for USDC tokens on Hedera network with automated
            yield farming strategies and instant withdraw capabilities.
          </p>

          <div className="vault-details">
            <div className="detail-row">
              <span>Your Wallet:</span>
              <span>{address ? formatAddress(address) : "Not connected"}</span>
            </div>
            <div className="detail-row">
              <span>Your USDC Balance:</span>
              <span>
                {isLoadingData
                  ? "Loading..."
                  : vaultData
                  ? `${vaultData.userUsdcBalance} USDC`
                  : "N/A"}
              </span>
            </div>
            <div className="detail-row">
              <span>Your Deposited:</span>
              <span>
                {isLoadingData
                  ? "Loading..."
                  : vaultData
                  ? `${vaultData.userDeposited} USDC`
                  : "N/A"}
              </span>
            </div>
            <div className="detail-row">
              <span>USDC Allowance:</span>
              <span>
                {isLoadingData
                  ? "Loading..."
                  : vaultData
                  ? `${vaultData.userAllowance} USDC`
                  : "N/A"}
              </span>
            </div>
            {dripInfo && (
              <>
                <div className="detail-row">
                  <span>Drip Interval:</span>
                  <span>{dripInfo.intervalHours} hours</span>
                </div>
                <div className="detail-row">
                  <span>Drip Percentage:</span>
                  <span>{dripInfo.percent}%</span>
                </div>
              </>
            )}
            {contractConstants && (
              <>
                <div className="detail-row">
                  <span>USDC Contract:</span>
                  <span>{formatAddress(contractConstants.usdcAddress)}</span>
                </div>
                <div className="detail-row">
                  <span>WHBAR Contract:</span>
                  <span>{formatAddress(contractConstants.whbarAddress)}</span>
                </div>
                <div className="detail-row">
                  <span>Router Address:</span>
                  <span>{formatAddress(contractConstants.routerAddress)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Half - Stats, Tabs and Actions */}
        <div className="vault-action-section">
          {/* 2x2 Stats Grid */}
          <div className="vault-stats-grid">
            <div className="stat-card">
              <div className="stat-label">Annual Percentage Rate</div>
              <div className="stat-value apr">
                {isLoadingData
                  ? "Loading..."
                  : vaultData
                  ? `${vaultData.apr}%`
                  : "N/A"}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Value Locked</div>
              <div className="stat-value">
                {isLoadingData
                  ? "Loading..."
                  : vaultData
                  ? `$${vaultData.totalSupply}`
                  : "N/A"}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Vault Balance</div>
              <div className="stat-value">
                {isLoadingData
                  ? "Loading..."
                  : vaultData
                  ? `${vaultData.vaultBalance} USDC`
                  : "N/A"}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Contract Address</div>
              <div className="stat-value">
                <a
                  href="https://hashscan.io/testnet/address/0xab298c8018b4e82b1f14cca2d558daca17870606"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {formatAddress("0xab298c8018b4e82b1f14cca2d558daca17870606")}
                </a>
              </div>
            </div>
          </div>

          {/* Action Tabs */}
          <div className="action-tabs">
            <button
              className={`tab ${activeTab === "deposit" ? "active" : ""}`}
              onClick={() => setActiveTab("deposit")}
            >
              Deposit
            </button>
            <button
              className={`tab ${activeTab === "withdraw" ? "active" : ""}`}
              onClick={() => setActiveTab("withdraw")}
            >
              Withdraw
            </button>
          </div>

          {/* Action Content */}
          <div className="action-content">
            {transactionState.isLoading && (
              <div className="transaction-status">
                <p>⏳ Processing transaction...</p>
                {transactionState.hash && (
                  <p>Hash: {formatAddress(transactionState.hash)}</p>
                )}
              </div>
            )}

            {transactionState.error && (
              <div className="transaction-error">
                <p>❌ {transactionState.error}</p>
                <button onClick={clearTransactionState}>Dismiss</button>
              </div>
            )}

            {activeTab === "deposit" ? (
              <div className="deposit-section">
                <div className="input-group">
                  <div className="input-header">
                    <label>Amount to Deposit</label>
                    <button className="max-button" onClick={handleMaxDeposit}>
                      Max: {maxDepositAmount.toFixed(2)}
                    </button>
                  </div>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    className="amount-input"
                    max={maxDepositAmount}
                  />
                </div>
                <Button
                  onClick={handleDeposit}
                  disabled={
                    !depositAmount ||
                    !isInitialized ||
                    parseFloat(depositAmount) > maxDepositAmount ||
                    transactionState.isLoading
                  }
                  className="action-button"
                >
                  {transactionState.isLoading
                    ? "Processing..."
                    : needsApproval(depositAmount)
                    ? "Approve & Deposit"
                    : "Deposit"}
                </Button>
              </div>
            ) : (
              <div className="withdraw-section">
                <div className="input-group">
                  <div className="input-header">
                    <label>Amount to Withdraw</label>
                    <button className="max-button" onClick={handleMaxWithdraw}>
                      Max: {maxWithdrawAmount.toFixed(2)}
                    </button>
                  </div>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="amount-input"
                    max={maxWithdrawAmount}
                  />
                </div>
                <Button
                  onClick={handleWithdraw}
                  disabled={
                    !withdrawAmount ||
                    !isInitialized ||
                    parseFloat(withdrawAmount) > maxWithdrawAmount ||
                    transactionState.isLoading
                  }
                  className="action-button"
                >
                  {transactionState.isLoading ? "Processing..." : "Withdraw"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaultDetail;
