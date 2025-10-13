import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores';
import { Button } from '@/components/common';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-gray-900">Certificate Verification System</h2>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
};