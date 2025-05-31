import React, { useEffect, useRef } from 'react';
import './Portfolio.css';

const Portfolio: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // TradingView Chart Script
    if (chartRef.current) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      script.type = 'text/javascript';
      script.async = true;
      script.innerHTML = JSON.stringify({
        width: "100%",
        height: "100%",
        symbol: "CRYPTO:BTCUSD",
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
        support_host: "https://www.tradingview.com"
      });

      chartRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="portfolio-page">
      {/* Main Content Area */}
      <div className="portfolio-main">
        {/* Left Side - Portfolio Cards */}
        <div className="portfolio-left">
          <div className="portfolio-cards">
            <div className="portfolio-card">
              <div className="portfolio-label">Total Value</div>
              <div className="portfolio-amount">$17.623,5</div>
            </div>
            
            <div className="portfolio-card">
              <div className="portfolio-label">Long</div>
              <div className="portfolio-amount">18</div>
            </div>

            <div className="portfolio-card">
              <div className="portfolio-label">Profit</div>
              <div className="portfolio-amount">$1.146,5</div>
            </div>
            
            <div className="portfolio-card">
              <div className="portfolio-label">Short</div>
              <div className="portfolio-amount">11</div>
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
                style={{ height: '100%', width: '100%' }}
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
          <h2>Positions</h2>
        </div>
        
        <div className="positions-table">
          <div className="table-header">
            <div className="header-cell vault-header">Vault</div>
            <div className="header-cell apr-header">APR</div>
            <div className="header-cell tvl-header">TVL</div>
            <div className="header-cell tvl-header">TVL</div>
            <div className="header-cell tvl-header">TVL</div>
          </div>

          <div className="table-body">
            {Array.from({ length: 4 }, (_, index) => (
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

export default Portfolio; 