import React from 'react';
import { Button } from '../UI';
import './WalletConnect.css';

interface WalletConnectProps {
  onConnect?: () => void;
  isConnected?: boolean;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ 
  onConnect, 
  isConnected = false 
}) => {
  return (
    <Button 
      variant="hover-fill"
      className="wallet-connect"
      onClick={onConnect}
    >
      {isConnected ? 'Connected' : 'Wallet Connect'}
    </Button>
  );
};

export default WalletConnect; 