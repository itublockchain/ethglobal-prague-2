import React from 'react';
import { Link } from 'react-router-dom';

const Logo: React.FC = () => {
  return (
    <Link to="/" className="logo">
      <div className="logo-icon">
        <img src="/logo.svg" alt="Logo" />
      </div>
    </Link>
  );
};

export default Logo; 