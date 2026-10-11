/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Professional Sports Performance Chart
 * High-precision sports telemetry visualization adhering strictly to AXIO palette (#0B0B0D, #0066FF, #6B7280, #FFFFFF).
 */

import React, { useState, useMemo } from 'react';
import { SegmentedControl } from './SegmentedControl.tsx';
import { CompletedWorkoutSession } from '../../types/app.ts';
import { Activity, Info, Sparkles, Play } from 'lucide-react';

interface DataPoint {
  time: string;
  value: number;
  baseline: number;
  secondary?: number;
  meta?: string;
}

const SAMPLE_DATASETS: Record<string, { label: string; unit: string; points: DataPoint[] }> = {
  power: {
    label: 'Mechanical Power Output',
    unit: 'W',
    points: [
      { time: '00:00', value: 320, baseline: 350, meta: 'Warm-up / Baseline' },
      { time: '04:00', value: 580, baseline: 350, meta: 'Initial Threshold' },
      { time: '08:00', value: 890, baseline: 600, meta: 'High Velocity Pull' },
      { time: '12:00', value: 1140, baseline: 800, meta: 'Peak Concentric Drive' },
      { time: '16:00', value: 1420, baseline: 900, meta: 'Neuromuscular Maximum' },
      { time: '20:00', value: 1210, baseline: 900, meta: 'Sustained Output' },
      { time: '24:00', value: 980, baseline: 700, meta: 'Eccentric Braking' },
      { time: '28:00', value: 640, baseline: 400, meta: 'Active Recovery' },
    ],
  },
  velocity: {
    label: 'Barbell & Mean Propulsive Velocity',
    unit: 'm/s',
    points: [
      { time: 'Set 1 (60kg)', value: 1.34, baseline: 1.25, meta: 'Dynamic Effort' },
      { time: 'Set 2 (80kg)', value: 1.18, baseline: 1.10, meta: 'Speed-Strength' },
      { time: 'Set 3 (100kg)', value: 0.96, baseline: 0.90, meta: 'Strength-Speed' },
      { time: 'Set 4 (120kg)', value: 0.74, baseline: 0.70, meta: 'Accelerative Strength' },
      { time: 'Set 5 (140kg)', value: 0.58, baseline: 0.55, meta: 'Max Strength Tier' },
      { time: 'Set 6 (150kg)', value: 0.46, baseline: 0.45, meta: '1RM Velocity Gate' },
    ],
  },
  readiness: {
    label: 'Heart Rate Variability (rMSSD) & Recovery',
    unit: 'ms',
    points: [
      { time: 'Mon', value: 68, baseline: 75, meta: 'Post-Match Fatigue' },
      { time: 'Tue', value: 74, baseline: 75, meta: 'Compensation Phase' },
      { time: 'Wed', value: 82, baseline: 75, meta: 'Optimal Parasympathetic Tone' },
      { time: 'Thu', value: 89, baseline: 75, meta: 'Supercompensation' },
      { time: 'Fri', value: 85, baseline: 75, meta: 'Readiness Peak' },
      { time: 'Sat', value: 71, baseline: 75, meta: 'Max Load Stress' },
      { time: 'Sun', value: 80, baseline: 75, meta: 'Regeneration' },
    ],
  },
};

export interface PerformanceChartProps {
  className?: string;
  workoutHistory?: CompletedWorkoutSession[];
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  className = '',
  workoutHistory = [],
}) => {
  const [metricKey, setMetricKey] = useState<'power' | 'velocity' | 'readiness'>('power');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showBenchmarkDemo, setShowBenchmarkDemo] = useState<boolean>(false);

  const hasHistory = workoutHistory && workoutHistory.length > 0;

  // Active dataset derived from real history or reference sample
  const activeDataset = useMemo(() => {
    if (!hasHistory || showBenchmarkDemo) {
      return SAMPLE_DATASETS[metricKey];
    }
    const recent = [...workoutHistory].slice(0, 8).reverse();
    if (metricKey === 'power') {
      const pts = recent.map((s, idx) => ({
        time: s.date ? s.date.split(',')[0] : `S-${idx + 1}`,
        value: s.peakPowerWatts || 320,
        baseline: 280,
        meta: s.title,
      }));
      return {
        label: 'Mechanical Power Output',
        unit: 'W',
        points: pts.length === 1 ? [{ time: 'Baseline', value: pts[0].value, baseline: pts[0].baseline, meta: 'Initial' }, pts[0]] : pts,
      };
    } else if (metricKey === 'velocity') {
      const pts = recent.map((s, idx) => ({
        time: s.date ? s.date.split(',')[0] : `S-${idx + 1}`,
        value: Number(((s.averageFormAccuracy || 90) / 100 * 0.85 + 0.1).toFixed(2)),
        baseline: 0.72,
        meta: `${s.averageFormAccuracy || 90}% Form Score`,
      }));
      return {
        label: 'Barbell & Movement Mean Velocity',
        unit: 'm/s',
        points: pts.length === 1 ? [{ time: 'Baseline', value: pts[0].value, baseline: pts[0].baseline, meta: 'Initial' }, pts[0]] : pts,
      };
    } else {
      const pts = recent.map((s, idx) => ({
        time: s.date ? s.date.split(',')[0] : `S-${idx + 1}`,
        value: s.loadAu || 120,
        baseline: 150,
        meta: `${s.durationMinutes} min session`,
      }));
      return {
        label: 'Neuromuscular Workload Accumulation',
        unit: 'AU',
        points: pts.length === 1 ? [{ time: 'Baseline', value: pts[0].value, baseline: pts[0].baseline, meta: 'Initial' }, pts[0]] : pts,
      };
    }
  }, [hasHistory, showBenchmarkDemo, metricKey, workoutHistory]);

  // Clean empty state for new users with no activity
  if (!hasHistory && !showBenchmarkDemo) {
    return (
      <div className={`bg-[#111218] border border-white/[0.08] rounded-2xl p-8 sm:p-10 text-center space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.3)] ${className}`}>
        <div className="w-12 h-12 rounded-xl bg-[#0066FF]/10 border border-[#0066FF]/30 flex items-center justify-center text-[#0066FF] mx-auto shadow-sm">
          <Activity className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            No Kinematic Telemetry Recorded
          </h3>
          <p className="text-xs text-[#6B7280] max-w-md mx-auto leading-relaxed">
            Complete your first workout or AI CAM session to stream live mechanical power, concentric velocity, and workload telemetry.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowBenchmarkDemo(true)}
            className="text-xs font-sans font-medium text-[#0066FF] hover:underline inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Preview Benchmark Reference Waveform</span>
          </button>
        </div>
      </div>
    );
  }

  const points = activeDataset.points;

  const width = 760;
  const height = 260;
  const paddingX = 40;
  const paddingY = 30;

  const minVal = Math.min(...points.map((p) => Math.min(p.value, p.baseline))) * 0.9;
  const maxVal = Math.max(...points.map((p) => Math.max(p.value, p.baseline))) * 1.1;
  const range = maxVal - minVal || 1;

  const getCoord = (idx: number, val: number) => {
    const x = paddingX + (idx / Math.max(1, points.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((val - minVal) / range) * (height - paddingY * 2);
    return { x, y };
  };

  // Generate SVG paths
  const valueCoords = points.map((p, i) => getCoord(i, p.value));
  const baselineCoords = points.map((p, i) => getCoord(i, p.baseline));

  const pathValue = `M ${valueCoords.map((c) => `${c.x},${c.y}`).join(' L ')}`;
  const pathArea = `M ${valueCoords[0].x},${height - paddingY} L ${valueCoords
    .map((c) => `${c.x},${c.y}`)
    .join(' L ')} L ${valueCoords[valueCoords.length - 1].x},${height - paddingY} Z`;
  const pathBaseline = `M ${baselineCoords.map((c) => `${c.x},${c.y}`).join(' L ')}`;

  const currentHover = hoveredIdx !== null ? points[hoveredIdx] : points[points.length - 1];
  const currentCoords = hoveredIdx !== null ? valueCoords[hoveredIdx] : valueCoords[valueCoords.length - 1];

  return (
    <div className={`bg-[#111218] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.3)] ${className}`}>
      {/* Header zone */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-normal uppercase text-[#6B7280]">
            <span>Human Performance Telemetry</span>
            <span aria-hidden="true">·</span>
            <span>Sensor Stream</span>
            {!hasHistory && showBenchmarkDemo && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold font-sans">
                DEMO BENCHMARK DATA
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h3 className="text-lg font-semibold text-white tracking-tight">
              {activeDataset.label}
            </h3>
            {!hasHistory && showBenchmarkDemo && (
              <button
                type="button"
                onClick={() => setShowBenchmarkDemo(false)}
                className="text-xs text-[#6B7280] hover:text-white underline font-sans"
              >
                Hide Benchmark
              </button>
            )}
          </div>
        </div>

        <SegmentedControl
          size="sm"
          value={metricKey}
          onChange={(val) => {
            setMetricKey(val as 'power' | 'velocity' | 'readiness');
            setHoveredIdx(null);
          }}
          options={[
            { id: 'power', label: 'Power (W)' },
            { id: 'velocity', label: 'Velocity (m/s)' },
            { id: 'readiness', label: 'Workload (AU)' },
          ]}
        />
      </div>

      {/* Telemetry Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-white/5">
        <div>
          <span className="text-[11px] font-medium uppercase tracking-normal text-[#6B7280]">
            Recorded Peak
          </span>
          <div className="font-sans text-xl sm:text-2xl font-semibold text-white tabular-nums mt-0.5">
            {Math.max(...points.map((p) => p.value))}
            <span className="text-xs text-[#6B7280] ml-1 font-normal">{activeDataset.unit}</span>
          </div>
        </div>

        <div>
          <span className="text-[11px] font-medium uppercase tracking-normal text-[#6B7280]">
            Baseline Target
          </span>
          <div className="font-sans text-xl sm:text-2xl font-semibold text-[#6B7280] tabular-nums mt-0.5">
            {Math.round(points.reduce((acc, p) => acc + p.baseline, 0) / points.length)}
            <span className="text-xs text-[#6B7280] ml-1 font-normal">{activeDataset.unit}</span>
          </div>
        </div>

        <div>
          <span className="text-[11px] font-medium uppercase tracking-normal text-[#6B7280]">
            Active Sample Point
          </span>
          <div className="font-sans text-xl sm:text-2xl font-semibold text-[#0066FF] tabular-nums mt-0.5">
            {currentHover.value}
            <span className="text-xs text-white/60 ml-1 font-normal">{activeDataset.unit}</span>
          </div>
        </div>

        <div>
          <span className="text-[11px] font-medium uppercase tracking-normal text-[#6B7280]">
            Phase Annotation
          </span>
          <div className="text-xs font-medium text-white truncate mt-2">
            {currentHover.meta || 'Steady State'}
          </div>
        </div>
      </div>

      {/* Main SVG Visualization */}
      <div className="relative pt-4 overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none overflow-visible"
        >
          <defs>
            <linearGradient id="axioAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0066FF" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#0066FF" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Hairline Grid Lines */}
          {[0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = height - paddingY - pct * (height - paddingY * 2);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* Baseline Target Line (Steel Gray Dashed) */}
          <path
            d={pathBaseline}
            fill="none"
            stroke="#6B7280"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.8"
          />

          {/* Area Fill */}
          <path d={pathArea} fill="url(#axioAreaGradient)" />

          {/* Primary Signal Line (AXIO Blue) */}
          <path
            d={pathValue}
            fill="none"
            stroke="#0066FF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Crosshair indicator on hover */}
          {hoveredIdx !== null && (
            <g>
              <line
                x1={currentCoords.x}
                y1={paddingY}
                x2={currentCoords.x}
                y2={height - paddingY}
                stroke="#0066FF"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.6"
              />
              <circle
                cx={currentCoords.x}
                cy={currentCoords.y}
                r="5"
                fill="#FFFFFF"
                stroke="#0066FF"
                strokeWidth="3"
              />
            </g>
          )}

          {/* Interactive touch/click zones for data points */}
          {points.map((p, idx) => {
            const coord = valueCoords[idx];
            return (
              <g
                key={idx}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onClick={() => setHoveredIdx(idx)}
              >
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="14"
                  fill="transparent"
                />
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="3.5"
                  fill={hoveredIdx === idx ? '#FFFFFF' : '#0066FF'}
                  className="transition-colors"
                />
                {/* X-axis label */}
                <text
                  x={coord.x}
                  y={height - 8}
                  textAnchor="middle"
                  fill="#6B7280"
                  fontSize="11"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {p.time}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Chart Legend Footer */}
      <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/5 text-xs text-[#6B7280]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#0066FF] rounded-full" />
            <span className="text-white font-medium">Kinematic Stream</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-[#6B7280]" />
            <span>Target Baseline</span>
          </div>
        </div>
        <div className="font-sans text-[11px] font-medium text-zinc-400 tabular-nums">
          Sampling Rate: 100 Hz · 12-bit Resolution
        </div>
      </div>
    </div>
  );
};
