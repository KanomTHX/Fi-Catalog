import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { AppLayout } from "@/components/AppLayout";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import PublicProducts from "./pages/PublicProducts";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Checkout from "./pages/Checkout";
import Dashboard from "./pages/Index";
import Products from "./pages/Products";
import StockIn from "./pages/StockIn";
import StockOut from "./pages/StockOut";
import Adjustments from "./pages/Adjustments";
import Reports from "./pages/Reports";
import UsersPage from "./pages/Users";
import ActivityLog from "./pages/ActivityLog";
import LineSettings from "./pages/LineSettings";
import Orders from "./pages/Orders";
import SerialPrint from "./pages/SerialPrint";
import StockCheck from "./pages/StockCheck";
import Showcase from "./pages/Showcase";
import SiteSettings from "./pages/SiteSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/admin/auth" replace />;
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/stock-in" element={<StockIn />} />
        <Route path="/stock-out" element={<StockOut />} />
        <Route path="/adjustments" element={<Adjustments />} />
        <Route path="/serial-print" element={<SerialPrint />} />
        <Route path="/stock-check" element={<StockCheck />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/activity-log" element={<ActivityLog />} />
        <Route path="/settings/line" element={<LineSettings />} />
        <Route path="/settings/site" element={<SiteSettings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/admin" replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<PublicProducts />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/liff" element={<Showcase />} />
              <Route path="/showcase" element={<Navigate to="/" replace />} />
              <Route path="/admin/auth" element={<AuthRoute />} />
              <Route path="/admin/*" element={<ProtectedRoutes />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
