import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Package2, Edit, ArrowLeft, Save, X, Upload, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import Dropdown, { Option } from '../components/Dropdown';

interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  image_url?: string;
  category_id: string;
  initial_stock: number;
  minimum_stock: number;
  category: {
    name: string;
  };
  created_at: string;
  updated_at: string;
}

interface ProductVariant {
  id?: string;
  product_id: string;
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

const defaultVariant: ProductVariant = {
  product_id: '',
  variant_name: '',
  size: '',
  color: '',
  price: 0,
  quantity: 0,
  minimum_quantity: 5,
  is_default: false
};

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editedProduct, setEditedProduct] = useState<Partial<Product>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skuError, setSkuError] = useState<string | null>(null);
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
      const [productResult, variantsResult] = await Promise.all([
        supabase
          .from('products')
          .select(`
            *,
            category:categories(name)
          `)
          .eq('id', id)
          .single(),
        supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', id)
          .order('created_at')
      ]);

      if (productResult.error) throw productResult.error;
      if (variantsResult.error) throw variantsResult.error;

      setProduct(productResult.data);
      setEditedProduct(productResult.data);
      
      const variants = variantsResult.data || [];
      setVariants(variants);
      setHasVariants(variants.some(v => v.variant_name || v.size || v.color));
    } catch (error) {
      console.error('Error fetching product:', error);
      navigate('/products');
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedProduct(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'initial_stock' || name === 'minimum_stock' 
        ? parseInt(value) 
        : value
    }));
    
    if (name === 'sku') {
      setSkuError(null);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
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
      setEditedProduct(prev => ({ ...prev, category_id: data.id }));
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
        .neq('id', id)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
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

  const handleVariantChange = (index: number, field: keyof ProductVariant, value: string | number | boolean) => {
    setVariants(prev => prev.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    ));
  };

  const addVariant = () => {
    if (!product) return;
    setHasVariants(true);
    setVariants(prev => [...prev, { 
      ...defaultVariant, 
      product_id: product.id,
      quantity: editedProduct.initial_stock || 0,
      minimum_quantity: editedProduct.minimum_stock || 5,
      price: editedProduct.price || 0,
      is_default: prev.length === 0
    }]);
  };

  const removeVariant = (index: number) => {
    setVariants(prev => {
      const newVariants = prev.filter((_, i) => i !== index);
      if (newVariants.length === 0) {
        setHasVariants(false);
      }
      return newVariants;
    });
  };

  const handleSave = async () => {
    if (!product) return;
    setSaving(true);
    setError(null);
    setSkuError(null);

    try {
      if (hasVariants && !variants.some(v => v.is_default)) {
        throw new Error('One variant must be marked as default');
      }

      const skuExists = await checkSkuExists(editedProduct.sku!);
      if (skuExists) {
        setSkuError('This SKU is already in use by another product');
        setSaving(false);
        return;
      }

      let imageUrl = product.image_url;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      // Update product
      const { error: productError } = await supabase
        .from('products')
        .update({
          name: editedProduct.name,
          description: editedProduct.description,
          sku: editedProduct.sku,
          price: editedProduct.price,
          category_id: editedProduct.category_id,
          image_url: imageUrl,
          initial_stock: editedProduct.initial_stock,
          minimum_stock: editedProduct.minimum_stock
        })
        .eq('id', product.id);

      if (productError) throw productError;

      if (hasVariants) {
        // Update variants
        const variantPromises = variants.map(variant => {
          const variantData = {
            product_id: product.id,
            variant_name: variant.variant_name,
            size: variant.size || null,
            color: variant.color || null,
            price: variant.price,
            quantity: variant.quantity,
            minimum_quantity: variant.minimum_quantity,
            is_default: variant.is_default
          };

          if (variant.id) {
            return supabase
              .from('product_variants')
              .update(variantData)
              .eq('id', variant.id);
          } else {
            return supabase
              .from('product_variants')
              .insert([variantData]);
          }
        });

        await Promise.all(variantPromises);
      } else {
        // Delete all variants and create a default one
        await supabase
          .from('product_variants')
          .delete()
          .eq('product_id', product.id);

        await supabase
          .from('product_variants')
          .insert([{
            product_id: product.id,
            quantity: editedProduct.initial_stock,
            minimum_quantity: editedProduct.minimum_stock,
            is_default: true
          }]);
      }
      
      // Update the local product state with the new data
      setProduct({ 
        ...product, 
        ...editedProduct,
        image_url: imageUrl,
        category: categories.find(c => c.id === editedProduct.category_id) 
          ? { name: categories.find(c => c.id === editedProduct.category_id)!.name }
          : product.category
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating product:', error);
      setError(error instanceof Error ? error.message : 'Failed to update product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions: Option[] = categories.map(category => ({
    id: category.id,
    label: category.name
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Package2 className="h-6 w-6" />
          <h1 className="text-2xl font-semibold text-gray-900">Product Details</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/products"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedProduct(product);
                  setImageFile(null);
                  fetchProduct(); // Reset variants too
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
              Edit Product
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <form className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Product Image
              </label>
              <div className="mt-1 flex items-center">
                {(imageFile || product.image_url) ? (
                  <img
                    src={imageFile ? URL.createObjectURL(imageFile) : product.image_url}
                    alt={product.name}
                    className="h-32 w-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Package2 className="h-10 w-10 text-gray-400" />
                  </div>
                )}
                {isEditing && (
                  <label className="ml-5 cursor-pointer">
                    <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                      <Upload className="h-5 w-5 mr-2" />
                      Upload Image
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
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
                  value={isEditing ? editedProduct.name : product.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    isEditing ? 'border-gray-300' : 'border-transparent bg-gray-50'
                  }`}
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
                  value={isEditing ? editedProduct.sku : product.sku}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    skuError ? 'border-red-300' : isEditing ? 'border-gray-300' : 'border-transparent bg-gray-50'
                  }`}
                />
                {skuError && (
                  <p className="mt-1 text-sm text-red-600">{skuError}</p>
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
                    value={isEditing ? editedProduct.price : product.price}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    step="0.01"
                    className={`block w-full pl-7 border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      isEditing ? 'border-gray-300' : 'border-transparent bg-gray-50'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            {isEditing ? (
              <Dropdown
                options={categoryOptions}
                value={editedProduct.category_id || ''}
                onChange={(value) => setEditedProduct(prev => ({ ...prev, category_id: value }))}
                onCreateOption={handleCreateCategory}
                isCreatable={true}
                placeholder="Select a category"
                className="mt-1"
              />
            ) : (
              <input
                type="text"
                value={product.category?.name || '-'}
                disabled
                className="mt-1 block w-full border-transparent bg-gray-50 rounded-md shadow-sm py-2 px-3 sm:text-sm"
              />
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={isEditing ? editedProduct.description : product.description}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                isEditing ? 'border-gray-300' : 'border-transparent bg-gray-50'
              }`}
            />
          </div>

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
                value={isEditing ? editedProduct.initial_stock : product.initial_stock}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  isEditing ? 'border-gray-300' : 'border-transparent bg-gray-50'
                }`}
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
                value={isEditing ? editedProduct.minimum_stock : product.minimum_stock}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  isEditing ? 'border-gray-300' : 'border-transparent bg-gray-50'
                }`}
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
              {isEditing && !hasVariants && (
                <button
                  type="button"
                  onClick={addVariant}
                  className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Variants
                </button>
              )}
              {isEditing && hasVariants && (
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
                {variants.map((variant, index) => (
                  <div key={index} className="border rounded-lg p-4 relative">
                    {isEditing && variants.length > 1 && (
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
                          disabled={!isEditing}
                          className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            isEditing ? 'border-gray-300' : 'border-transparent bg-gray-50'
                          }`}
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
                          disabled={!isEditing}
                          className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            isEditing ? 'border-gray-300' : 'border-transparent bg-gray-50'
                          }`}
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
                          disabled={!isEditing}
                          className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            isEditing ? 'border-gray-300' : 'border-transparent bg-gray-50'
                          }`}
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
                            disabled={!isEditing}
                            className={`block w-full pl-7 border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                              isEditing ? 'border-gray-300' : 'border-transparent bg-gray-50'
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Current Stock
                        </label>
                        <input
                          type="number"
                          value={variant.quantity}
                          onChange={(e) => handleVariantChange(index, 'quantity', parseInt(e.target.value))}
                          min="0"
                          disabled={!isEditing}
                          className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            isEditing ? 'border-gray-300' : 'border-transparent bg-gray-50'
                          }`}
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
                          disabled={!isEditing}
                          className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            isEditing ? 'border-gray-300' : 'border-transparent bg-gray-50'
                          }`}
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
                            if (isEditing) {
                              setVariants(prev => prev.map((v, i) => ({
                                ...v,
                                is_default: i === index
                              })));
                            }
                          }}
                          disabled={!isEditing}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Created</label>
              <input
                type="text"
                value={new Date(product.created_at).toLocaleDateString()}
                disabled
                className="mt-1 block w-full border-transparent bg-gray-50 rounded-md shadow-sm py-2 px-3 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Updated</label>
              <input
                type="text"
                value={new Date(product.updated_at).toLocaleDateString()}
                disabled
                className="mt-1 block w-full border-transparent bg-gray-50 rounded-md shadow-sm py-2 px-3 sm:text-sm"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}