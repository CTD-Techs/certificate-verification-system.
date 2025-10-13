import React from 'react';
import { User } from '../../types';
import { Table, Column, Badge, Button } from '../common';
import { getUserRoleLabel } from '../../utils/constants';
import { formatDate } from '../../utils/format';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
}

export const UserTable: React.FC<UserTableProps> = ({ users, onEdit, onDelete }) => {
  const getRoleBadgeVariant = (role: string) => {
    const variantMap: Record<string, 'success' | 'error' | 'warning' | 'info'> = {
      ADMIN: 'error',
      VERIFIER: 'warning',
      API_USER: 'info',
    };
    return variantMap[role] || 'info';
  };

  const columns: Column<User>[] = [
    {
      key: 'id',
      header: 'ID',
      render: (user) => (
        <span className="text-xs font-mono text-gray-600">
          {user.id.substring(0, 8)}...
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (user) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (user) => (
        <Badge variant={getRoleBadgeVariant(user.role)}>
          {getUserRoleLabel(user.role)}
        </Badge>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (user) => (
        <Badge variant={user.isActive ? 'success' : 'error'}>
          {user.isActive ? 'ACTIVE' : 'INACTIVE'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (user) => <span className="text-sm">{formatDate(user.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(user);
            }}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Are you sure you want to delete user ${user.firstName} ${user.lastName}?`)) {
                onDelete(user.id);
              }
            }}
            className="text-red-600 hover:text-red-700 hover:border-red-600"
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return <Table data={users} columns={columns} emptyMessage="No users found" />;
};