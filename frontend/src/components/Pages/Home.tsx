import React from 'react';
import HeroSection from '../HeroSection/HeroSection';
import TradingCards from '../TradingCards/TradingCards';
import SponsorsStrip from '../SponsorsStrip';
import { useMockData } from '../../hooks/useMockData';

const Home: React.FC = () => {
  const { tradingCards } = useMockData();

  return (
    <>
      <HeroSection />
      <TradingCards cards={tradingCards} />
      <SponsorsStrip />
    </>
  );
};

export default Home; 