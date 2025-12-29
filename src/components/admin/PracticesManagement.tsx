import React, { useState } from 'react';
import { Plus, Edit, Building2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useToast } from '../../hooks/useToast';
import { usePractices } from '../../hooks/usePractices';

import { Practice } from '../../types';

export const PracticesManagement: React.FC = () => {
  const { practices, loading, addPractice, updatePractice, togglePracticeStatus } = usePractices();
  const { showToast, ToastContainer } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editingPractice, setEditingPractice] = useState<Practice | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    phone: '',
    email: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      address: '',
      city: '',
      phone: '',
      email: '',
    });
    setEditingPractice(null);
  };

  const handleOpenModal = (practice?: Practice) => {
    if (practice) {
      setEditingPractice(practice);
      setFormData({
        name: practice.name,
        code: practice.code,
        address: practice.address || '',
        city: practice.city || '',
        phone: practice.phone || '',
        email: practice.email || '',
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingPractice) {
      const result = await updatePractice(editingPractice.id, formData);
      if (result.success) {
        showToast('Practice updated successfully', 'success');
        handleCloseModal();
      } else {
        showToast(result.error || 'Failed to update practice', 'error');
      }
    } else {
      const result = await addPractice(formData);
      if (result.success) {
        showToast('Practice added successfully', 'success');
        handleCloseModal();
      } else {
        showToast(result.error || 'Failed to add practice', 'error');
      }
    }
  };

  const handleToggleStatus = async (practice: Practice) => {
    const result = await togglePracticeStatus(practice.id, practice.status);
    if (result.success) {
      showToast(
        `Practice ${practice.status === 'active' ? 'deactivated' : 'activated'} successfully`,
        'success',
      );
    } else {
      showToast(result.error || 'Failed to update practice status', 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading practices..." />;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Manage Practices</h2>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Practice
          </Button>
        </div>

        {practices.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No practices found</h3>
              <p className="text-gray-600 mb-6">Get started by adding your first practice</p>
              <Button onClick={() => handleOpenModal()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Practice
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Practice Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Code</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">City</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Phone</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {practices.map((practice) => (
                    <tr key={practice.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{practice.name}</div>
                        <div className="text-sm text-gray-500">{practice.address}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {practice.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{practice.city || '-'}</td>
                      <td className="py-3 px-4 text-gray-600">{practice.phone || '-'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            practice.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {practice.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(practice)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(practice)}
                            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                              practice.status === 'active'
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                          >
                            {practice.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                {editingPractice ? 'Edit Practice' : 'Add New Practice'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Practice Name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="City General Hospital"
                    />
                  </div>

                  <Input
                    label="Practice Code"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="CGH001"
                    maxLength={20}
                    disabled={!!editingPractice}
                  />

                  <Input
                    label="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City Center"
                  />

                  <Input
                    label="Phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="011-123-4567"
                  />

                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="info@hospital.com"
                  />

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Main Street, City Center"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end mt-6">
                  <Button type="button" variant="secondary" onClick={handleCloseModal}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingPractice ? 'Update Practice' : 'Add Practice'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </>
  );
};
