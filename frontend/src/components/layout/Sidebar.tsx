import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { useAuthStore } from '@/stores';
import { ROUTES } from '@/utils';
import {
  HomeIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  ChartBarIcon,
  UserCircleIcon,
  DocumentDuplicateIcon,
  FingerPrintIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: ROUTES.DASHBOARD, icon: HomeIcon },
  { name: 'Certificates', path: ROUTES.CERTIFICATES, icon: DocumentTextIcon },
  { name: 'Verifications', path: ROUTES.VERIFICATIONS, icon: CheckCircleIcon },
  { name: 'Signature Matching', path: ROUTES.SIGNATURE_MATCHING, icon: FingerPrintIcon },
  { name: 'PAN-Aadhaar Matching', path: ROUTES.PAN_AADHAAR_MATCHING, icon: DocumentDuplicateIcon },
  {
    name: 'Review Queue',
    path: ROUTES.VERIFIER_QUEUE,
    icon: ClipboardDocumentListIcon,
    roles: ['VERIFIER', 'ADMIN'],
  },
  { name: 'Users', path: ROUTES.ADMIN_USERS, icon: UsersIcon, roles: ['ADMIN'] },
  { name: 'Statistics', path: ROUTES.ADMIN_STATS, icon: ChartBarIcon, roles: ['ADMIN'] },
  { name: 'Profile', path: ROUTES.PROFILE, icon: UserCircleIcon },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, hasRole } = useAuthStore();

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || item.roles.some((role) => hasRole(role))
  );

  return (
    <div className="flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen transition-colors">
      {/* Logo Section */}
      <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700 px-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
            <ShieldCheckIcon className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Veri-Intelli</h1>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">VionixCosmic</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              <Icon className="h-5 w-5 mr-3" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 transition-colors">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};