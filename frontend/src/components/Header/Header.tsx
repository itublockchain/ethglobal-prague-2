import React from "react";
import Logo from "./Logo";
import Navigation from "./Navigation";
import WalletConnect from "./WalletConnect";
import type { NavigationItem } from "../../types";

interface HeaderProps {
  navigationItems: NavigationItem[];
}

const Header: React.FC<HeaderProps> = ({ navigationItems }) => {
  return (
    <header className="header">
      <div className="header-container">
        <Logo />
        <Navigation items={navigationItems} />
        <WalletConnect />
      </div>
    </header>
  );
};

export default Header;
