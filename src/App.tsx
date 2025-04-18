import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import ProductDetails from './pages/ProductDetails';
import Categories from './pages/Categories';
import Orders from './pages/Orders';
import OrderForm from './pages/OrderForm';
import OrderDetails from './pages/OrderDetails';
import Customers from './pages/Customers';
import CustomerForm from './pages/CustomerForm';
import CustomerDetails from './pages/CustomerDetails';
import Inventory from './pages/Inventory';
import StockForm from './pages/StockForm';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="flex">
                <Sidebar />
                <main className="flex-1 bg-gray-50 min-h-screen p-8">
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/create" element={<ProductForm />} />
                    <Route path="/products/:id" element={<ProductDetails />} />
                    <Route path="/products/:id/edit" element={<ProductForm />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/orders/create" element={<OrderForm />} />
                    <Route path="/orders/:id" element={<OrderDetails />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/customers/create" element={<CustomerForm />} />
                    <Route path="/customers/:id" element={<CustomerDetails />} />
                    <Route path="/customers/:id/edit" element={<CustomerForm />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/inventory/stock/add" element={<StockForm />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;