/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Button Primitive
 * Adheres to zero-pill discipline, single-line controls, and WCAG AA contrast.
 */

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 ease-out rounded-lg whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0B0D] disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'h-9 px-3.5 py-1.5 text-xs font-semibold gap-1.5 tracking-normal',
    md: 'h-10 px-4 py-2 text-sm font-semibold gap-2 tracking-normal',
    lg: 'h-12 px-6 py-3 text-base font-semibold gap-2.5 tracking-normal',
  };

  const variantStyles = {
    primary:
      'bg-gradient-to-b from-[#0066FF] to-[#0052D4] hover:from-[#1A75FF] hover:to-[#005AE0] text-[#FFFFFF] shadow-[0_1px_3px_rgba(0,0,0,0.5),0_0_14px_rgba(0,102,255,0.22)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.6),0_0_22px_rgba(0,102,255,0.36)] border border-[#0066FF]/80',
    secondary:
      'bg-[#13151D] text-[#FFFFFF] hover:bg-[#191B26] border border-white/[0.08] hover:border-white/[0.18] shadow-sm',
    outline:
      'bg-transparent text-[#0066FF] hover:text-white border border-[#0066FF]/60 hover:border-[#0066FF] hover:bg-[#0066FF]/15 transition-all',
    ghost:
      'bg-transparent text-zinc-400 hover:text-[#FFFFFF] hover:bg-white/[0.06] border border-transparent transition-colors',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        iconLeft
      )}
      <span className="truncate">{children}</span>
      {!isLoading && iconRight}
    </button>
  );
};
