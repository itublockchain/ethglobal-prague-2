import React from 'react';

interface HeroSectionProps {
  title?: string;
  description?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ 
  title = "If you know you know.",
  description = "Lorem ipsum zirvanası about this project. Lorem ipsum zirvanası about this project. Lorem ipsum zirvanası about this project."
}) => {
  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-title">{title}</h1>
          <p className="hero-description">{description}</p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 