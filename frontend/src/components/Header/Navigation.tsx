import React from 'react';
import { Link } from 'react-router-dom';
import type { NavigationItem } from '../../types';

interface NavigationProps {
  items: NavigationItem[];
}

const Navigation: React.FC<NavigationProps> = ({ items }) => {
  return (
    <nav className="navigation">
      <ul className="navigation-list">
        {items.map((item, index) => (
          <li key={index} className="navigation-item">
            <Link to={item.href} className="navigation-link">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navigation; 