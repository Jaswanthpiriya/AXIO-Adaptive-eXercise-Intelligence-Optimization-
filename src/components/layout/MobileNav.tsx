/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Mobile Navigation (Top Header + Bottom Quick Bar + Drawer)
 */

import React, { useState } from 'react';
import { PageId, AthleteProfile } from '../../types/app.ts';
import { AxioMark } from '../../design-system/AxioLogo.tsx';
import {
  LayoutDashboard,
  Bot,
  Dumbbell,
  Video,
  BookOpen,
  Utensils,
  TrendingUp,
  Trophy,
  User,
  Menu,
  X,
  Flame,
  HeartPulse,
} from 'lucide-react';

interface MobileNavProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  athlete: AthleteProfile;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentPage,
  onNavigate,
  athlete,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const allNavItems: { id: PageId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ai-coach', label: 'AI Coach', icon: Bot },
    { id: 'workout', label: 'Workout', icon: Dumbbell },
    { id: 'live-form', label: 'AI CAM', icon: Video },
    { id: 'recovery', label: 'Recovery', icon: HeartPulse },
    { id: 'exercises', label: 'Exercises', icon: BookOpen },
    { id: 'nutrition', label: 'Nutrition', icon: Utensils },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const bottomNavItems = [
    { id: 'dashboard' as PageId, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'workout' as PageId, label: 'Workout', icon: Dumbbell },
    { id: 'live-form' as PageId, label: 'AI CAM', icon: Video },
    { id: 'ai-coach' as PageId, label: 'AI Coach', icon: Bot },
  ];

  const handleSelect = (page: PageId) => {
    onNavigate(page);
    setDrawerOpen(false);
  };

  const getPageTitle = (page: PageId) => {
    const found = allNavItems.find((item) => item.id === page);
    return found ? found.label : 'AXIO';
  };

  return (
    <>
      {/* Mobile Sticky Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-[#0B0B0E]/95 backdrop-blur-md border-b border-white/[0.08] px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AxioMark className="w-6 h-6 text-white" />
          <span className="font-bold text-base tracking-normal text-white">
            AXIO
          </span>
          <span className="text-zinc-500 text-xs">/</span>
          <span className="text-xs font-semibold text-white truncate max-w-[120px]">
            {getPageTitle(currentPage)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-white font-sans font-medium tabular-nums bg-[#11131B] px-2.5 py-1 rounded-lg border border-white/[0.08]">
            <Flame className="w-3.5 h-3.5 text-[#0066FF]" />
            <span>{athlete.streakDays}d</span>
          </div>

          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            aria-label="Toggle Navigation Menu"
            className="p-1.5 text-zinc-300 hover:text-white rounded-lg hover:bg-white/[0.08] transition-colors"
          >
            {drawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#0B0B0E]/98 backdrop-blur-lg flex flex-col justify-between p-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-3">
              <AxioMark className="w-7 h-7 text-white" />
              <span className="font-bold text-lg tracking-normal text-white">
                AXIO
              </span>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.08] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 space-y-1.5 my-auto max-h-[calc(100vh-140px)]">
            {allNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF] ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0066FF] to-[#0055EE] text-white font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.5),0_0_12px_rgba(0,102,255,0.25)]'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="border-t border-white/[0.08] pt-4 flex items-center justify-between text-xs text-zinc-400">
            <span className="font-medium text-white">{athlete.name}</span>
            <span className="font-sans text-[#0066FF] font-medium">{athlete.tier}</span>
          </div>
        </div>
      )}

      {/* Mobile Fixed Bottom Navigation Bar (15% height rule compliant) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0B0B0E]/95 backdrop-blur-md border-t border-white/[0.08] px-2 py-1 flex items-center justify-around h-16">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`min-h-[44px] min-w-[48px] flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF] ${
                isActive ? 'text-[#0066FF] font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setDrawerOpen(true)}
          className="min-h-[44px] min-w-[48px] flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium text-zinc-400 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF]"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
};
