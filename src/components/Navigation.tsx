import React from 'react';

const Navigation: React.FC = () => {
  return (
    <nav>
      <div className="nav-links">
        <a href="#">Overview</a>
        <a href="#">Solutions</a>
        <a href="#">Resources</a>
      </div>

      <div className="nav-buttons">
        <div className="btn secondary">
          <a href="#">Get Started</a>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 