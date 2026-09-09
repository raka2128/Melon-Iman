import React from 'react';
import { LayoutDashboard, Calendar, Droplet, ShieldAlert, Boxes } from 'lucide-react';

export type TabKey = 'dashboard' | 'jadwal' | 'tandon' | 'hpt' | 'stok';

interface BottomNavProps {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  isPraPanen?: boolean;
  tandonAlert?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  isPraPanen = false,
  tandonAlert = false,
}) => {
  const tabs = [
    {
      key: 'dashboard' as TabKey,
      label: 'Dashboard',
      icon: LayoutDashboard,
      id: 'tab-dashboard',
    },
    {
      key: 'jadwal' as TabKey,
      label: 'Jadwal',
      icon: Calendar,
      id: 'tab-jadwal',
    },
    {
      key: 'tandon' as TabKey,
      label: 'Tandon PPM',
      icon: Droplet,
      id: 'tab-tandon',
      badge: tandonAlert,
    },
    {
      key: 'hpt' as TabKey,
      label: 'HPT',
      icon: ShieldAlert,
      id: 'tab-hpt',
      badge: isPraPanen,
    },
    {
      key: 'stok' as TabKey,
      label: 'Stok',
      icon: Boxes,
      id: 'tab-stok',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-lg border-t border-stone-200 dark:border-stone-800 safe-bottom shadow-lg">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              id={tab.id}
              onClick={() => onChangeTab(tab.key)}
              className={`relative flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 touch-manipulation min-h-[44px] ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-stone-900 animate-pulse" />
                )}
              </div>
              <span className="text-[10px] tracking-tight whitespace-nowrap">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-1 w-6 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
