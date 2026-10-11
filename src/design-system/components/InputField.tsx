/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO InputField Primitive
 */

import React from 'react';

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  unitSuffix?: string;
  helperText?: string;
  error?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  unitSuffix,
  helperText,
  error,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[11px] font-semibold text-zinc-400 tracking-normal uppercase"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <input
          id={inputId}
          className={`w-full bg-[#0F1017] text-white text-sm px-3.5 py-2.5 rounded-lg border transition-all duration-150 font-sans placeholder:text-zinc-500 focus:outline-none ${
            error
              ? 'border-rose-500/80 focus:border-rose-400 focus:ring-1 focus:ring-rose-500/30'
              : 'border-white/[0.08] hover:border-white/[0.16] focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]/40'
          } ${unitSuffix ? 'pr-12' : ''} ${className}`}
          {...props}
        />

        {unitSuffix && (
          <span className="absolute right-3 font-sans text-xs text-zinc-500 pointer-events-none select-none">
            {unitSuffix}
          </span>
        )}
      </div>

      {(error || helperText) && (
        <span
          className={`text-[11px] font-sans ${
            error ? 'text-rose-400 font-medium' : 'text-zinc-500'
          }`}
        >
          {error || helperText}
        </span>
      )}
    </div>
  );
};
