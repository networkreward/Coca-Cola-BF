import { ViewState } from '../types';
import { Home, ShoppingBag, Users, UserCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface BottomNavProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
}

export default function BottomNav({ currentView, onViewChange }: BottomNavProps) {
  const tabs = [
    { id: 'HOME', icon: Home, label: 'Accueil' },
    { id: 'PRODUCTS', icon: ShoppingBag, label: 'Produits' },
    { id: 'TEAM', icon: Users, label: 'Équipe' },
    { id: 'ACCOUNT', icon: UserCircle, label: 'Compte' },
  ] as const;

  return (
    <div className="absolute bottom-0 left-0 w-full bg-white dark:bg-[#1A1A1A] border-t border-gray-100 dark:border-[#333] pb-4 pt-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center px-2">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.id as ViewState)}
              className={`flex flex-col items-center justify-center w-16 relative ${
                isActive ? 'text-[#F40009]' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:text-gray-500'
              } transition-colors`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-3 w-8 h-1 bg-[#F40009] rounded-b-full"
                />
              )}
              <Icon className={`h-6 w-6 mb-1 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
