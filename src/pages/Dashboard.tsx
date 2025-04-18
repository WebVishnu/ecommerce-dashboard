import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  ShoppingCart, 
  DollarSign, 
  Users, 
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Truck,
  Package as PackageIcon,
  Eye
} from 'lucide-react';
import { useDashboardStore } from '../store';
import StatsCard from '../components/StatsCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const {
    totalProducts,
    pendingOrders,
    monthlyRevenue,
    activeCustomers,
    lowStockProducts,
    recentOrders,
    orderStats,
    recentActions,
    salesTrend,
    fetchDashboardStats,
    fetchRecentActions,
    isLoading
  } = useDashboardStore();

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentActions();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'create':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'update':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'delete':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'ship':
        return <Truck className="h-5 w-5 text-purple-500" />;
      default:
        return <Eye className="h-5 w-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Products"
          value={totalProducts}
          icon={Package}
          trend={{
            value: 12,
            isPositive: true
          }}
        />
        <StatsCard
          title="Pending Orders"
          value={pendingOrders}
          icon={ShoppingCart}
          trend={{
            value: 5,
            isPositive: false
          }}
        />
        <StatsCard
          title="Monthly Revenue"
          value={`$${monthlyRevenue.toFixed(2)}`}
          icon={DollarSign}
          trend={{
            value: 23,
            isPositive: true
          }}
        />
        <StatsCard
          title="Active Customers"
          value={activeCustomers}
          icon={Users}
          trend={{
            value: 8,
            isPositive: true
          }}
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Sales Trend</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Statistics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Order Statistics</h2>
          <div className="space-y-4">
            {orderStats.map((stat) => (
              <div key={stat.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(stat.status)}`}></div>
                  <span className="text-sm font-medium capitalize">{stat.status}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold">{stat.count}</span>
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getStatusColor(stat.status)}`}
                      style={{ width: `${stat.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Orders</h2>
              <Link 
                to="/orders" 
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <Link 
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="block p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">#{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-500">{order.customer.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${order.total_amount}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentActions.map((action) => (
                <div key={action.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {getActionIcon(action.action_type)}
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm">{action.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(action.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Low Stock Alerts</h2>
            <Link 
              to="/inventory" 
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View Inventory
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg bg-red-50">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-red-600">Only {product.quantity} units left</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}