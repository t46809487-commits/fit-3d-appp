import React from 'react';
import { Home, Compass, Dumbbell, User, Utensils, Users } from 'lucide-react';

export type TabType = 'home' | 'explore' | 'workout' | 'diet' | 'community' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  onOpenBoxing: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenBoxing,
}) => {
  const tabs = [
    { id: 'home' as TabType, label: 'Home', icon: Home },
    { id: 'explore' as TabType, label: 'Explore', icon: Compass },
    { id: 'workout' as TabType, label: 'Workout', icon: Dumbbell },
    { id: 'diet' as TabType, label: 'Diet', icon: Utensils },
    { id: 'community' as TabType, label: 'Social', icon: Users },
    { id: 'profile' as TabType, label: 'Me', icon: User },
  ];

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-neutral-950/90 backdrop-blur-xl border-t border-neutral-900 pb-safe">
      <div className="max-w-md mx-auto px-2 py-2 flex items-center justify-around relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1.5 rounded-2xl transition-all ${
                isActive
                  ? 'text-orange-500 scale-105 font-bold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
            </button>
          );
        })}

        {/* Quick Boxing Mode Action Shortcut */}
        <button
          onClick={onOpenBoxing}
          className="flex flex-col items-center justify-center py-1.5 px-1.5 rounded-2xl text-red-400 hover:text-red-300 transition-all hover:scale-105 group"
          title="Open 3D Boxing Mode"
        >
          <div className="relative">
            <span className="text-lg">🥊</span>
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-tight text-red-500 group-hover:text-red-400">
            Boxing
          </span>
        </button>
      </div>
    </div>
  );
};
