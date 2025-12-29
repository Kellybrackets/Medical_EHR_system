import React, { useState, useMemo } from 'react';
import { Search, Mail, UserX, Users as UsersIcon } from 'lucide-react';
import { Card } from '../ui/Card';

import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useToast } from '../ui/Toast';
import { useAdminUsers } from '../../hooks/useAdminUsers';
import { usePractices } from '../../hooks/usePractices';

export const UsersManagement: React.FC = () => {
  const { users, loading, resetPassword, deleteUser } = useAdminUsers();
  const { practices } = usePractices();
  const { showToast, ToastContainer } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [practiceFilter, setPracticeFilter] = useState<string>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;

      const matchesPractice = practiceFilter === 'all' || user.practiceCode === practiceFilter;

      return matchesSearch && matchesRole && matchesPractice;
    });
  }, [users, searchTerm, roleFilter, practiceFilter]);

  const handleResetPassword = async (userId: string, email: string, name: string) => {
    const result = await resetPassword(userId, email);
    if (result.success) {
      showToast(`Password reset email sent to ${name}`, 'success');
    } else {
      showToast(result.error || 'Failed to send password reset email', 'error');
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    const result = await deleteUser(userId);
    if (result.success) {
      showToast(`User ${name} deleted successfully`, 'success');
      setConfirmDelete(null);
    } else {
      showToast(result.error || 'Failed to delete user', 'error');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'doctor':
        return 'bg-blue-100 text-blue-800';
      case 'receptionist':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading users..." />;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Manage Users</h2>
          <div className="text-sm text-gray-600">
            {filteredUsers.length} of {users.length} users
          </div>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="doctor">Doctors</option>
              <option value="receptionist">Receptionists</option>
              <option value="admin">Admins</option>
            </select>

            <select
              value={practiceFilter}
              onChange={(e) => setPracticeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Practices</option>
              {practices.map((practice) => (
                <option key={practice.code} value={practice.code}>
                  {practice.name}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {filteredUsers.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <UsersIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">Try adjusting your search filters</p>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Username</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Practice</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.username}@medcare.com</div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{user.username}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(
                            user.role,
                          )}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {user.practiceName || (
                          <span className="text-gray-400 italic">No practice</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          {confirmDelete === user.id ? (
                            <>
                              <button
                                onClick={() => handleDeleteUser(user.id, user.name)}
                                className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  handleResetPassword(
                                    user.id,
                                    `${user.username}@medcare.com`,
                                    user.name,
                                  )
                                }
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Reset Password"
                              >
                                <Mail className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setConfirmDelete(user.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete User"
                              >
                                <UserX className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <ToastContainer />
    </>
  );
};
