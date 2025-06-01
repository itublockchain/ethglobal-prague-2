import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Vaults.css";

interface VaultData {
  logo: string;
  id: string;
  name: string;
  contractAddress: string;
  apr: string;
  tvl: string;
  withdrawalRate: string;
  isReal: boolean;
}

const Vaults: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"system" | "user">("system");
  const navigate = useNavigate();

  const vaultData: VaultData[] = [
    {
      logo: "https://www.svgrepo.com/show/367255/usdc.svg",
      id: "hedera-usdc-vault",
      name: "Hedera USDC Vault",
      contractAddress: "0.0.6092626",
      apr: "5.7%",
      tvl: "$5,213",
      withdrawalRate: "17%",
      isReal: true,
    },
    {
      logo: "https://static-00.iconduck.com/assets.00/hedera-hashgraph-hbar-icon-512x512-hlzihq2p.png",
      id: "mock-hbar-vault",
      name: "Mock HBAR Vault",
      contractAddress: "0.0.1234567",
      apr: "0%",
      tvl: "$0",
      withdrawalRate: "0%",
      isReal: false,
    },
  ];

  const handleVaultClick = (vaultId: string) => {
    navigate(`/vault/${vaultId}`);
  };

  return (
    <div className="vaults-page">
      {/* Total Value Locked Card */}
      <div className="tvl-card">
        <div className="tvl-label">Total Value Locked</div>
        <div className="tvl-amount">
          $
          {vaultData.reduce(
            (sum, vault) => sum + Number(vault.tvl.replace(/[^0-9.]/g, "")),
            0
          )}
        </div>
      </div>

      {/* Vaults Table Section */}
      <div className="vaults-table-container">
        {/* Tab Navigation */}
        <div className="vaults-tabs">
          <button
            className={`tab-button ${activeTab === "user" ? "active" : ""}`}
            onClick={() => setActiveTab("user")}
          >
            User Vaults
          </button>
        </div>

        {/* Table */}
        <div className="vaults-table">
          <div className="table-header">
            <div className="header-cell vault-name-header">Vault</div>
            <div className="header-cell contract-address-header">CA</div>
            <div className="header-cell apr-header">
              APR
              <span className="sort-arrow">↑</span>
            </div>
            <div className="header-cell tvl-header">TVL</div>
            <div className="header-cell tvl-header">%WR</div>
          </div>

          <div className="table-body">
            {vaultData.map((vault) => (
              <div
                key={vault.id}
                className={`table-row ${
                  vault.isReal ? "real-vault" : "mock-vault"
                } clickable-row`}
                onClick={() => handleVaultClick(vault.id)}
                title={vault.isReal ? "Live Vault" : "Mock Vault"}
              >
                <div className="table-cell vault-name">
                  <img
                    src={vault.logo}
                    alt="Vault Logo"
                    width={24}
                    height={24}
                  />
                  {vault.name}
                </div>
                <div className="table-cell contract-address">
                  {vault.contractAddress}
                </div>
                <div className="table-cell apr-value">{vault.apr}</div>
                <div className="table-cell tvl-value">{vault.tvl}</div>
                <div className="table-cell tvl-percentage">
                  {vault.withdrawalRate}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Vaults;
