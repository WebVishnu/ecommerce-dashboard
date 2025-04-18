import React, { useEffect, useState } from 'react';
import { Package2, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import Table, { Column, PaginationState } from '../components/Table';

interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  image_url?: string;
  category: {
    name: string;
  };
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, [pagination.page, pagination.pageSize, searchTerm]);

  async function fetchProducts() {
    try {
      setLoading(true);
      
      // First, get the total count
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .ilike('name', `%${searchTerm}%`);

      // Then fetch the paginated data
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name)
        `)
        .ilike('name', `%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .range(
          (pagination.page - 1) * pagination.pageSize,
          pagination.page * pagination.pageSize - 1
        );

      if (error) throw error;
      
      setProducts(data || []);
      setPagination(prev => ({ ...prev, total: count || 0 }));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh the current page
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  }

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination(prev => ({
      ...prev,
      page,
      pageSize
    }));
  };

  const columns: Column<Product>[] = [
    {
      header: 'Product',
      accessor: (product) => (
        <div className="flex items-center">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Package2 className="h-5 w-5 text-gray-400" />
            </div>
          )}
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{product.name}</div>
            <div className="text-sm text-gray-500">{product.description}</div>
          </div>
        </div>
      )
    },
    {
      header: 'SKU',
      accessor: 'sku',
      className: 'text-sm text-gray-500'
    },
    {
      header: 'Category',
      accessor: (product) => product.category?.name || '-',
      className: 'text-sm text-gray-500'
    },
    {
      header: 'Price',
      accessor: (product) => `$${product.price.toFixed(2)}`,
      className: 'text-sm text-gray-500'
    }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Package2 className="h-6 w-6" />
          <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
        </div>
        <Link
          to="/products/create"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Link>
      </div>

      <Table
        data={products}
        columns={columns}
        onRowClick={(product) => navigate(`/products/${product.id}`)}
        searchPlaceholder="Search products..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        isLoading={loading}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        actions={(product) => (
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={(e) => handleDelete(e, product.id)}
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