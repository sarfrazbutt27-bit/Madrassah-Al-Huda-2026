import React from 'react';

const LogoIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 100 120" className={className} fill="currentColor">
    {/* Shield Shape */}
    <path d="M50 0 C 20 0, 10 10, 10 40 C 10 80, 20 100, 50 120 C 80 100, 90 80, 90 40 C 90 10, 80 0, 50 0 Z" />
    {/* Book Outline (White) */}
    <path d="M25 45 Q 50 35 75 45 V 85 Q 50 75 25 85 Z" fill="white" />
    <path d="M50 45 V 80" stroke="currentColor" strokeWidth="1" />
    {/* Quill (Feder) */}
    <path d="M70 35 C 65 45, 50 65, 45 75 L 43 78 L 47 75 C 55 65, 68 40, 70 35 Z" fill="white" />
  </svg>
);

export default LogoIcon;