import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout';
import { UserTable, UserForm } from '@/components/admin';
import { Modal, Button, LoadingSpinner } from '@/components/common';
import { adminService } from '@/services';
import toast from 'react-hot-toast';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await adminService.getUsers();
      setUsers(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await adminService.deleteUser(userId);
      toast.success('User deleted successfully!');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to delete user');
    }
  };

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (selectedUser) {
        await adminService.updateUser(selectedUser.id, data);
        toast.success('User updated successfully!');
      } else {
        await adminService.createUser(data);
        toast.success('User created successfully!');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to save user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage system users and their roles
            </p>
          </div>
          <Button onClick={handleCreate}>
            Create User
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <UserTable
            users={users}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={selectedUser ? 'Edit User' : 'Create User'}
        >
          <UserForm
            user={selectedUser}
            onSubmit={handleSubmit}
            onCancel={handleCloseModal}
            isLoading={isSubmitting}
          />
        </Modal>
      </div>
    </Layout>
  );
};