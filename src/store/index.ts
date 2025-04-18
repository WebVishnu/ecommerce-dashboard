import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Category, Product, Order, Customer, AdminAction } from '../types';

interface DashboardStore {
  // Stats
  totalProducts: number;
  pendingOrders: number;
  monthlyRevenue: number;
  activeCustomers: number;
  
  // Additional Stats
  lowStockProducts: Array<{ id: string; name: string; quantity: number; minimum_quantity: number }>;
  recentOrders: Array<Order & { customer: { name: string } }>;
  orderStats: Array<{ status: string; count: number; percentage: number }>;
  salesTrend: Array<{ date: string; amount: number }>;
  
  // Data
  categories: Category[];
  products: Product[];
  orders: Order[];
  customers: Customer[];
  recentActions: AdminAction[];
  
  // Loading states
  isLoading: boolean;
  
  // Actions
  fetchDashboardStats: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchCustomers: () => Promise<void>;
  fetchRecentActions: () => Promise<void>;
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  totalProducts: 0,
  pendingOrders: 0,
  monthlyRevenue: 0,
  activeCustomers: 0,
  
  lowStockProducts: [],
  recentOrders: [],
  orderStats: [],
  salesTrend: [],
  
  categories: [],
  products: [],
  orders: [],
  customers: [],
  recentActions: [],
  
  isLoading: false,
  
  fetchDashboardStats: async () => {
    set({ isLoading: true });
    try {
      const [
        { count: productsCount },
        { count: pendingOrdersCount },
        { data: monthlyOrders },
        { count: customersCount },
        { data: productVariants },
        { data: recentOrders },
        { data: allOrders },
        { data: actions }
      ] = await Promise.all([
        // Total products count
        supabase.from('products').select('*', { count: 'exact', head: true }),
        
        // Pending orders count
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        
        // Monthly revenue
        supabase.from('orders')
          .select('total_amount')
          .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString()),
        
        // Active customers count
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        
        // Product variants for low stock check
        supabase.from('product_variants')
          .select(`
            id,
            quantity,
            minimum_quantity,
            product:products(name)
          `),
        
        // Recent orders
        supabase.from('orders')
          .select(`
            id,
            status,
            total_amount,
            created_at,
            customer:customers(name)
          `)
          .order('created_at', { ascending: false })
          .limit(5),
        
        // All orders for stats
        supabase.from('orders')
          .select('status')
          .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString()),
        
        // Recent actions
        supabase.from('admin_actions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      const monthlyRevenue = monthlyOrders?.reduce((acc, order) => acc + order.total_amount, 0) || 0;

      // Filter low stock products in JavaScript
      const lowStock = productVariants
        ?.filter(item => item.quantity < item.minimum_quantity)
        .slice(0, 6)
        .map(item => ({
          id: item.id,
          name: item.product.name,
          quantity: item.quantity,
          minimum_quantity: item.minimum_quantity
        })) || [];

      // Calculate order stats
      const statusCounts = (allOrders || []).reduce((acc: Record<string, number>, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      const totalOrders = Object.values(statusCounts).reduce((a, b) => a + b, 0);
      const orderStats = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        percentage: (count / totalOrders) * 100
      }));

      // Generate sales trend data
      const today = new Date();
      const salesTrend = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayOrders = monthlyOrders?.filter(order => 
          new Date(order.created_at).toDateString() === date.toDateString()
        ) || [];
        return {
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          amount: dayOrders.reduce((sum, order) => sum + order.total_amount, 0)
        };
      }).reverse();

      set({
        totalProducts: productsCount || 0,
        pendingOrders: pendingOrdersCount || 0,
        monthlyRevenue,
        activeCustomers: customersCount || 0,
        lowStockProducts: lowStock,
        recentOrders: recentOrders || [],
        orderStats,
        salesTrend,
        recentActions: actions || [],
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      set({ isLoading: false });
    }
  },

  fetchCategories: async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) set({ categories: data });
  },

  fetchProducts: async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) set({ products: data });
  },

  fetchOrders: async () => {
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*)
      `)
      .order('created_at', { ascending: false });
    if (data) set({ orders: data });
  },

  fetchCustomers: async () => {
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (data) set({ customers: data });
  },

  fetchRecentActions: async () => {
    const { data } = await supabase
      .from('admin_actions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) set({ recentActions: data });
  }
}));