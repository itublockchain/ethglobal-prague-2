export interface TradingCardData {
  id: string;
  asset: string;
  multiplier: string;
  type: 'Long' | 'Short';
  status: string;
}

export interface NavigationItem {
  label: string;
  href: string;
}

export interface ProviderLogo {
  name: string;
  icon: string;
} 