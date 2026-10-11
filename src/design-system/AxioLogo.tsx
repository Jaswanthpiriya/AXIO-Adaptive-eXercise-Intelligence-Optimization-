/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Official Brand Mark & Wordmark Component
 * Engineered to match the exact visual geometry from the official AXIO brand reference.
 */

import React from 'react';

interface AxioLogoProps {
  variant?: 'mark-only' | 'horizontal' | 'stacked' | 'tagline' | 'badge-dark' | 'badge-blue' | 'badge-white';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  theme?: 'dark' | 'light' | 'blue';
}

/**
 * High-precision SVG representation of the AXIO Brand Mark
 * Stylized chevron 'A' with athletic geometric asymmetry
 */
export function AxioMark({
  className = 'w-8 h-8',
  color = 'currentColor',
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="AXIO Brand Mark"
    >
      {/* Left Primary Diagonal Stroke */}
      <path
        d="M 12 88 L 47 16 L 62 16 L 27 88 Z"
        fill={color}
      />
      {/* Right Angular Stroke with Horizontal Kick (separated by kinetic gap) */}
      <path
        d="M 64 36 L 80 66 L 92 66 L 92 88 L 68 88 L 52 56 Z"
        fill={color}
      />
    </svg>
  );
}

/**
 * Geometric Wordmark: Λ X I O
 */
export function AxioWordmark({
  className = 'h-7',
  color = 'currentColor',
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 280 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="AXIO"
    >
      {/* Λ (Chevron A without crossbar) */}
      <path
        d="M 10 52 L 38 8 L 50 8 L 78 52 L 65 52 L 44 19 L 23 52 Z"
        fill={color}
      />
      {/* X */}
      <path
        d="M 88 8 L 102 8 L 118 30 L 134 8 L 148 8 L 125 39 L 149 52 L 135 52 L 118 38 L 101 52 L 87 52 L 111 32 Z"
        fill={color}
      />
      {/* I */}
      <path
        d="M 168 8 L 180 8 L 180 52 L 168 52 Z"
        fill={color}
      />
      {/* O (Geometric Oval with subtle horizontal flat) */}
      <path
        d="M 214 8 C 238 8 254 18 254 30 C 254 42 238 52 214 52 C 190 52 174 42 174 30 C 174 18 190 8 214 8 Z M 214 18 C 198 18 188 23 188 30 C 188 37 198 42 214 42 C 230 42 240 37 240 30 C 240 23 230 18 214 18 Z"
        fill={color}
      />
    </svg>
  );
}

export const AxioLogo: React.FC<AxioLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const textColor = isLight ? '#0B0B0D' : '#FFFFFF';
  const secondaryColor = isLight ? '#6B7280' : '#6B7280';
  const accentColor = '#0066FF';

  // Mark only
  if (variant === 'mark-only') {
    const sizeMap = {
      sm: 'w-6 h-6',
      md: 'w-9 h-9',
      lg: 'w-14 h-14',
      xl: 'w-24 h-24',
    };
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <AxioMark className={sizeMap[size]} color={textColor} />
      </div>
    );
  }

  // Brand in Action Badges (from the official brand sheet)
  if (variant === 'badge-dark') {
    return (
      <div className={`w-20 h-20 sm:w-24 sm:h-24 bg-[#0B0B0D] rounded-2xl flex items-center justify-center shadow-lg border border-white/10 ${className}`}>
        <AxioMark className="w-10 h-10 sm:w-12 sm:h-12" color="#FFFFFF" />
      </div>
    );
  }

  if (variant === 'badge-blue') {
    return (
      <div className={`w-20 h-20 sm:w-24 sm:h-24 bg-[#0066FF] rounded-2xl flex items-center justify-center shadow-lg shadow-[#0066FF]/25 ${className}`}>
        <AxioMark className="w-10 h-10 sm:w-12 sm:h-12" color="#FFFFFF" />
      </div>
    );
  }

  if (variant === 'badge-white') {
    return (
      <div className={`w-20 h-20 sm:w-24 sm:h-24 bg-[#FFFFFF] rounded-2xl flex items-center justify-center shadow-md border border-black/10 ${className}`}>
        <AxioMark className="w-10 h-10 sm:w-12 sm:h-12" color="#0B0B0D" />
      </div>
    );
  }

  // Full Brand Lockup with Tagline (as shown in the top banner of the brand sheet)
  if (variant === 'tagline') {
    return (
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-8 py-4 ${className}`}>
        {/* Left: Logo & Descriptor */}
        <div className="flex items-center gap-6 sm:gap-8">
          <AxioMark className="w-16 h-16 sm:w-20 sm:h-20 shrink-0" color={textColor} />
          <div className="flex flex-col">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-[0.25em] text-white">
              Λ X I O
            </span>
            <span className="text-[11px] sm:text-xs font-semibold tracking-[0.16em] uppercase text-zinc-300 mt-1 max-w-[280px] leading-tight">
              Universal Fitness &amp; Human Performance Platform
            </span>
          </div>
        </div>

        {/* Center Divider Line */}
        <div className="hidden lg:block w-[1px] h-16 bg-white/15" />

        {/* Right: Brand Promise / Value Proposition */}
        <div className="flex flex-col justify-center">
          <div className="text-xl sm:text-2xl font-medium tracking-tight text-white space-y-1">
            <p>Better Data.</p>
            <p>Smarter Training.</p>
            <p className="font-semibold">Higher Performance.</p>
          </div>
          {/* AXIO Blue accent underline bar */}
          <div className="w-12 h-1 bg-[#0066FF] rounded-full mt-3" />
        </div>
      </div>
    );
  }

  // Stacked Lockup
  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center gap-3 ${className}`}>
        <AxioMark className="w-16 h-16" color={textColor} />
        <span className="text-3xl font-extrabold tracking-[0.25em]" style={{ color: textColor }}>
          Λ X I O
        </span>
        <span
          className="text-xs font-semibold tracking-[0.14em] uppercase max-w-[260px] leading-tight"
          style={{ color: secondaryColor }}
        >
          Universal Fitness &amp; Human Performance Platform
        </span>
      </div>
    );
  }

  // Default: Horizontal Header Lockup
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14',
  };

  const textSizes = {
    sm: 'text-lg tracking-[0.2em]',
    md: 'text-xl tracking-[0.22em]',
    lg: 'text-2xl tracking-[0.25em]',
    xl: 'text-3xl tracking-[0.28em]',
  };

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <AxioMark className={`${iconSizes[size]} shrink-0`} color={textColor} />
      <div className="flex flex-col leading-none">
        <span className={`font-extrabold ${textSizes[size]}`} style={{ color: textColor }}>
          Λ X I O
        </span>
      </div>
    </div>
  );
};
