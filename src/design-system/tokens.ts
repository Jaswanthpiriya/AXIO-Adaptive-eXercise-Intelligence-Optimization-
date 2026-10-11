/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Universal Fitness & Human Performance Platform - Design System Tokens
 * Grounded in the official AXIO brand identity reference.
 */

export interface ColorToken {
  name: string;
  role: string;
  hex: string;
  rgb: string;
  cmyk: string;
  description: string;
  contrastOnWhite: string;
  contrastOnBlack: string;
  badge?: string;
}

export const AXIO_COLORS: Record<string, ColorToken> = {
  black: {
    name: 'AXIO Black',
    role: 'Primary Brand Color',
    hex: '#0B0B0D',
    rgb: '11 11 13',
    cmyk: '75 65 60 80',
    description: 'Primary brand color. Used for text, backgrounds and core elements. Represents strength, focus and sophistication.',
    contrastOnWhite: '18.9:1 (AAA)',
    contrastOnBlack: '1.0:1',
  },
  white: {
    name: 'Pure White',
    role: 'Contrast & Canvas',
    hex: '#FFFFFF',
    rgb: '255 255 255',
    cmyk: '0 0 0 0',
    description: 'Clean, minimal and balanced. Used for backgrounds, negative space and contrast. Enhances clarity and focus.',
    contrastOnWhite: '1.0:1',
    contrastOnBlack: '18.9:1 (AAA)',
  },
  blue: {
    name: 'AXIO Blue',
    role: 'Primary Accent',
    badge: 'ACCENT',
    hex: '#0066FF',
    rgb: '0 102 255',
    cmyk: '85 60 0 0',
    description: 'Primary accent color. Used for calls to action, highlights and interactive elements. Represents energy, progress and innovation.',
    contrastOnWhite: '4.6:1 (AA)',
    contrastOnBlack: '4.1:1 (AA Large)',
  },
  steel: {
    name: 'Steel Gray',
    role: 'Supporting Color',
    hex: '#6B7280',
    rgb: '107 114 128',
    cmyk: '60 60 40 15',
    description: 'Supporting color. Used for secondary text, icons and UI elements. Adds balance and depth.',
    contrastOnWhite: '4.8:1 (AA)',
    contrastOnBlack: '3.9:1 (AA Large)',
  },
  light: {
    name: 'Light Gray',
    role: 'Subtle Background',
    hex: '#E5E7EB',
    rgb: '229 231 235',
    cmyk: '8 6 4 0',
    description: 'Subtle background color. Used for cards, sections and soft surfaces. Creates a clean, modern and calm feel.',
    contrastOnWhite: '1.2:1',
    contrastOnBlack: '15.4:1 (AAA)',
  },
};

export const AXIO_GRADIENT = {
  name: 'AXIO Power Gradient',
  css: 'linear-gradient(135deg, #0B0B0D 0%, #0066FF 100%)',
  from: '#0B0B0D',
  to: '#0066FF',
  description: 'Use for hero sections, backgrounds, or special UI elements to add depth and a futuristic feel.',
};

export const AXIO_TYPOGRAPHY = {
  fontFamily: {
    primary: '"Inter", system-ui, -apple-system, sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
  scale: [
    {
      level: 'Hero Display',
      size: '36px – 48px',
      weight: '700 (Bold)',
      tracking: '-0.025em',
      sample: 'Universal Human Performance',
      usage: 'Hero title, primary page value proposition',
    },
    {
      level: 'Section Headline',
      size: '24px – 28px',
      weight: '600 (SemiBold)',
      tracking: '-0.015em',
      sample: 'Kinematic Power Profiling',
      usage: 'Feature headers, dashboard view titles',
    },
    {
      level: 'Card Title',
      size: '18px – 20px',
      weight: '600 (SemiBold)',
      tracking: '-0.01em',
      sample: 'Peak Power Output',
      usage: 'Metric cards, component containers',
    },
    {
      level: 'Body Text',
      size: '15px – 16px',
      weight: '400 (Regular)',
      tracking: 'normal',
      sample: 'High-frequency neuromuscular velocity feedback recorded via 12-axis telemetry.',
      usage: 'Narrative copy, descriptions, analysis',
    },
    {
      level: 'Data Telemetry',
      size: '14px – 28px',
      weight: '500 / 600 (Mono)',
      tracking: '-0.01em',
      sample: '1,480 W · 2.42 m/s · 94.2% HRV',
      usage: 'Tabular values, vitals, timestamps, sensor inputs',
    },
    {
      level: 'Metadata & Kickers',
      size: '11px – 12px',
      weight: '600 (SemiBold)',
      tracking: '0.08em',
      sample: 'ATHLETIC READINESS · SESSION 04',
      usage: 'Kickers, category tags, unboxed metadata',
    },
  ],
};

export const AXIO_RULES = [
  {
    title: 'Strict Visual Palette',
    rule: 'Only AXIO Black (#0B0B0D), Pure White (#FFFFFF), AXIO Blue (#0066FF), Steel Gray (#6B7280), and Light Gray (#E5E7EB). No purple, orange, neon greens, or generic gym-style aesthetics.',
  },
  {
    title: '60-30-10 Ratio',
    rule: '60% AXIO Black canvas (or Pure White in light surfaces), 30% structural surfaces and steel gray dividers, 10% AXIO Blue intentional interactive accents.',
  },
  {
    title: 'Zero-Pill Metadata',
    rule: 'Never wrap tags or metadata in pill capsules or candy badges. Render clean unboxed typography separated by subtle dots (·) or slashes (/).',
  },
  {
    title: 'Single-Elevation Surfaces',
    rule: 'Maintain 1 level of elevation depth. Use 1px hairline dividers (rgba(255,255,255,0.08)) and whitespace rather than cards-within-cards or heavy shadows.',
  },
  {
    title: 'Tabular Numerals for Telemetry',
    rule: 'All sports performance numbers, power readings, velocities, and heart rates must use tabular-nums in JetBrains Mono to avoid layout jitter.',
  },
  {
    title: 'Clean Typography & No Hallucinations',
    rule: 'No mechanical code prefixes (// 01_CORE), no fake system tickers, no low-opacity watermark text. Clean, editorial title-case prose.',
  },
];
