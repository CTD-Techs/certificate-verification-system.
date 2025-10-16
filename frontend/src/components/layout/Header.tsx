import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/common';
import { 
  ArrowRightOnRectangleIcon, 
  ShieldCheckIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm transition-colors">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          {/* Logo Icon */}
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
            <ShieldCheckIcon className="h-6 w-6 text-white" />
          </div>
          
          {/* Brand Text */}
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Veri-Intelli
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Document Verification
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <MoonIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          ) : (
            <SunIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          )}
        </button>
        
        {/* Logout Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout}
          className="flex items-center space-x-2"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
};