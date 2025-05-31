import { useState } from 'react';
import type { TradingCardData, NavigationItem } from '../types';

export const useMockData = () => {
  const [navigationItems] = useState<NavigationItem[]>([
    { label: 'Vaults', href: '/vaults' },
    { label: 'Portfolio', href: '/portfolio' }
  ]);

  const [tradingCards] = useState<TradingCardData[]>([
    {
      id: '1',
      asset: 'ETH',
      multiplier: '10x',
      type: 'Long',
      status: 'Trump announces crypto-friendly policies.'
    },
    {
      id: '2',
      asset: 'BTC',
      multiplier: '20x',
      type: 'Short',
      status: 'SEC hints at stricter Bitcoin ETF rules.'
    },
    {
      id: '3',
      asset: 'SOL',
      multiplier: '15x',
      type: 'Long',
      status: 'Solana ecosystem growth accelerates significantly.'
    },
    {
      id: '4',
      asset: 'ADA',
      multiplier: '25x',
      type: 'Short',
      status: 'Cardano faces delayed upgrade concerns.'
    }
  ]);

  return {
    navigationItems,
    tradingCards
  };
}; 