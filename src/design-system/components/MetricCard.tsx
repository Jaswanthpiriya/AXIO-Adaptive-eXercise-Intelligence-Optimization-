/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO MetricCard Primitive
 * Sports-tech telemetry card with tabular numerals and zero-pill metadata discipline.
 */

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface MetricCardProps {
  label: string;
  category?: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  sparklineData?: number[];
  benchmark?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  category,
  value,
  unit,
  trend,
  sparklineData = [0, 0],
  benchmark,
  className = '',
}) => {
  // Generate sparkline path safely (No fake default data)
  const isZeroData = !sparklineData || sparklineData.length < 2 || sparklineData.every((v) => v === 0);
  const min = isZeroData ? 0 : Math.min(...sparklineData);
  const max = isZeroData ? 1 : Math.max(...sparklineData);
  const range = max - min || 1;
  const width = 120;
  const height = 36;

  const points = isZeroData
    ? [`0,${height - 4}`, `${width},${height - 4}`]
    : sparklineData.map((val, idx) => {
        const x = (idx / (sparklineData.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 8) - 4;
        return `${x},${y}`;
      });
  const pathD = `M ${points.join(' L ')}`;
  const areaD = isZeroData
    ? ''
    : `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;

  return (
    <div
      className={`bg-[#11131A] hover:bg-[#151722] border border-white/[0.07] hover:border-white/[0.16] transition-all duration-200 ease-out rounded-xl p-5 sm:p-6 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.45),0_0_1px_rgba(255,255,255,0.1)] ${className}`}
    >
      {/* Top: Clean unboxed metadata */}
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-1.5 font-medium tracking-normal text-xs">
          {category && (
            <>
              <span className="text-[#0066FF] font-semibold">{category}</span>
              <span aria-hidden="true" className="text-white/20">·</span>
            </>
          )}
          <span className="text-zinc-300 font-medium">{label}</span>
        </div>

        {benchmark && (
          <span className="font-sans text-xs text-zinc-400 tabular-nums font-medium">
            TARGET {benchmark}
          </span>
        )}
      </div>

      {/* Center: Hero Value with Tabular Numerals */}
      <div className="my-4 flex items-baseline gap-2">
        <span className="font-sans text-3xl sm:text-4xl font-bold tracking-tight text-[#FFFFFF] tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="font-sans text-sm sm:text-base font-normal text-zinc-400">
            {unit}
          </span>
        )}
      </div>

      {/* Bottom: Trend & Sparkline */}
      <div className="flex items-end justify-between pt-2.5 border-t border-white/[0.06]">
        {trend ? (
          <div className="flex items-center gap-1.5 text-xs">
            {trend.direction === 'up' && (
              <ArrowUpRight className="w-3.5 h-3.5 text-[#0066FF]" />
            )}
            {trend.direction === 'down' && (
              <ArrowDownRight className="w-3.5 h-3.5 text-zinc-400" />
            )}
            {trend.direction === 'neutral' && (
              <Minus className="w-3.5 h-3.5 text-zinc-500" />
            )}
            <span className="font-sans font-medium text-white tabular-nums">
              {trend.value}
            </span>
            {trend.label && (
              <span className="text-zinc-400 text-[11px]">
                {trend.label}
              </span>
            )}
          </div>
        ) : (
          <div />
        )}

        {/* Crisp SVG Sparkline */}
        <div className="w-[120px] h-[36px] overflow-hidden">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full overflow-visible"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={`grad-${label.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0066FF" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0066FF" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {areaD && (
              <path
                d={areaD}
                fill={`url(#grad-${label.replace(/\s+/g, '')})`}
              />
            )}
            <path
              d={pathD}
              fill="none"
              stroke={isZeroData ? 'rgba(255,255,255,0.1)' : '#0066FF'}
              strokeWidth={isZeroData ? '1.5' : '2'}
              strokeDasharray={isZeroData ? '3 3' : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
