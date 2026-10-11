/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AXIO Premium Desktop Sidebar Navigation
 */

import React from 'react';
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
  Flame,
  HeartPulse,
} from 'lucide-react';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  athlete: AthleteProfile;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  athlete,
}) => {
  const navItems: { id: PageId; label: string; badge?: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ai-coach', label: 'AI Coach', icon: Bot },
    { id: 'workout', label: 'Workout', icon: Dumbbell },
    { id: 'live-form', label: 'AI CAM', badge: 'LIVE', icon: Video },
    { id: 'recovery', label: 'Recovery', badge: 'DAILY', icon: HeartPulse },
    { id: 'exercises', label: 'Exercises', icon: BookOpen },
    { id: 'nutrition', label: 'Nutrition', icon: Utensils },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <aside className="w-64 h-screen sticky top-0 flex-col justify-between bg-[#0B0C10] border-r border-white/[0.08] hidden md:flex shrink-0 select-none z-30">
      {/* Top: Brand Header */}
      <div>
        <div className="h-16 px-6 flex items-center border-b border-white/[0.08]">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-3 group text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF] rounded-md transition-opacity hover:opacity-90"
          >
            <AxioMark className="w-7 h-7 text-white group-hover:text-[#0066FF] transition-colors shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-normal text-white leading-none">
                AXIO
              </span>
              <span className="text-[11px] font-medium tracking-normal text-zinc-400 mt-1">
                Human Performance
              </span>
            </div>
          </button>
        </div>

        {/* Navigation Section */}
        <div className="p-4 space-y-1">
          <div className="px-3 pb-2 text-xs font-medium tracking-normal text-zinc-500">
            Platform Modules
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-sans tracking-normal transition-all duration-150 ease-out group relative text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF] ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0066FF] to-[#0055EE] text-white shadow-[0_1px_3px_rgba(0,0,0,0.5),0_0_14px_rgba(0,102,255,0.25)] font-semibold border border-[#0066FF]/80'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.05] font-medium border border-transparent'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors shrink-0 ${
                      isActive ? 'text-white' : 'text-zinc-400 group-hover:text-white'
                    }`}
                  />
                  <span className="truncate flex-1 font-sans tracking-normal">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-sans px-1.5 py-0.5 rounded font-semibold uppercase tracking-normal leading-none ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom: Quick Status & Athlete Profile Card */}
      <div className="p-4 border-t border-white/[0.08] space-y-3 font-sans">
        {/* Streak & Performance Pill (Natural human typography) */}
        <div className="bg-[#11131B] border border-white/[0.07] rounded-xl p-3 flex items-center justify-between text-xs shadow-sm">
          <div className="flex items-center gap-1.5 text-white font-medium tracking-normal font-sans">
            <Flame className="w-4 h-4 text-[#0066FF]" />
            <span>{athlete.streakDays} Days Streak</span>
          </div>

          <div className="font-sans text-xs text-[#0066FF] font-semibold tracking-normal">
            {athlete.performanceScore} / 100
          </div>
        </div>

        {/* Athlete Quick Profile Tile */}
        <button
          onClick={() => onNavigate('profile')}
          className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0066FF] ${
            currentPage === 'profile'
              ? 'border-[#0066FF]/80 bg-[#161826] shadow-[0_0_12px_rgba(0,102,255,0.15)]'
              : 'border-white/[0.07] bg-[#11131B] hover:border-white/[0.16] hover:bg-[#151722]'
          }`}
        >
          <div className="w-9 h-9 rounded-lg bg-[#0066FF]/20 border border-[#0066FF]/40 text-[#0066FF] font-sans text-xs font-semibold tracking-normal flex items-center justify-center shrink-0">
            {athlete.avatarInitials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-white truncate font-sans tracking-normal">
              {athlete.name}
            </div>
            <div className="text-[11px] text-zinc-400 truncate font-sans font-normal tracking-normal mt-0.5">
              {athlete.tier}
            </div>
          </div>
        </button>
      </div>
    </aside>
  );
};
