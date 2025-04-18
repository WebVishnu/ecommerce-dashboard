import React, { useState, useEffect } from 'react';
import { UserCog, Building2, Upload, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface CompanySettings {
  id: string;
  name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  tax_id: string;
  logo_url: string;
}

const defaultCompanySettings: Omit<CompanySettings, 'id'> = {
  name: 'My Company',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
  phone: '',
  email: '',
  website: '',
  tax_id: '',
  logo_url: ''
};

export default function Profile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    id: '',
    ...defaultCompanySettings
  });
  const [credentials, setCredentials] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  async function fetchCompanySettings() {
    try {
      // First, try to get existing settings
      let { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      // If no settings exist, create default settings
      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from('company_settings')
          .insert([defaultCompanySettings])
          .select()
          .single();

        if (insertError) throw insertError;
        data = newData;
      }

      if (data) {
        setCompanySettings(data);
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
      setError('Failed to load company settings');
    }
  }

  const handleCompanyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanySettings(prev => ({ ...prev, [name]: value }));
  };

  const handleCredentialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  const uploadLogo = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `company-logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('company')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('company')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSaveCompanySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let logoUrl = companySettings.logo_url;
      if (imageFile) {
        logoUrl = await uploadLogo(imageFile);
      }

      const { error } = await supabase
        .from('company_settings')
        .upsert([{
          ...companySettings,
          logo_url: logoUrl
        }]);

      if (error) throw error;
      
      setSuccess('Company settings saved successfully');
      setCompanySettings(prev => ({ ...prev, logo_url: logoUrl }));
    } catch (error) {
      console.error('Error saving company settings:', error);
      setError('Failed to save company settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (credentials.newPassword !== credentials.confirmPassword) {
        throw new Error('New passwords do not match');
      }

      const { error } = await supabase.auth.updateUser({
        password: credentials.newPassword
      });

      if (error) throw error;
      
      setSuccess('Password changed successfully');
      setCredentials({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      setError(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <UserCog className="h-6 w-6" />
        <h1 className="text-2xl font-semibold text-gray-900">Profile Settings</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Company Information */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="h-5 w-5" />
              <h2 className="text-lg font-medium text-gray-900">Company Information</h2>
            </div>

            <form onSubmit={handleSaveCompanySettings} className="space-y-6">
              <div className="flex items-center space-x-6">
                {companySettings.logo_url ? (
                  <img
                    src={companySettings.logo_url}
                    alt="Company logo"
                    className="h-24 w-24 object-contain"
                  />
                ) : (
                  <div className="h-24 w-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Logo
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={companySettings.name}
                    onChange={handleCompanyInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tax ID
                  </label>
                  <input
                    type="text"
                    name="tax_id"
                    value={companySettings.tax_id}
                    onChange={handleCompanyInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    name="address_line1"
                    value={companySettings.address_line1}
                    onChange={handleCompanyInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    name="address_line2"
                    value={companySettings.address_line2}
                    onChange={handleCompanyInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={companySettings.city}
                    onChange={handleCompanyInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    State/Province
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={companySettings.state}
                    onChange={handleCompanyInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    value={companySettings.postal_code}
                    onChange={handleCompanyInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={companySettings.country}
                    onChange={handleCompanyInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={companySettings.phone}
                    onChange={handleCompanyInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={companySettings.email}
                    onChange={handleCompanyInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={companySettings.website}
                    onChange={handleCompanyInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Company Settings
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Change Password</h2>

            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={credentials.currentPassword}
                  onChange={handleCredentialsChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={credentials.newPassword}
                  onChange={handleCredentialsChange}
                  required
                  minLength={6}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={credentials.confirmPassword}
                  onChange={handleCredentialsChange}
                  required
                  minLength={6}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}
      </div>
    </div>
  );
}