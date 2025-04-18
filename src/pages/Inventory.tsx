import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, Plus, ArrowUpDown, Edit, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Table, { Column, PaginationState } from '../components/Table';

interface ProductVariant {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  quantity: number;
  minimum_quantity: number;
  created_at: string;
  updated_at: string;
  product: {
    name: string;
    sku: string;
    category: {
      name: string;
    } | null;
  };
}

export default function Inventory() {
  const [inventory, setInventory] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedQuantity, setEditedQuantity] = useState<number>(0);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    fetchInventory();
  }, [pagination.page, pagination.pageSize]);

  async function fetchInventory() {
    try {
      setLoading(true);
      
      // Get total count
      const { count } = await supabase
        .from('product_variants')
        .select('*', { count: 'exact', head: true });

      // Fetch paginated data
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          *,
          product:products!inner(
            name,
            sku,
            category:categories(name)
          )
        `)
        .order('created_at', { ascending: false })
        .range(
          (pagination.page - 1) * pagination.pageSize,
          pagination.page * pagination.pageSize - 1
        );

      if (error) throw error;
      
      setInventory(data || []);
      setPagination(prev => ({ ...prev, total: count || 0 }));
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleQuantityChange = async (id: string, newQuantity: number) => {
    try {
      // PostgreSQL integer limits
      const MAX_INTEGER = 2147483647;
      const MIN_INTEGER = -2147483648;

      if (newQuantity > MAX_INTEGER || newQuantity < MIN_INTEGER) {
        alert('Please enter a valid quantity between -2,147,483,648 and 2,147,483,647');
        return;
      }

      if (newQuantity < 0) {
        alert('Quantity cannot be negative');
        return;
      }

      const { error } = await supabase
        .from('product_variants')
        .update({ quantity: newQuantity })
        .eq('id', id);

      if (error) throw error;
      
      setInventory(prev =>
        prev.map(item =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );
      setEditingId(null);
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Failed to update quantity. Please try again.');
    }
  };

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination(prev => ({
      ...prev,
      page,
      pageSize
    }));
  };

  const getStockStatus = (quantity: number, minQuantity: number) => {
    if (quantity === 0) {
      return {
        label: 'Out of Stock',
        className: 'bg-red-100 text-red-800'
      };
    } else if (quantity <= minQuantity) {
      return {
        label: 'Low Stock',
        className: 'bg-yellow-100 text-yellow-800'
      };
    } else {
      return {
        label: 'In Stock',
        className: 'bg-green-100 text-green-800'
      };
    }
  };

  const columns: Column<ProductVariant>[] = [
    {
      header: 'Product',
      accessor: (variant) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{variant.product?.name || 'Unknown Product'}</div>
          <div className="text-xs text-gray-500">SKU: {variant.product?.sku || 'N/A'}</div>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: (variant) => variant.product?.category?.name || '-',
      className: 'text-sm text-gray-500'
    },
    {
      header: 'Variant',
      accessor: (variant) => (
        <div className="text-sm text-gray-500">
          {[variant.size, variant.color].filter(Boolean).join(' - ') || 'Default'}
        </div>
      )
    },
    {
      header: 'Quantity',
      accessor: (variant) => (
        <div className="flex items-center space-x-2">
          {editingId === variant.id ? (
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={editedQuantity}
                onChange={(e) => setEditedQuantity(parseInt(e.target.value) || 0)}
                className="w-20 px-2 py-1 border rounded-md"
                min="0"
                max="2147483647"
              />
              <button
                onClick={() => handleQuantityChange(variant.id, editedQuantity)}
                className="text-green-600 hover:text-green-700"
              >
                <Save className="h-4 w-4" />
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="text-gray-600 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-sm">{variant.quantity}</span>
              <button
                onClick={() => {
                  setEditingId(variant.id);
                  setEditedQuantity(variant.quantity);
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                <Edit className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Min. Stock',
      accessor: (variant) => (
        <div className="text-sm text-gray-500">
          {variant.minimum_quantity}
        </div>
      )
    },
    {
      header: 'Stock Status',
      accessor: (variant) => {
        const status = getStockStatus(variant.quantity, variant.minimum_quantity);
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.className}`}>
            {status.label}
          </span>
        );
      }
    }
  ];

  const getInventoryStats = () => {
    return {
      outOfStock: inventory.filter(item => item.quantity === 0).length,
      lowStock: inventory.filter(item => item.quantity > 0 && item.quantity <= item.minimum_quantity).length,
      inStock: inventory.filter(item => item.quantity > item.minimum_quantity).length
    };
  };

  const stats = getInventoryStats();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Boxes className="h-6 w-6" />
          <h1 className="text-2xl font-semibold text-gray-900">Inventory Management</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchInventory()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Refresh Stock
          </button>
          <Link
            to="/inventory/stock/add"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Stock
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Products</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{pagination.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Out of Stock</h3>
          <p className="mt-2 text-3xl font-semibold text-red-600">{stats.outOfStock}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Low Stock</h3>
          <p className="mt-2 text-3xl font-semibold text-yellow-600">{stats.lowStock}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">In Stock</h3>
          <p className="mt-2 text-3xl font-semibold text-green-600">{stats.inStock}</p>
        </div>
      </div>

      <Table
        data={inventory}
        columns={columns}
        isLoading={loading}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
      />
    </div>
  );
}