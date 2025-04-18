export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  icon_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  price: number;
  category_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  price: number;
  created_at: string;
  product?: Product;
  variant?: ProductVariant;
}

export interface AdminAction {
  id: string;
  admin_id: string;
  action_type: 'insert' | 'update' | 'delete';
  entity_type: 'products' | 'customers' | 'categories' | 'orders';
  entity_id: string;
  description: string;
  created_at: string;
}

export interface DashboardStats {
  totalProducts: number;
  pendingOrders: number;
  monthlyRevenue: number;
  activeCustomers: number;
  lowStockProducts: Array<{ id: string; name: string; quantity: number }>;
  recentOrders: Array<Order & { customer: { name: string } }>;
  orderStats: Array<{ status: string; count: number; percentage: number }>;
  salesTrend: Array<{ date: string; amount: number }>;
}