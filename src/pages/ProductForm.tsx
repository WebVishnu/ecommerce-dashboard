import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Package2, Upload, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import Dropdown, { Option } from '../components/Dropdown';

interface ProductFormData {
  name: string;
  description: string;
  sku: string;
  price: string;
  category_id: string;
  image_url?: string;
  initial_stock: number;
  minimum_stock: number;
  variants: Variant[];
}

interface Variant {
  id?: string;
  variant_name: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  minimum_quantity: number;
  is_default: boolean;
}

interface Category {
  id: string;
  name: string;
}

const defaultVariant: Variant = {
  variant_name: '',
  size: '',
  color: '',
  price: 0,
  quantity: 0,
  minimum_quantity: 5,
  is_default: false
};

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    sku: '',
    price: '',
    category_id: '',
    initial_stock: 0,
    minimum_stock: 5,
    variants: []
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [skuError, setSkuError] = useState<string>('');
  const [hasVariants, setHasVariants] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (id) {
      fetchProduct();
    }
  }, [id]);

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  async function fetchProduct() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          variants:product_variants(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          name: data.name,
          description: data.description || '',
          sku: data.sku,
          price: data.price.toString(),
          category_id: data.category_id || '',
          image_url: data.image_url,
          initial_stock: data.initial_stock || 0,
          minimum_stock: data.minimum_stock || 5,
          variants: data.variants.length > 0 ? data.variants : []
        });
        setHasVariants(data.variants.length > 0);
        if (data.image_url) {
          setPreviewUrl(data.image_url);
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      navigate('/products');
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'initial_stock' || name === 'minimum_stock' ? parseInt(value) || 0 : value
    }));
    
    if (name === 'sku') {
      setSkuError('');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCreateCategory = async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name }])
        .select()
        .single();

      if (error) throw error;
      
      setCategories([...categories, data]);
      setFormData(prev => ({ ...prev, category_id: data.id }));
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  };

  const checkSkuExists = async (sku: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .eq('sku', sku)
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        return false;
      }

      if (id && data[0].id === id) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking SKU:', error);
      return false;
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `product-images/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleVariantChange = (index: number, field: keyof Variant, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === index ? { ...variant, [field]: value } : variant
      )
    }));
  };

  const addVariant = () => {
    setHasVariants(true);
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { 
        ...defaultVariant,
        quantity: prev.initial_stock,
        minimum_quantity: prev.minimum_stock,
        price: parseFloat(prev.price) || 0,
        is_default: prev.variants.length === 0
      }]
    }));
  };

  const removeVariant = (index: number) => {
    setFormData(prev => {
      const newVariants = prev.variants.filter((_, i) => i !== index);
      if (newVariants.length === 0) {
        setHasVariants(false);
      }
      return {
        ...prev,
        variants: newVariants
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSkuError('');

    try {
      const skuExists = await checkSkuExists(formData.sku);
      if (skuExists) {
        setSkuError('This SKU is already in use. Please enter a unique SKU.');
        setLoading(false);
        return;
      }

      let imageUrl = formData.image_url;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const productData = {
        name: formData.name,
        description: formData.description,
        sku: formData.sku,
        price: parseFloat(formData.price),
        category_id: formData.category_id || null,
        image_url: imageUrl,
        initial_stock: formData.initial_stock,
        minimum_stock: formData.minimum_stock
      };

      let productId = id;
      if (id) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();
        if (error) throw error;
        productId = data.id;

        // Create variant(s)
        if (hasVariants && formData.variants.length > 0) {
          const variantPromises = formData.variants.map(variant => {
            const variantData = {
              product_id: productId,
              variant_name: variant.variant_name,
              size: variant.size || null,
              color: variant.color || null,
              price: variant.price || parseFloat(formData.price),
              quantity: variant.quantity || formData.initial_stock,
              minimum_quantity: variant.minimum_quantity || formData.minimum_stock,
              is_default: variant.is_default
            };
            return supabase.from('product_variants').insert([variantData]);
          });
          await Promise.all(variantPromises);
        } else {
          // Create a default variant with initial stock
          const { error: variantError } = await supabase
            .from('product_variants')
            .insert([{
              product_id: productId,
              quantity: formData.initial_stock,
              minimum_quantity: formData.minimum_stock,
              is_default: true
            }]);
          if (variantError) throw variantError;
        }
      }

      navigate('/products');
    } catch (error) {
      console.error('Error saving product:', error);
      setError(error instanceof Error ? error.message : 'Failed to save product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions: Option[] = categories.map(category => ({
    id: category.id,
    label: category.name
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Package2 className="h-6 w-6" />
          <h1 className="text-2xl font-semibold text-gray-900">
            {id ? 'Edit Product' : 'Create Product'}
          </h1>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Basic Product Information */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Product Image
              </label>
              <div className="mt-1 flex items-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-32 w-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Package2 className="h-10 w-10 text-gray-400" />
                  </div>
                )}
                <label className="ml-5 cursor-pointer">
                  <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <Upload className="h-5 w-5 mr-2 text-gray-400" />
                    Upload Image
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Product Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                  SKU
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  required
                  value={formData.sku}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    skuError ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {skuError && (
                  <p className="mt-1 text-sm text-red-600">
                    {skuError}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Base Price
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="block w-full pl-7 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <Dropdown
              label="Category"
              options={categoryOptions}
              value={formData.category_id}
              onChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
              onCreateOption={handleCreateCategory}
              isCreatable={true}
              placeholder="Select a category"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Stock Information */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="initial_stock" className="block text-sm font-medium text-gray-700">
                Initial Stock
              </label>
              <input
                type="number"
                id="initial_stock"
                name="initial_stock"
                min="0"
                value={formData.initial_stock}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Initial stock quantity for the product
              </p>
            </div>

            <div>
              <label htmlFor="minimum_stock" className="block text-sm font-medium text-gray-700">
                Minimum Stock Level
              </label>
              <input
                type="number"
                id="minimum_stock"
                name="minimum_stock"
                min="0"
                value={formData.minimum_stock}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Alert threshold for low stock notifications
              </p>
            </div>
          </div>

          {/* Product Variants */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Product Variants</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {hasVariants 
                    ? 'Manage different variations of your product'
                    : 'Add variants if your product comes in different sizes, colors, or other variations'}
                </p>
              </div>
              {!hasVariants ? (
                <button
                  type="button"
                  onClick={addVariant}
                  className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Variants
                </button>
              ) : (
                <button
                  type="button"
                  onClick={addVariant}
                  className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Variant
                </button>
              )}
            </div>

            {hasVariants && (
              <div className="space-y-4">
                {formData.variants.map((variant, index) => (
                  <div key={index} className="border rounded-lg p-4 relative">
                    {formData.variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Variant Name
                        </label>
                        <input
                          type="text"
                          value={variant.variant_name}
                          onChange={(e) => handleVariantChange(index, 'variant_name', e.target.value)}
                          placeholder="e.g., Basic, Premium"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Size
                        </label>
                        <input
                          type="text"
                          value={variant.size}
                          onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                          placeholder="e.g., S, M, L"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Color
                        </label>
                        <input
                          type="text"
                          value={variant.color}
                          onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                          placeholder="e.g., Red, Blue"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Price
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            value={variant.price}
                            onChange={(e) => handleVariantChange(index, 'price', parseFloat(e.target.value))}
                            min="0"
                            step="0.01"
                            className="block w-full pl-7 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Initial Stock
                        </label>
                        <input
                          type="number"
                          value={variant.quantity}
                          onChange={(e) => handleVariantChange(index, 'quantity', parseInt(e.target.value))}
                          min="0"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Minimum Stock Level
                        </label>
                        <input
                          type="number"
                          value={variant.minimum_quantity}
                          onChange={(e) => handleVariantChange(index, 'minimum_quantity', parseInt(e.target.value))}
                          min="0"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="default_variant"
                          checked={variant.is_default}
                          onChange={() => {
                            setFormData(prev => ({
                              ...prev,
                              variants: prev.variants.map((v, i) => ({
                                ...v,
                                is_default: i === index
                              }))
                            }));
                          }}
                          className="form-radio h-4 w-4 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-gray-700">Default variant</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              to="/products"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (id ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}