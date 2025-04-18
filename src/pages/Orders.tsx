import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShoppingCart, Eye, CheckCircle, XCircle, Truck, Package, Plus } from 'lucide-react';
import Table, { Column, PaginationState } from '../components/Table';
import { Link, useNavigate } from 'react-router-dom';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
  };
}

interface Order {
  id: string;
  customer_id: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  created_at: string;
  customer: {
    name: string;
    email: string;
  };
  order_items: OrderItem[];
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, pagination.pageSize, searchTerm]);

  async function fetchOrders() {
    try {
      setLoading(true);
      let query = supabase.from('orders').select(`
        *,
        customer:customers(name, email),
        order_items(
          id,
          product_id,
          quantity,
          price,
          product:products(name)
        )
      `);

      if (searchTerm) {
        query = query.ilike('id::text', `%${searchTerm}%`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(
          (pagination.page - 1) * pagination.pageSize,
          pagination.page * pagination.pageSize - 1
        );

      if (error) throw error;

      setOrders(data || []);
      setPagination(prev => ({ ...prev, total: count || 0 }));
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, orderId: string) => {
    // Stop the event from bubbling up to the row click handler
    e.stopPropagation();
    
    try {
      const newStatus = e.target.value as Order['status'];
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev =>
        prev.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination(prev => ({ ...prev, page, pageSize }));
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <Package className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const columns: Column<Order>[] = [
    {
      header: 'Order ID',
      accessor: (order) => (
        <div className="text-sm font-medium text-gray-900">
          #{order.id.slice(0, 8)}
        </div>
      )
    },
    {
      header: 'Customer',
      accessor: (order) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{order.customer?.name || 'N/A'}</div>
          <div className="text-gray-500">{order.customer?.email || 'N/A'}</div>
        </div>
      )
    },
    {
      header: 'Items',
      accessor: (order) => (
        <div className="text-sm text-gray-500">
          {Array.isArray(order.order_items) && order.order_items.length > 0 ? (
            order.order_items.map(item => (
              <div key={item.id}>
                {item.quantity}x {item.product?.name || 'Unknown Product'}
              </div>
            ))
          ) : (
            <span className="text-gray-400">No items</span>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (order) => (
        <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
          {getStatusIcon(order.status)}
          <select
            value={order.status}
            onChange={(e) => handleStatusChange(e, order.id)}
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
      )
    },
    {
      header: 'Total Amount',
      accessor: (order) => (
        <div className="text-sm font-medium text-gray-900">
          ${order.total_amount.toFixed(2)}
        </div>
      )
    },
    {
      header: 'Date',
      accessor: (order) => (
        <div className="text-sm text-gray-500">
          {new Date(order.created_at).toLocaleDateString()}
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-6 w-6" />
          <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
        </div>
        <Link
          to="/orders/create"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Order
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{pagination.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Pending</h3>
          <p className="mt-2 text-3xl font-semibold text-yellow-600">
            {orders.filter(order => order.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Shipped</h3>
          <p className="mt-2 text-3xl font-semibold text-purple-600">
            {orders.filter(order => order.status === 'shipped').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Delivered</h3>
          <p className="mt-2 text-3xl font-semibold text-green-600">
            {orders.filter(order => order.status === 'delivered').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Cancelled</h3>
          <p className="mt-2 text-3xl font-semibold text-red-600">
            {orders.filter(order => order.status === 'cancelled').length}
          </p>
        </div>
      </div>

      <Table
        data={orders}
        columns={columns}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        isLoading={loading}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onRowClick={(order) => navigate(`/orders/${order.id}`)}
      />
    </div>
  );
}