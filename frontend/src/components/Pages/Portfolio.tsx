import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useHederaContract } from "../../hooks/useHederaContract";
import "./Portfolio.css";

const Portfolio: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { isConnected, vaultData, isLoadingData, formatAddress } =
    useHederaContract();

  useEffect(() => {
    // TradingView Chart Script
    if (chartRef.current) {
      const script = document.createElement("script");
      script.src =
        "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify({
        width: "100%",
        height: "100%",
        symbol: "CRYPTO:HBARUSD",
        backgroundColor: "transparent",
        interval: "D",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "3",
        locale: "en",
        enable_publishing: false,
        allow_symbol_change: false,
        calendar: false,
        hide_top_toolbar: true,
        hide_legend: true,
        save_image: false,
        support_host: "https://www.tradingview.com",
      });

      chartRef.current.appendChild(script);
    }
  }, []);

  // Calculate portfolio totals from real data
  const getPortfolioStats = () => {
    if (!vaultData || !isConnected) {
      return {
        totalValue: "0",
        deposited: "0",
        positions: 0,
        hasPositions: false,
      };
    }

    const depositedAmount = parseFloat(vaultData.userDeposited);
    const hasPositions = depositedAmount > 0;

    return {
      totalValue: vaultData.userDeposited,
      deposited: vaultData.userDeposited,
      positions: hasPositions ? 1 : 0,
      hasPositions,
    };
  };

  const portfolioStats = getPortfolioStats();

  const handleVaultClick = () => {
    // Navigate to the vault detail page
    // Using a generic vault ID since we only have one vault for now
    navigate("/vault/0.0.6092626");
  };

  // USDC Logo SVG Component
  const USDCLogo = () => (
    <img
      src={"https://www.svgrepo.com/show/367255/usdc.svg"}
      alt="USDC Logo"
      className="usdc-logo"
      width={24}
      height={24}
    />
  );

  return (
    <div className="portfolio-page">
      {/* Main Content Area */}
      <div className="portfolio-main">
        {/* Left Side - Portfolio Cards */}
        <div className="portfolio-left">
          <div className="portfolio-cards">
            <div className="portfolio-card">
              <div className="portfolio-label">Total Value</div>
              <div className="portfolio-amount">
                {portfolioStats.totalValue} USDC
              </div>
            </div>

            <div className="portfolio-card">
              <div className="portfolio-label">Active Positions</div>
              <div className="portfolio-amount">{portfolioStats.positions}</div>
            </div>

            <div className="portfolio-card">
              <div className="portfolio-label">USDC Balance</div>
              <div className="portfolio-amount">
                {isConnected && vaultData ? vaultData.userUsdcBalance : "0"}{" "}
                USDC
              </div>
            </div>

            <div className="portfolio-card">
              <div className="portfolio-label">Win Rate</div>
              <div className="portfolio-amount">68%</div>
            </div>
          </div>
        </div>

        {/* Right Side - Chart */}
        <div className="portfolio-right">
          <div className="chart-container">
            <div className="chart-widget">
              <div
                ref={chartRef}
                className="tradingview-widget-container"
                style={{ height: "100%", width: "100%" }}
              >
                <div className="tradingview-widget-container__widget"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Positions Table */}
      <div className="positions-container">
        <div className="positions-header">
          <h2>Your Positions</h2>
        </div>

        {!isConnected ? (
          <div className="no-positions">
            <p>Please connect your wallet to view your positions</p>
          </div>
        ) : isLoadingData ? (
          <div className="no-positions">
            <p>Loading positions...</p>
          </div>
        ) : !portfolioStats.hasPositions ? (
          <div className="no-positions">
            <p>No active positions found. Start by depositing into a vault!</p>
          </div>
        ) : (
          <div className="positions-table">
            <div className="table-header">
              <div className="header-cell vault-header">Vault</div>
              <div className="header-cell apr-header">APR</div>
              <div className="header-cell tvl-header">Your Deposit</div>
              <div className="header-cell tvl-header">Vault TVL</div>
              <div className="header-cell tvl-header">Contract</div>
            </div>

            <div className="table-body">
              {portfolioStats.hasPositions && (
                <div
                  className="table-row clickable-row"
                  onClick={handleVaultClick}
                >
                  <div className="table-cell vault-name">
                    <USDCLogo />
                    Hedera USDC Vault
                  </div>
                  <div className="table-cell apr-value">{vaultData?.apr}%</div>
                  <div className="table-cell tvl-value">
                    {vaultData?.userDeposited} USDC
                  </div>
                  <div className="table-cell tvl-value">
                    ${vaultData?.totalSupply}
                  </div>
                  <div className="table-cell tvl-percentage">
                    <a
                      href="https://hashscan.io/testnet/address/0xab298c8018b4e82b1f14cca2d558daca17870606"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contract-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {formatAddress(
                        "0xab298c8018b4e82b1f14cca2d558daca17870606"
                      )}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;
