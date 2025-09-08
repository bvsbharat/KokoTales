import React from 'react';

interface CuteBookIconProps {
  className?: string;
  'aria-hidden'?: boolean | string;
}

const CuteBookIcon: React.FC<CuteBookIconProps> = ({ className = "w-6 h-6", ...props }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      {...props}
    >
      {/* Book shadow */}
      <ellipse
        cx="50"
        cy="85"
        rx="25"
        ry="8"
        fill="rgba(0,0,0,0.1)"
      />
      
      {/* Book spine */}
      <rect
        x="20"
        y="25"
        width="8"
        height="50"
        fill="#8B4513"
        rx="2"
      />
      
      {/* Book cover */}
      <rect
        x="28"
        y="20"
        width="45"
        height="55"
        fill="#FF6B6B"
        rx="3"
        stroke="#E55555"
        strokeWidth="1"
      />
      
      {/* Book pages */}
      <rect
        x="30"
        y="22"
        width="41"
        height="51"
        fill="#FFFEF7"
        rx="2"
      />
      
      {/* Page lines */}
      <line x1="35" y1="30" x2="65" y2="30" stroke="#E0E0E0" strokeWidth="1"/>
      <line x1="35" y1="35" x2="60" y2="35" stroke="#E0E0E0" strokeWidth="1"/>
      <line x1="35" y1="40" x2="65" y2="40" stroke="#E0E0E0" strokeWidth="1"/>
      
      {/* Book bookmark */}
      <rect
        x="65"
        y="20"
        width="4"
        height="25"
        fill="#FFD93D"
        rx="1"
      />
      <polygon
        points="65,45 69,45 67,40"
        fill="#FFD93D"
      />
      
      {/* Eyes */}
      <circle
        cx="42"
        cy="50"
        r="6"
        fill="white"
        stroke="#333"
        strokeWidth="1"
      />
      <circle
        cx="58"
        cy="50"
        r="6"
        fill="white"
        stroke="#333"
        strokeWidth="1"
      />
      
      {/* Eye pupils */}
      <circle
        cx="43"
        cy="51"
        r="3"
        fill="#333"
      />
      <circle
        cx="59"
        cy="51"
        r="3"
        fill="#333"
      />
      
      {/* Eye highlights */}
      <circle
        cx="44"
        cy="49"
        r="1"
        fill="white"
      />
      <circle
        cx="60"
        cy="49"
        r="1"
        fill="white"
      />
      
      {/* Smile */}
      <path
        d="M 45 60 Q 50 65 55 60"
        stroke="#333"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Rosy cheeks */}
      <circle
        cx="35"
        cy="55"
        r="3"
        fill="#FFB6C1"
        opacity="0.6"
      />
      <circle
        cx="65"
        cy="55"
        r="3"
        fill="#FFB6C1"
        opacity="0.6"
      />
    </svg>
  );
};

export default CuteBookIcon;
