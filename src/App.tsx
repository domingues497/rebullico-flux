import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Products from "./pages/Products";
import ProductGroups from "./pages/ProductGroups";
import Customers from "./pages/Customers";
import Reports from "./pages/Reports";
import Settings from './pages/Settings';
import StockEntries from './pages/StockEntries';
import Suppliers from './pages/Suppliers';
import NotFound from './pages/NotFound';
import Login from "./pages/Login";
import MercadoLivreCallback from "./pages/MercadoLivreCallback";
import { Capacitor } from '@capacitor/core';

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect native app users to login/pos if they hit root
  useEffect(() => {
    if (Capacitor.isNativePlatform() && window.location.pathname === '/' && !loading) {
      if (user) {
        navigate('/pos');
      } else {
        navigate('/login');
      }
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Helper to decide where to go after login if user tries to access login page while auth
  const getAuthRedirect = () => {
    return Capacitor.isNativePlatform() ? "/pos" : "/admin";
  };

  return (
    <Routes>
      {/* Public route - Landing page 
          No app nativo, a Home é pulada pelo useEffect acima, mas mantemos a rota para web
      */}
      <Route path="/" element={<Home />} />
      
      {/* Login route */}
      <Route 
        path="/login" 
        element={user ? <Navigate to={getAuthRedirect()} replace /> : <Login />} 
      />
      
      {/* Protected admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/pos" element={
        <ProtectedRoute>
          <POS />
        </ProtectedRoute>
      } />
      <Route path="/products" element={
        <ProtectedRoute>
          <Products />
        </ProtectedRoute>
      } />
      <Route path="/product-groups" element={
        <ProtectedRoute>
          <ProductGroups />
        </ProtectedRoute>
      } />
      <Route path="/customers" element={
        <ProtectedRoute>
          <Customers />
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <Reports />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="/stock-entries" element={
        <ProtectedRoute>
          <StockEntries />
        </ProtectedRoute>
      } />
      <Route path="/suppliers" element={
        <ProtectedRoute>
          <Suppliers />
        </ProtectedRoute>
      } />
      <Route path="/integrations/callback" element={
        <ProtectedRoute>
          <MercadoLivreCallback />
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
