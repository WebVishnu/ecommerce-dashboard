import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Cat as Categories,
  ShoppingCart,
  Users,
  Boxes,
  ChevronLeft,
  ChevronRight,
  UserCog,
  LogOut,
  Building2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/products', icon: Package, label: 'Products' },
  { path: '/categories', icon: Categories, label: 'Categories' },
  { path: '/orders', icon: ShoppingCart, label: 'Orders' },
  { path: '/customers', icon: Users, label: 'Customers' },
  { path: '/inventory', icon: Boxes, label: 'Inventory' },
  { path: '/profile', icon: UserCog, label: 'Profile' },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  async function fetchCompanySettings() {
    try {
      const { data } = await supabase
        .from('company_settings')
        .select('name, logo_url')
        .limit(1)
        .single();

      if (data) {
        setCompanyName(data.name);
        setCompanyLogo(data.logo_url || '');
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="relative">
      <div
        className={`fixed top-0 left-0 h-screen bg-gray-900 text-white transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-800">
          {!isCollapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              {companyLogo ? (
                <img 
                  src={companyLogo} 
                  alt="Company Logo" 
                  className="h-8 w-8 object-contain rounded"
                />
              ) : (
                <Building2 className="h-8 w-8" />
              )}
              <h1 className="text-xl font-bold truncate">{companyName || 'Dashboard'}</h1>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-800 rounded-lg"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="mt-4 flex flex-col h-[calc(100vh-5rem)] justify-between">
          <div>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Icon size={20} />
                  {!isCollapsed && <span className="ml-4">{item.label}</span>}
                </Link>
              );
            })}
          </div>

          <div className="mb-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <LogOut size={20} />
              {!isCollapsed && <span className="ml-4">Logout</span>}
            </button>
          </div>
        </nav>
      </div>
      {/* This div maintains layout spacing when sidebar is fixed */}
      <div className={`${isCollapsed ? 'w-16' : 'w-64'}`} />
    </div>
  );
}