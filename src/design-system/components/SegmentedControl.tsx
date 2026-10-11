/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO SegmentedControl Primitive
 * Interactive functional control for viewports, time horizons, and metric filtering.
 */

import React from 'react';

export interface SegmentOption<T extends string = string> {
  id: T;
  label: string;
  count?: number | string;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  className = '',
}: SegmentedControlProps<T>) {
  const sizeClasses = {
    sm: 'p-1 text-xs gap-1',
    md: 'p-1 text-sm gap-1',
  };

  const itemPadding = {
    sm: 'px-2.5 py-1',
    md: 'px-3.5 py-1.5',
  };

  return (
    <div
      role="tablist"
      className={`inline-flex items-center bg-[#0E1016] border border-white/[0.08] rounded-lg ${sizeClasses[size]} ${className}`}
    >
      {options.map((opt) => {
        const isSelected = opt.id === value;
        return (
          <button
            key={opt.id}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(opt.id)}
            className={`font-medium rounded-md transition-all duration-150 ease-out whitespace-nowrap shrink-0 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF] ${
              itemPadding[size]
            } ${
              isSelected
                ? 'bg-[#0066FF] text-[#FFFFFF] font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.4),0_0_12px_rgba(0,102,255,0.22)]'
                : 'text-zinc-400 hover:text-[#FFFFFF] hover:bg-white/[0.05]'
            }`}
          >
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={`font-sans font-medium text-[11px] tabular-nums ${
                  isSelected ? 'text-white/90' : 'text-zinc-500'
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
