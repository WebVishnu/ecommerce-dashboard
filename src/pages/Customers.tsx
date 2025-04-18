import React, { useEffect, useState } from 'react';
import { Users, Plus, Trash2, Edit, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import Table, { Column, PaginationState } from '../components/Table';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page, pagination.pageSize, searchTerm]);

  async function fetchCustomers() {
    try {
      setLoading(true);
      
      // Get total count
      const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .ilike('name', `%${searchTerm}%`);

      // Fetch paginated data
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .range(
          (pagination.page - 1) * pagination.pageSize,
          pagination.page * pagination.pageSize - 1
        );

      if (error) throw error;
      
      setCustomers(data || []);
      setPagination(prev => ({ ...prev, total: count || 0 }));
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this customer? This will also delete all associated orders.')) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Failed to delete customer. Please try again.');
    }
  };

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination(prev => ({
      ...prev,
      page,
      pageSize
    }));
  };

  const columns: Column<Customer>[] = [
    {
      header: 'Name',
      accessor: 'name',
      className: 'text-sm font-medium text-gray-900'
    },
    {
      header: 'Contact',
      accessor: (customer) => (
        <div>
          <div className="text-sm text-gray-900">{customer.email}</div>
          <div className="text-sm text-gray-500">{customer.phone || '-'}</div>
        </div>
      )
    },
    {
      header: 'Company',
      accessor: (customer) => customer.company_name || '-',
      className: 'text-sm text-gray-500'
    },
    {
      header: 'Location',
      accessor: (customer) => (
        <div className="text-sm text-gray-500">
          {[customer.city, customer.country].filter(Boolean).join(', ') || '-'}
        </div>
      )
    },
    {
      header: 'Created',
      accessor: (customer) => new Date(customer.created_at).toLocaleDateString(),
      className: 'text-sm text-gray-500'
    }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
        </div>
        <Link
          to="/customers/create"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Link>
      </div>

      <Table
        data={customers}
        columns={columns}
        onRowClick={(customer) => navigate(`/customers/${customer.id}`)}
        searchPlaceholder="Search customers..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        isLoading={loading}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        actions={(customer) => (
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={(e) => handleDelete(e, customer.id)}
              className="text-red-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        )}
      />
    </div>
  );
}