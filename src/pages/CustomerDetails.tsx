import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Users, Edit, ArrowLeft, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  company_name: string | null;
  tax_id: string | null;
  notes: string | null;
  date_of_birth: string | null;
  gender: string | null;
  created_at: string;
  updated_at: string;
}

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState<Partial<Customer>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  async function fetchCustomer() {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCustomer(data);
      setEditedCustomer(data);
    } catch (error) {
      console.error('Error fetching customer:', error);
      navigate('/customers');
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditedCustomer(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!customer) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('customers')
        .update(editedCustomer)
        .eq('id', customer.id);

      if (error) throw error;
      
      setCustomer({ ...customer, ...editedCustomer });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Failed to update customer. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-semibold text-gray-900">Customer Details</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/customers"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customers
          </Link>
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedCustomer(customer);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Customer
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                name="name"
                value={isEditing ? editedCustomer.name : customer.name}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  isEditing ? 'border-gray-300' : 'border-transparent bg-gray-50'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                name="email"
                value={isEditing ? editedCustomer.email : customer.email}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  isEditing ? 'border-gray-300' : 'border-transparent bg-gray-50'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={isEditing ? editedCustomer.phone || '' : customer.phone || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  isEditing ? 'border-gray-300' : 'border-transparent bg-gray-50'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
                value={isEditing ? editedCustomer.date_of_birth || '' : customer.date_of_birth || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  isEditing ? 'border-gray-300' : 'border-transparent bg-gray-50'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select
                name="gender"
                value={isEditing ? editedCustomer.gender || '' : customer.gender || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  isEditing ? 'border-gray-300' : 'border-transparent bg-gray-50'
                }`}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Address Information</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
                <input
                  type="text"
                  name="address_line1"
                  value={isEditing ? editedCustomer.address_line1 || '' : customer.address_line1 || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    isEditing ? 'border-gray-300' : 'border-transparent bg-gray-50'
                  }`}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address Line 2</label>
                <input
                  type="text"
                  name="address_line2"
                  value={isEditing ? editedCustomer.address_line2 || '' : customer.address_line2 || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    isEditing ? 'border-gray-300' : 'border-transparent bg-gray-50'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  name="city"
                  value={isEditing ? editedCustomer.city || '' : customer.city || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    isEditing ? 'border-gray-300' : 'border-transparent bg-gray-50'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">State/Province</label>
                <input
                  type="text"
                  name="state"
                  value={isEditing ? editedCustomer.state || '' : customer.state || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    isEditing ? 'border-gray-300' : 'border-transparent bg-gray-50'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                <input
                  type="text"
                  name="postal_code"
                  value={isEditing ? editedCustomer.postal_code || '' : customer.postal_code || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    isEditing ? 'border-gray-300' : 'border-transparent bg-gray-50'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <input
                  type="text"
                  name="country"
                  value={isEditing ? editedCustomer.country || '' : customer.country || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    isEditing ? 'border-gray-300' : 'border-transparent bg-gray-50'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Business Information</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <input
                  type="text"
                  name="company_name"
                  value={isEditing ? editedCustomer.company_name || '' : customer.company_name || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    isEditing ? 'border-gray-300' : 'border-transparent bg-gray-50'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tax ID/VAT Number</label>
                <input
                  type="text"
                  name="tax_id"
                  value={isEditing ? editedCustomer.tax_id || '' : customer.tax_id || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    isEditing ? 'border-gray-300' : 'border-transparent bg-gray-50'
                  }`}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              name="notes"
              rows={4}
              value={isEditing ? editedCustomer.notes || '' : customer.notes || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                isEditing ? 'border-gray-300' : 'border-transparent bg-gray-50'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Created</label>
              <input
                type="text"
                value={new Date(customer.created_at).toLocaleDateString()}
                disabled
                className="mt-1 block w-full border-transparent bg-gray-50 rounded-md shadow-sm py-2 px-3 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Updated</label>
              <input
                type="text"
                value={new Date(customer.updated_at).toLocaleDateString()}
                disabled
                className="mt-1 block w-full border-transparent bg-gray-50 rounded-md shadow-sm py-2 px-3 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}