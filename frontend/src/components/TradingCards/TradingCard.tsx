import React from 'react';
import './TradingCard.css';

interface TradingCardData {
  id: string;
  multiplier: string;
  type: 'Long' | 'Short';
  asset: string;
  status: string;
}

interface TradingCardProps {
  data: TradingCardData;
}

const TradingCard: React.FC<TradingCardProps> = ({ data }) => {
  // Sıra ile icon seçimi için
  const iconNumber = (parseInt(data.id) % 4) + 1;
  const iconPath = `/icon${iconNumber}.svg`;

  return (
    <div className={`trading-card ${data.type.toLowerCase()}`}>
      <div className="trading-card-header">
        <h3 className="trading-card-title">{data.status}</h3>
      </div>
      
      <div className="trading-card-content">
        <div className="trading-card-main">
          <div className="trading-card-asset-info">
            <div className="trading-card-asset">{data.asset} <span className="trading-card-multiplier">{data.multiplier}</span></div>
            <div className="trading-card-type">{data.type}</div>
          </div>
        </div>
        
        <div className="trading-card-character">
          <img src={iconPath} alt="Character" className="character-icon" />
        </div>
      </div>
    </div>
  );
};

export default TradingCard; 