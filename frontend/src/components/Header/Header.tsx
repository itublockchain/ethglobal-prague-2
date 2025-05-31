import React from 'react';
import Logo from './Logo';
import Navigation from './Navigation';
import WalletConnect from './WalletConnect';
import type { NavigationItem } from '../../types';

interface HeaderProps {
  navigationItems: NavigationItem[];
  onWalletConnect?: () => void;
  isWalletConnected?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  navigationItems, 
  onWalletConnect, 
  isWalletConnected 
}) => {
  return (
    <header className="header">
      <div className="header-container">
        <Logo />
        <Navigation items={navigationItems} />
        <WalletConnect 
          onConnect={onWalletConnect}
          isConnected={isWalletConnected}
        />
      </div>
    </header>
  );
};

export default Header; 