import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './layouts/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ComplaintsPage from './pages/ComplaintsPage';
import ComplaintDetailPage from './pages/ComplaintDetailPage';
import MessagesPage from './pages/MessagesPage';
import ReportsPage from './pages/ReportsPage';
import ProductsPage from './pages/ProductsPage';
import DealersPage from './pages/DealersPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();
  if (isLoading) return null;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="complaints" element={<ComplaintsPage />} />
        <Route path="complaints/:id" element={<ComplaintDetailPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="dealers" element={<DealersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
