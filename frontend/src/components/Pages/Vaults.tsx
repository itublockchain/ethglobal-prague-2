import React, { useState } from 'react';
import './Vaults.css';

const Vaults: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'system' | 'user'>('user');

  return (
    <div className="vaults-page">
      {/* Total Value Locked Card */}
      <div className="tvl-card">
        <div className="tvl-label">Total Value Locked</div>
        <div className="tvl-amount">$123,456</div>
      </div>

      {/* Vaults Table Section */}
      <div className="vaults-table-container">
        {/* Tab Navigation */}
        <div className="vaults-tabs">
          <button 
            className={`tab-button ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            System Vaults
          </button>
          <button 
            className={`tab-button ${activeTab === 'user' ? 'active' : ''}`}
            onClick={() => setActiveTab('user')}
          >
            User Vaults
          </button>
        </div>

        {/* Table */}
        <div className="vaults-table">
          <div className="table-header">
            <div className="header-cell vault-name-header">Vault</div>
            <div className="header-cell apr-header">
              APR 
              <span className="sort-arrow">↑</span>
            </div>
            <div className="header-cell tvl-header">TVL</div>
            <div className="header-cell tvl-header">TVL</div>
            <div className="header-cell tvl-header">TVL</div>
          </div>

          <div className="table-body">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="table-row">
                <div className="table-cell vault-name">Vault Name</div>
                <div className="table-cell apr-value">5,7%</div>
                <div className="table-cell tvl-value">$394,939</div>
                <div className="table-cell tvl-value">$394,939</div>
                <div className="table-cell tvl-percentage">17%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Vaults; 