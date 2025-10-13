import React, { useState } from 'react';
import { Input, Select, Button } from '../common';
import { USER_ROLES } from '../../utils/constants';
import { User, RegisterRequest } from '../../types';

interface UserFormProps {
  user?: User;
  onSubmit: (data: RegisterRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
  user,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<RegisterRequest>({
    email: user?.email || '',
    password: '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    role: user?.role || 'API_USER',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!user && !formData.password) newErrors.password = 'Password is required';
    if (!formData.role) newErrors.role = 'Role is required';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="First Name"
          value={formData.firstName}
          onChange={(value) => {
            setFormData({ ...formData, firstName: value });
            if (errors.firstName) setErrors({ ...errors, firstName: '' });
          }}
          error={errors.firstName}
          required
        />
        <Input
          label="Last Name"
          value={formData.lastName}
          onChange={(value) => {
            setFormData({ ...formData, lastName: value });
            if (errors.lastName) setErrors({ ...errors, lastName: '' });
          }}
          error={errors.lastName}
          required
        />
      </div>

      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(value) => {
          setFormData({ ...formData, email: value });
          if (errors.email) setErrors({ ...errors, email: '' });
        }}
        error={errors.email}
        required
        disabled={!!user}
      />

      {!user && (
        <Input
          label="Password"
          type="password"
          value={formData.password}
          onChange={(value) => {
            setFormData({ ...formData, password: value });
            if (errors.password) setErrors({ ...errors, password: '' });
          }}
          error={errors.password}
          required
        />
      )}

      <Select
        label="Role"
        value={formData.role || ''}
        onChange={(value) => {
          setFormData({ ...formData, role: value as any });
          if (errors.role) setErrors({ ...errors, role: '' });
        }}
        options={USER_ROLES}
        error={errors.role}
        required
      />

      <div className="flex gap-3 justify-end border-t border-gray-200 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {user ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
};