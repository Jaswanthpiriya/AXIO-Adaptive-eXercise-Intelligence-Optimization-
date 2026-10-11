/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO DataGrid Primitive
 * High-density human performance ledger adhering to tabular numeral alignment and anti-slop rules.
 */

import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

export interface PerformanceRecord {
  id: string;
  athlete: string;
  discipline: string;
  sessionDate: string;
  peakPower: number; // Watts
  meanVelocity: number; // m/s
  readinessScore: number; // %
  loadIndex: number; // AU
  status: 'Ready' | 'Moderate' | 'Fatigued';
}

const SAMPLE_RECORDS: PerformanceRecord[] = [
  {
    id: 'ATH-101',
    athlete: 'Alexander Vance',
    discipline: 'Track Sprint (100m)',
    sessionDate: '2026-10-10',
    peakPower: 1680,
    meanVelocity: 2.45,
    readinessScore: 94,
    loadIndex: 420,
    status: 'Ready',
  },
  {
    id: 'ATH-102',
    athlete: 'Elena Rostova',
    discipline: 'Olympic Weightlifting',
    sessionDate: '2026-10-10',
    peakPower: 1420,
    meanVelocity: 1.88,
    readinessScore: 88,
    loadIndex: 510,
    status: 'Ready',
  },
  {
    id: 'ATH-103',
    athlete: 'Marcus Thorne',
    discipline: 'Hybrid CrossFit Games',
    sessionDate: '2026-10-09',
    peakPower: 1290,
    meanVelocity: 1.62,
    readinessScore: 76,
    loadIndex: 680,
    status: 'Moderate',
  },
  {
    id: 'ATH-104',
    athlete: 'Sophia Lin',
    discipline: 'Rowing (2000m Erg)',
    sessionDate: '2026-10-09',
    peakPower: 980,
    meanVelocity: 1.44,
    readinessScore: 62,
    loadIndex: 790,
    status: 'Fatigued',
  },
  {
    id: 'ATH-105',
    athlete: 'David Khem',
    discipline: 'Combat & Speed Wrestling',
    sessionDate: '2026-10-08',
    peakPower: 1530,
    meanVelocity: 2.12,
    readinessScore: 91,
    loadIndex: 450,
    status: 'Ready',
  },
];

export const DataGrid: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof PerformanceRecord>('peakPower');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = SAMPLE_RECORDS.filter(
    (r) =>
      r.athlete.toLowerCase().includes(search.toLowerCase()) ||
      r.discipline.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return sortAsc
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  const handleSort = (field: keyof PerformanceRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className={`bg-[#121318] border border-white/10 rounded-xl overflow-hidden ${className}`}>
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5">
        <div>
          <h4 className="text-base font-semibold text-white tracking-tight">
            Athlete Kinematic Session Register
          </h4>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Synchronized high-frequency performance records
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter athlete or sport..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#181A22] text-sm text-white pl-9 pr-3 py-1.5 rounded-lg border border-white/10 focus:border-[#0066FF] focus:outline-none transition-colors font-sans placeholder:text-[#6B7280]"
          />
        </div>
      </div>

      {/* High-Density Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 bg-[#16171E] text-[#6B7280] uppercase tracking-normal font-semibold">
              <th className="py-3 px-4">ID &amp; Athlete</th>
              <th className="py-3 px-4">Discipline</th>
              <th
                className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('peakPower')}
              >
                <div className="inline-flex items-center gap-1 justify-end">
                  <span>Peak Power</span>
                  {sortField === 'peakPower' && (
                    sortAsc ? <ChevronUp className="w-3.5 h-3.5 text-[#0066FF]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#0066FF]" />
                  )}
                </div>
              </th>
              <th
                className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('meanVelocity')}
              >
                <div className="inline-flex items-center gap-1 justify-end">
                  <span>Velocity</span>
                  {sortField === 'meanVelocity' && (
                    sortAsc ? <ChevronUp className="w-3.5 h-3.5 text-[#0066FF]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#0066FF]" />
                  )}
                </div>
              </th>
              <th
                className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('readinessScore')}
              >
                <div className="inline-flex items-center gap-1 justify-end">
                  <span>Readiness</span>
                  {sortField === 'readinessScore' && (
                    sortAsc ? <ChevronUp className="w-3.5 h-3.5 text-[#0066FF]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#0066FF]" />
                  )}
                </div>
              </th>
              <th className="py-3 px-4 text-right">Load AU</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((record) => (
              <tr
                key={record.id}
                className="hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-3 px-4 font-medium text-white whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-[11px] text-[#6B7280] tabular-nums">{record.id}</span>
                    <span>{record.athlete}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-[#6B7280] whitespace-nowrap">
                  {record.discipline}
                </td>
                <td className="py-3 px-4 text-right font-sans font-medium text-white tabular-nums whitespace-nowrap">
                  {record.peakPower}
                  <span className="text-[#6B7280] ml-1 font-normal text-[11px]">W</span>
                </td>
                <td className="py-3 px-4 text-right font-sans text-[#0066FF] font-medium tabular-nums whitespace-nowrap">
                  {record.meanVelocity.toFixed(2)}
                  <span className="text-[#6B7280] ml-1 font-normal text-[11px]">m/s</span>
                </td>
                <td className="py-3 px-4 text-right font-sans text-white tabular-nums whitespace-nowrap">
                  {record.readinessScore}%
                </td>
                <td className="py-3 px-4 text-right font-sans text-[#6B7280] tabular-nums whitespace-nowrap">
                  {record.loadIndex}
                </td>
                {/* Clean unboxed status text (anti-slop zero pill discipline) */}
                <td className="py-3 px-4 text-center whitespace-nowrap">
                  <span className="text-xs font-medium text-[#E5E7EB]">
                    {record.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
