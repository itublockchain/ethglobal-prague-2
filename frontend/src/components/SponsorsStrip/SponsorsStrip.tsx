import React from 'react';
import './SponsorsStrip.css';

const SponsorsStrip: React.FC = () => {
  const sponsors = [
    { name: 'Hedera', logo: '/hedera.svg' },
    { name: 'VLayer', logo: '/vlayer.svg' },
  ];

  return (
    <div className="sponsors-strip">
      <div className="sponsors-track">
        {Array.from({ length: 30 }, (_, setIndex) => 
          sponsors.map((sponsor, index) => (
            <div key={`${setIndex}-${index}`} className="sponsor-item">
              <img src={sponsor.logo} alt={sponsor.name} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SponsorsStrip; 