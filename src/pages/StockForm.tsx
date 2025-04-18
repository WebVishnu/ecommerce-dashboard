import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Boxes, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Dropdown, { Option } from '../components/Dropdown';

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface StockFormData {
  product_id: string;
  size: string;
  color: string;
  quantity: number;
}

export default function StockForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<StockFormData>({
    product_id: '',
    size: '',
    color: '',
    quantity: 0
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku')
        .order('name');
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_id) {
      alert('Please select a product');
      return;
    }

    setLoading(true);
    try {
      // Check if variant exists
      const { data: existingVariant } = await supabase
        .from('product_variants')
        .select('id, quantity')
        .eq('product_id', formData.product_id)
        .eq('size', formData.size || null)
        .eq('color', formData.color || null)
        .single();

      if (existingVariant) {
        // Update existing variant
        const { error } = await supabase
          .from('product_variants')
          .update({
            quantity: existingVariant.quantity + formData.quantity
          })
          .eq('id', existingVariant.id);

        if (error) throw error;
      } else {
        // Create new variant
        const { error } = await supabase
          .from('product_variants')
          .insert([{
            product_id: formData.product_id,
            size: formData.size || null,
            color: formData.color || null,
            quantity: formData.quantity
          }]);

        if (error) throw error;
      }

      navigate('/inventory');
    } catch (error) {
      console.error('Error saving stock:', error);
      alert('Failed to save stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const productOptions: Option[] = products.map(product => ({
    id: product.id,
    label: `${product.name} (SKU: ${product.sku})`
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Boxes className="h-6 w-6" />
          <h1 className="text-2xl font-semibold text-gray-900">Add Stock</h1>
        </div>
        <Link
          to="/inventory"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inventory
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <Dropdown
              label="Select Product"
              options={productOptions}
              value={formData.product_id}
              onChange={(value) => setFormData(prev => ({ ...prev, product_id: value }))}
              placeholder="Choose a product"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="size" className="block text-sm font-medium text-gray-700">
                Size (optional)
              </label>
              <input
                type="text"
                id="size"
                name="size"
                value={formData.size}
                onChange={handleInputChange}
                placeholder="e.g., S, M, L, XL, or specific dimensions"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                Color (optional)
              </label>
              <input
                type="text"
                id="color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                placeholder="e.g., Red, Blue, Green"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                Quantity to Add *
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                required
                min="1"
                value={formData.quantity}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              to="/inventory"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Adding Stock...' : 'Add Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}