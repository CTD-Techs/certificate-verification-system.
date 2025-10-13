import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 h-screen">
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-600">Cert Verify</h1>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-700' : 'text-gray-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-700 font-medium">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};