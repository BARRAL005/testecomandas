import React from 'react';
import { motion } from 'motion/react';

interface PitStopLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export default function PitStopLogo({ size = 'md', className = '', showText = true }: PitStopLogoProps) {
  // Dimensions based on size preset
  const dimensions = {
    sm: { svg: 'w-16 h-16', title: 'text-base', subtitle: 'text-[9px]' },
    md: { svg: 'w-24 h-24', title: 'text-xl', subtitle: 'text-[11px]' },
    lg: { svg: 'w-36 h-36', title: 'text-3xl', subtitle: 'text-xs' },
    xl: { svg: 'w-48 h-48', title: 'text-4xl', subtitle: 'text-sm' },
  }[size];

  return (
    <motion.div 
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      whileHover={{ scale: 1.04 }}
      className={`flex flex-col items-center justify-center text-center select-none ${className}`}
    >
      {/* Dynamic Gold Badge SVG from the User's Image */}
      <motion.svg 
        id="pitstop-logo-svg"
        viewBox="0 0 200 200" 
        className={`${dimensions.svg} filter transition-all duration-300`}
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: "drop-shadow(0 4px 12px rgba(217,119,6,0.15))"
        }}
      >
        {/* Background Oval Shape (Brilliant Brand Gold) */}
        <ellipse cx="100" cy="90" rx="75" ry="46" fill="#dfb147" />
        
        {/* White Top Foam Wave Arc cutting the upper part of the ellipse */}
        <path 
          d="M 28 80 C 50 60, 75 50, 100 50 C 125 50, 150 60, 172 80 C 150 48, 125 43, 100 43 C 75 43, 50 48, 28 80 Z" 
          fill="#ffffff" 
          opacity="0.95"
        />
        
        {/* Central Black Base Circle */}
        <circle cx="100" cy="95" r="42" fill="#111827" />
        
        {/* Diamond Frame with Rounded Corners */}
        <path 
          d="M 100 63 L 132 95 L 100 127 L 68 95 Z" 
          stroke="#dfb147" 
          strokeWidth="4" 
          strokeLinejoin="round" 
        />
        
        {/* The White/Gold Beer Bottle */}
        <g 
          id="beer-bottle"
          style={{ transformOrigin: "100px 115px" }}
        >
          {/* Bottle Backing Shadow and Glass Outline */}
          <path 
            d="M 92 121 C 92 125, 108 125, 108 121 L 108 77 C 108 76, 103 72, 103 66 L 103 51 C 105 51, 105 48, 105 48 L 95 48 C 95 48, 95 51, 97 51 L 97 66 C 97 72, 92 76, 92 77 Z" 
            fill="#111827" 
            stroke="#ffffff" 
            strokeWidth="3.5" 
            strokeLinejoin="round"
          />
          
          {/* Liquid highlight / Fill inside the bottle */}
          <path 
            d="M 94 116 L 106 116 L 106 82 L 94 82 Z" 
            fill="#dfb147" 
            opacity="0.95"
          />

          {/* White Glossy highlight overlay curve down left edge of bottle */}
          <path 
            d="M 96 114 L 96 82 C 96 79, 98 76, 98 72 L 98 55" 
            stroke="#ffffff" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            opacity="0.95"
          />
          
          {/* Horizontal lines representing bottle details (neck/rings) */}
          <line x1="97" y1="56" x2="103" y2="56" stroke="#ffffff" strokeWidth="2" />
          <line x1="94" y1="112" x2="106" y2="112" stroke="#111827" strokeWidth="2.5" />
          
          {/* Bottom base curve rim */}
          <path d="M 93 118 Q 100 121 107 118" stroke="#ffffff" strokeWidth="2.5" fill="none" />
        </g>
      </motion.svg>

      {/* Styled text matching the italic oblique brand look */}
      {showText && (
        <div className="mt-2 flex flex-col items-center">
          <h2 className={`font-display font-black tracking-tighter uppercase italic leading-none flex items-center justify-center ${dimensions.title}`}>
            <span className="text-white">Pit</span>
            <span className="text-amber-500 ml-1">Stop</span>
          </h2>
          
          {/* Space-lettered blocky sub-header for COHAB */}
          <span 
            className={`font-mono font-black tracking-[0.35em] uppercase block text-center italic text-amber-500/90 mt-1 ${dimensions.subtitle}`}
          >
            COHAB
          </span>
        </div>
      )}
    </motion.div>
  );
}
