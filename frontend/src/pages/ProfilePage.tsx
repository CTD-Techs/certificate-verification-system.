import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { Input, Button, Card, Badge } from '@/components/common';
import { useAuthStore } from '@/stores';
import { authService } from '@/services';
import toast from 'react-hot-toast';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateProfileForm = () => {
    const newErrors: Record<string, string> = {};
    if (!profileData.firstName) {
      newErrors.firstName = 'First name is required';
    }
    if (!profileData.lastName) {
      newErrors.lastName = 'Last name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {};
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfileForm()) return;

    setIsLoading(true);
    try {
      await authService.updateProfile(profileData);
      toast.success('Profile updated successfully!');
      setIsEditingProfile(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    setIsLoading(true);
    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsChangingPassword(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully!');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your account settings and preferences
          </p>
        </div>

        {/* User Information */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">User Information</h3>
            {!isEditingProfile && (
              <Button variant="secondary" onClick={() => setIsEditingProfile(true)}>
                Edit Profile
              </Button>
            )}
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleProfileChange}
                  error={errors.firstName}
                  required
                />
                <Input
                  label="Last Name"
                  name="lastName"
                  value={profileData.lastName}
                  onChange={handleProfileChange}
                  error={errors.lastName}
                  required
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" isLoading={isLoading}>
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsEditingProfile(false);
                    setProfileData({
                      firstName: user.firstName,
                      lastName: user.lastName,
                    });
                    setErrors({});
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">First Name</p>
                  <p className="mt-1 font-medium text-gray-900">{user.firstName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Name</p>
                  <p className="mt-1 font-medium text-gray-900">{user.lastName}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="mt-1 font-medium text-gray-900">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <div className="mt-1">
                  <Badge variant="primary">{user.role}</Badge>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Change Password */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
            {!isChangingPassword && (
              <Button variant="secondary" onClick={() => setIsChangingPassword(true)}>
                Change Password
              </Button>
            )}
          </div>

          {isChangingPassword ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                label="Current Password"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                error={errors.currentPassword}
                required
              />
              <Input
                label="New Password"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                error={errors.newPassword}
                required
                placeholder="At least 8 characters"
              />
              <Input
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                error={errors.confirmPassword}
                required
              />
              <div className="flex gap-3">
                <Button type="submit" isLoading={isLoading}>
                  Update Password
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setErrors({});
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-gray-600">
              Keep your account secure by using a strong password and changing it regularly.
            </p>
          )}
        </Card>

        {/* Danger Zone */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Danger Zone</h3>
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
            <div>
              <p className="font-medium text-gray-900">Logout</p>
              <p className="text-sm text-gray-600">Sign out of your account</p>
            </div>
            <Button variant="secondary" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
};