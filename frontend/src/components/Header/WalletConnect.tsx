import React from "react";
import { ConnectKitButton } from "connectkit";
import { useAccount } from "wagmi";
import "./WalletConnect.css";

const WalletConnect: React.FC = () => {
  const { isConnected } = useAccount();

  return (
    <div className="wallet-connect">
      <div className="wallet-connect-container">
        <ConnectKitButton showBalance={true} showAvatar={true} />

        {isConnected && <div className="network-selector"></div>}
      </div>
    </div>
  );
};

export default WalletConnect;
