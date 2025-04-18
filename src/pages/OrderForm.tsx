import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Plus, Trash2, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Dropdown, { Option } from '../components/Dropdown';

interface Customer {
  id: string;
  name: string;
  email: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  variants: ProductVariant[];
}

interface ProductVariant {
  id: string;
  variant_name: string;
  size: string | null;
  color: string | null;
  price: number;
  quantity: number;
}

interface OrderItem {
  product_id: string;
  variant_id: string | null;
  quantity: number;
  price: number;
  product?: Product;
  variant?: ProductVariant;
}

interface DeliveryAddress {
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export default function OrderForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [items, setItems] = useState<OrderItem[]>([{
    product_id: '',
    variant_id: null,
    quantity: 1,
    price: 0
  }]);
  const [useCustomerAddress, setUseCustomerAddress] = useState(true);
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: ''
  });
  const [charges, setCharges] = useState({
    tax_rate: 0.1, // 10% tax rate
    shipping_amount: 10, // Fixed shipping rate
    discount_amount: 0
  });

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedCustomer && useCustomerAddress) {
      const customer = customers.find(c => c.id === selectedCustomer);
      if (customer) {
        setDeliveryAddress({
          address_line1: customer.address_line1 || '',
          address_line2: customer.address_line2 || '',
          city: customer.city || '',
          state: customer.state || '',
          postal_code: customer.postal_code || '',
          country: customer.country || ''
        });
      }
    }
  }, [selectedCustomer, useCustomerAddress]);

  async function fetchCustomers() {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  }

  async function fetchProducts() {
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          sku,
          price,
          variants:product_variants(
            id,
            variant_name,
            size,
            color,
            price,
            quantity
          )
        `)
        .order('name');

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Only look for default variant if the product has variants with stock
    const hasVariantsInStock = product.variants.some(v => v.quantity > 0);
    const defaultVariant = hasVariantsInStock ? 
      product.variants.find(v => v.quantity > 0 && v.variant_name) : null;
    
    setItems(prev => prev.map((item, i) => 
      i === index ? {
        product_id: productId,
        variant_id: defaultVariant?.id || null,
        quantity: 1,
        price: defaultVariant?.price || product.price,
        product,
        variant: defaultVariant
      } : item
    ));
  };

  const handleVariantChange = (index: number, variantId: string) => {
    const item = items[index];
    if (!item.product) return;

    const variant = item.product.variants.find(v => v.id === variantId);
    if (!variant) return;

    setItems(prev => prev.map((item, i) => 
      i === index ? {
        ...item,
        variant_id: variantId,
        price: variant.price,
        variant
      } : item
    ));
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity } : item
    ));
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      product_id: '',
      variant_id: null,
      quantity: 1,
      price: 0
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      alert('Order must have at least one item');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = subtotal * charges.tax_rate;
    return subtotal + tax + charges.shipping_amount - charges.discount_amount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }

    if (items.some(item => !item.product_id)) {
      alert('Please select products for all items');
      return;
    }

    if (!deliveryAddress.address_line1 || !deliveryAddress.city || !deliveryAddress.postal_code) {
      alert('Please provide a complete delivery address');
      return;
    }

    setLoading(true);
    try {
      const subtotal = calculateSubtotal();
      const tax = subtotal * charges.tax_rate;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_id: selectedCustomer,
          status: 'pending',
          subtotal_amount: subtotal,
          tax_amount: tax,
          shipping_amount: charges.shipping_amount,
          discount_amount: charges.discount_amount,
          delivery_address_line1: deliveryAddress.address_line1,
          delivery_address_line2: deliveryAddress.address_line2 || null,
          delivery_city: deliveryAddress.city,
          delivery_state: deliveryAddress.state || null,
          delivery_postal_code: deliveryAddress.postal_code,
          delivery_country: deliveryAddress.country || null
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      navigate(`/orders/${order.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const customerOptions: Option[] = customers.map(customer => ({
    id: customer.id,
    label: `${customer.name} (${customer.email})`
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-6 w-6" />
          <h1 className="text-2xl font-semibold text-gray-900">Create Order</h1>
        </div>
        <Link
          to="/orders"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h2>
            <Dropdown
              label="Select Customer"
              options={customerOptions}
              value={selectedCustomer}
              onChange={setSelectedCustomer}
              placeholder="Choose a customer"
              className="max-w-xl"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Delivery Address</h2>
            
            {selectedCustomer && (
              <div className="mb-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={useCustomerAddress}
                    onChange={(e) => setUseCustomerAddress(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Use customer's address
                  </span>
                </label>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Address Line 1
                </label>
                <input
                  type="text"
                  value={deliveryAddress.address_line1}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, address_line1: e.target.value }))}
                  disabled={useCustomerAddress}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={deliveryAddress.address_line2}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, address_line2: e.target.value }))}
                  disabled={useCustomerAddress}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  value={deliveryAddress.city}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, city: e.target.value }))}
                  disabled={useCustomerAddress}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  State/Province
                </label>
                <input
                  type="text"
                  value={deliveryAddress.state}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, state: e.target.value }))}
                  disabled={useCustomerAddress}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={deliveryAddress.postal_code}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, postal_code: e.target.value }))}
                  disabled={useCustomerAddress}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                <input
                  type="text"
                  value={deliveryAddress.country}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, country: e.target.value }))}
                  disabled={useCustomerAddress}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Order Items</h2>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => {
                const hasVariantsInStock = item.product?.variants.some(v => v.quantity > 0 && v.variant_name);

                return (
                  <div key={index} className="border rounded-lg p-4 relative">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className={`lg:col-span-${hasVariantsInStock ? '2' : '3'}`}>
                        <label className="block text-sm font-medium text-gray-700">
                          Product
                        </label>
                        <select
                          value={item.product_id}
                          onChange={(e) => handleProductChange(index, e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="">Select a product</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>
                              {product.name} (SKU: {product.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      {hasVariantsInStock && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Variant
                          </label>
                          <select
                            value={item.variant_id || ''}
                            onChange={(e) => handleVariantChange(index, e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            {item.product?.variants
                              .filter(v => v.variant_name)
                              .map(variant => (
                                <option
                                  key={variant.id}
                                  value={variant.id}
                                  disabled={variant.quantity === 0}
                                >
                                  {variant.variant_name}
                                  {variant.quantity === 0 ? ' (Out of Stock)' : ''}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, parseInt(e.target.value))}
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
                            value={item.price}
                            readOnly
                            className="block w-full pl-7 border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {item.product && (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <Package className="h-4 w-4 mr-1" />
                        Subtotal: ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Tax Rate (%)</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={charges.tax_rate * 100}
                      onChange={(e) => setCharges(prev => ({
                        ...prev,
                        tax_rate: parseFloat(e.target.value) / 100
                      }))}
                      className="w-20 border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <span className="text-gray-900">${(calculateSubtotal() * charges.tax_rate).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="text-gray-900">${charges.shipping_amount.toFixed(2)}</span>
                </div>
                {charges.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Discount</span>
                    <span className="text-red-600">-${charges.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-medium text-gray-900 pt-2 border-t border-gray-200">
                  <p>Total</p>
                  <p>${calculateTotal().toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            to="/orders"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating Order...' : 'Create Order'}
          </button>
        </div>
      </form>
    </div>
  );
}