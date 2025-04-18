import React, { useEffect, useState } from 'react';
import { Cat, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Table, { Column, PaginationState } from '../components/Table';
import Dropdown, { Option } from '../components/Dropdown';

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  icon_url: string | null;
  created_at: string;
  parent?: {
    name: string;
  };
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    parent_id: '',
    icon_url: ''
  });
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    fetchCategories();
  }, [pagination.page, pagination.pageSize, searchTerm]);

  async function fetchCategories() {
    try {
      setLoading(true);
      
      // First, get the total count
      const { count } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .ilike('name', `%${searchTerm}%`);

      // Then fetch the paginated data
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          parent:categories(name)
        `)
        .ilike('name', `%${searchTerm}%`)
        .order('name')
        .range(
          (pagination.page - 1) * pagination.pageSize,
          pagination.page * pagination.pageSize - 1
        );

      if (error) throw error;
      
      setCategories(data || []);
      setPagination(prev => ({ ...prev, total: count || 0 }));
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this category? This will affect all associated products.')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh the current page
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category. Make sure it has no associated products first.');
    }
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;

    setIsCreating(true);
    try {
      const { error } = await supabase
        .from('categories')
        .insert([{
          name: newCategory.name,
          parent_id: newCategory.parent_id || null,
          icon_url: newCategory.icon_url || null
        }]);

      if (error) throw error;
      
      setNewCategory({ name: '', parent_id: '', icon_url: '' });
      setIsCreating(false);
      fetchCategories();
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination(prev => ({
      ...prev,
      page,
      pageSize
    }));
  };

  const columns: Column<Category>[] = [
    {
      header: 'Category Name',
      accessor: 'name',
      className: 'text-sm font-medium text-gray-900'
    },
    {
      header: 'Parent Category',
      accessor: (category) => category.parent?.name || '-',
      className: 'text-sm text-gray-500'
    },
    {
      header: 'Created',
      accessor: (category) => new Date(category.created_at).toLocaleDateString(),
      className: 'text-sm text-gray-500'
    }
  ];

  const parentOptions: Option[] = categories.map(category => ({
    id: category.id,
    label: category.name
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Cat className="h-6 w-6" />
          <h1 className="text-2xl font-semibold text-gray-900">Categories</h1>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </button>
      </div>

      {isCreating && (
        <div className="bg-white rounded-lg shadow mb-6">
          <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Category Name
              </label>
              <input
                type="text"
                id="name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <Dropdown
                label="Parent Category"
                options={parentOptions}
                value={newCategory.parent_id}
                onChange={(value) => setNewCategory({ ...newCategory, parent_id: value })}
                placeholder="Select parent category (optional)"
              />
            </div>

            <div>
              <label htmlFor="icon_url" className="block text-sm font-medium text-gray-700">
                Icon URL
              </label>
              <input
                type="url"
                id="icon_url"
                value={newCategory.icon_url}
                onChange={(e) => setNewCategory({ ...newCategory, icon_url: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="https://example.com/icon.png"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Category
              </button>
            </div>
          </form>
        </div>
      )}

      <Table
        data={categories}
        columns={columns}
        searchPlaceholder="Search categories..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        isLoading={loading}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        actions={(category) => (
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={(e) => handleDelete(e, category.id)}
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