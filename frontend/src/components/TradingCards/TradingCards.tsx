import React from 'react';
import TradingCard from './TradingCard';
import type { TradingCardData } from '../../types';

interface TradingCardsProps {
  cards: TradingCardData[];
}

const TradingCards: React.FC<TradingCardsProps> = ({ cards }) => {
  return (
    <section className="trading-cards-section">
      <div className="cards-container">
        {cards.map((card) => (
          <TradingCard key={card.id} data={card} />
        ))}
      </div>
    </section>
  );
};

export default TradingCards; 