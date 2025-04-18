import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Package, Printer } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CompanySettings {
  name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  tax_id: string;
  logo_url: string | null;
}

interface OrderItem {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  price: number;
  product: {
    name: string;
    sku: string;
  };
  variant: {
    size: string | null;
    color: string | null;
  } | null;
}

interface Order {
  id: string;
  customer_id: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  subtotal_amount: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  created_at: string;
  updated_at: string;
  delivery_address_line1: string;
  delivery_address_line2: string | null;
  delivery_city: string;
  delivery_state: string;
  delivery_postal_code: string;
  delivery_country: string;
  customer: {
    name: string;
    email: string;
    phone: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
  };
  order_items: OrderItem[];
}

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchOrder(), fetchCompanySettings()]).finally(() => setLoading(false));
  }, [id]);

  async function fetchCompanySettings() {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      setCompanySettings(data);
    } catch (error) {
      console.error('Error fetching company settings:', error);
    }
  }

  async function fetchOrder() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(
            name,
            email,
            phone,
            address_line1,
            address_line2,
            city,
            state,
            postal_code,
            country
          ),
          order_items(
            id,
            product_id,
            variant_id,
            quantity,
            price,
            product:products(name, sku),
            variant:product_variants(size, color)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
      navigate('/orders');
    }
  }

  const handleStatusChange = async (newStatus: Order['status']) => {
    if (!order) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (error) throw error;
      
      setOrder(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const numberToWords = (num: number) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    if (num === 0) return 'Zero';
    
    const convertLessThanThousand = (n: number): string => {
      if (n === 0) return '';
      
      let result = '';
      
      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      } else if (n >= 10) {
        result += teens[n - 10] + ' ';
        return result;
      }
      
      if (n > 0) {
        result += ones[n] + ' ';
      }
      
      return result;
    };
    
    let result = '';
    let n = Math.floor(num);
    
    if (n >= 1000000) {
      result += convertLessThanThousand(Math.floor(n / 1000000)) + 'Million ';
      n %= 1000000;
    }
    
    if (n >= 1000) {
      result += convertLessThanThousand(Math.floor(n / 1000)) + 'Thousand ';
      n %= 1000;
    }
    
    result += convertLessThanThousand(n);
    
    return result.trim() + ' Only';
  };

  const printInvoice = () => {
    if (!order || !companySettings) return;

    const invoiceContent = document.createElement('div');
    invoiceContent.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="border border-gray-300 p-8">
          <!-- Header -->
          <div class="flex justify-between items-start mb-8">
            <div class="w-2/3">
              <h1 class="text-2xl font-bold mb-6">Tax Invoice</h1>
              <div class="text-sm space-y-1">
                <div class="grid grid-cols-3 gap-2">
                  <span class="font-semibold">IRN:</span>
                  <span class="col-span-2">${order.id}</span>
                </div>
                <div class="grid grid-cols-3 gap-2">
                  <span class="font-semibold">Invoice No:</span>
                  <span class="col-span-2">${order.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div class="grid grid-cols-3 gap-2">
                  <span class="font-semibold">Date:</span>
                  <span class="col-span-2">${formatDate(order.created_at)}</span>
                </div>
              </div>
            </div>
            <div class="w-1/3 text-right">
              <div class="text-xl font-bold mb-2">e-Invoice</div>
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${order.id}" 
                   alt="QR Code" class="ml-auto w-32 h-32"/>
            </div>
          </div>

          <!-- Company & Customer Details -->
          <div class="grid grid-cols-2 gap-8 mb-8">
            <div class="border border-gray-300 p-4">
              <h2 class="font-bold mb-2">${companySettings.name}</h2>
              <div class="text-sm space-y-1">
                <p>${companySettings.address_line1}</p>
                ${companySettings.address_line2 ? `<p>${companySettings.address_line2}</p>` : ''}
                <p>${companySettings.city}, ${companySettings.state} ${companySettings.postal_code}</p>
                <p>GSTIN/UIN: ${companySettings.tax_id}</p>
                <p>State Name: ${companySettings.state}, Code: ${companySettings.postal_code}</p>
              </div>
            </div>
            <div class="border border-gray-300 p-4">
              <h2 class="font-bold mb-2">Bill To</h2>
              <div class="text-sm space-y-1">
                <p>${order.customer.name}</p>
                <p>${order.delivery_address_line1}</p>
                ${order.delivery_address_line2 ? `<p>${order.delivery_address_line2}</p>` : ''}
                <p>${order.delivery_city}, ${order.delivery_state} ${order.delivery_postal_code}</p>
                <p>Phone: ${order.customer.phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          <!-- Order Details Table -->
          <table class="w-full mb-8 border-collapse">
            <thead>
              <tr class="bg-gray-100">
                <th class="border border-gray-300 p-2 text-left">SI No.</th>
                <th class="border border-gray-300 p-2 text-left">Description of Goods</th>
                <th class="border border-gray-300 p-2 text-center">HSN/SAC</th>
                <th class="border border-gray-300 p-2 text-center">Quantity</th>
                <th class="border border-gray-300 p-2 text-right">Rate</th>
                <th class="border border-gray-300 p-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${order.order_items.map((item, index) => `
                <tr>
                  <td class="border border-gray-300 p-2">${index + 1}</td>
                  <td class="border border-gray-300 p-2">
                    ${item.product.name}
                    ${item.variant ? `<br>${[item.variant.size, item.variant.color].filter(Boolean).join(' - ')}` : ''}
                    <br><span class="text-sm text-gray-600">SKU: ${item.product.sku}</span>
                  </td>
                  <td class="border border-gray-300 p-2 text-center">${item.product.sku}</td>
                  <td class="border border-gray-300 p-2 text-center">${item.quantity}</td>
                  <td class="border border-gray-300 p-2 text-right">${formatCurrency(item.price)}</td>
                  <td class="border border-gray-300 p-2 text-right">${formatCurrency(item.price * item.quantity)}</td>
                </tr>
              `).join('')}
              <tr>
                <td colspan="3" class="border border-gray-300 p-2 text-right font-bold">Total</td>
                <td class="border border-gray-300 p-2 text-center font-bold">
                  ${order.order_items.reduce((sum, item) => sum + item.quantity, 0)}
                </td>
                <td class="border border-gray-300 p-2"></td>
                <td class="border border-gray-300 p-2 text-right font-bold">
                  ${formatCurrency(order.subtotal_amount)}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Tax Details -->
          <div class="mb-8">
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-gray-100">
                  <th class="border border-gray-300 p-2">HSN/SAC</th>
                  <th class="border border-gray-300 p-2">Taxable Value</th>
                  <th class="border border-gray-300 p-2" colspan="2">Central Tax</th>
                  <th class="border border-gray-300 p-2" colspan="2">State Tax</th>
                  <th class="border border-gray-300 p-2">Total Tax Amount</th>
                </tr>
                <tr class="bg-gray-100">
                  <th class="border border-gray-300 p-2"></th>
                  <th class="border border-gray-300 p-2"></th>
                  <th class="border border-gray-300 p-2">Rate</th>
                  <th class="border border-gray-300 p-2">Amount</th>
                  <th class="border border-gray-300 p-2">Rate</th>
                  <th class="border border-gray-300 p-2">Amount</th>
                  <th class="border border-gray-300 p-2"></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="border border-gray-300 p-2">-</td>
                  <td class="border border-gray-300 p-2 text-right">${formatCurrency(order.subtotal_amount)}</td>
                  <td class="border border-gray-300 p-2 text-center">9%</td>
                  <td class="border border-gray-300 p-2 text-right">${formatCurrency(order.tax_amount / 2)}</td>
                  <td class="border border-gray-300 p-2 text-center">9%</td>
                  <td class="border border-gray-300 p-2 text-right">${formatCurrency(order.tax_amount / 2)}</td>
                  <td class="border border-gray-300 p-2 text-right">${formatCurrency(order.tax_amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Total in Words -->
          <div class="mb-8">
            <p class="font-bold">Amount Chargeable (in words):</p>
            <p>${numberToWords(order.total_amount)}</p>
          </div>

          <!-- Declaration -->
          <div class="grid grid-cols-2 gap-8">
            <div class="text-sm">
              <p class="font-bold mb-2">Declaration</p>
              <p>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
            </div>
            <div class="text-right">
              <p class="font-bold mb-2">for ${companySettings.name}</p>
              <div class="mt-16">
                <p class="font-bold">Authorised Signatory</p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="mt-8 text-center text-sm text-gray-600">
            <p>This is a Computer Generated Invoice</p>
          </div>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Tax Invoice #${order.id}</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              @media print {
                @page {
                  size: A4;
                  margin: 0.5in;
                }
                body {
                  print-color-adjust: exact;
                  -webkit-print-color-adjust: exact;
                }
                .page-break {
                  page-break-after: always;
                }
              }
            </style>
          </head>
          <body class="bg-white">
            ${invoiceContent.outerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-6 w-6" />
          <h1 className="text-2xl font-semibold text-gray-900">Order Details</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
          <button
            onClick={printInvoice}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Status:</span>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(e.target.value as Order['status'])}
                    className={`text-sm font-medium rounded-full px-3 py-1 ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="text-sm font-medium text-gray-900">#{order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(order.created_at)}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 -mx-6 px-6 py-6">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Order Items</h3>
                <div className="space-y-4">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Package className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                          <p className="text-xs text-gray-500">
                            SKU: {item.product.sku}
                            {item.variant && (
                              <span className="ml-2">
                                {[item.variant.size, item.variant.color].filter(Boolean).join(' - ')}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(item.price)} × {item.quantity}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 -mx-6 px-6 pt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(order.subtotal_amount)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Tax</span>
                  <span className="text-gray-900">{formatCurrency(order.tax_amount)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Shipping</span>
                  <span className="text-gray-900">{formatCurrency(order.shipping_amount)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Discount</span>
                    <span className="text-red-600">-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-medium border-t pt-2">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="text-sm font-medium text-gray-900">{order.customer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">{order.customer.email}</p>
                </div>
                {order.customer.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{order.customer.phone}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Delivery Address</h2>
              <div className="space-y-2">
                <p className="text-sm text-gray-900">{order.delivery_address_line1}</p>
                {order.delivery_address_line2 && (
                  <p className="text-sm text-gray-900">{order.delivery_address_line2}</p>
                )}
                <p className="text-sm text-gray-900">
                  {[
                    order.delivery_city,
                    order.delivery_state,
                    order.delivery_postal_code
                  ].filter(Boolean).join(', ')}
                </p>
                {order.delivery_country && (
                  <p className="text-sm text-gray-900">{order.delivery_country}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}