import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './layouts/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import MyComplaintsPage from './pages/MyComplaintsPage';
import RaiseComplaintPage from './pages/RaiseComplaintPage';
import TrackComplaintPage from './pages/TrackComplaintPage';
import MessageMDPage from './pages/MessageMDPage';
import ProductsPage from './pages/ProductsPage';
import DealerLocatorPage from './pages/DealerLocatorPage';

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
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
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
        <Route path="complaints" element={<MyComplaintsPage />} />
        <Route path="raise-complaint" element={<RaiseComplaintPage />} />
        <Route path="track" element={<TrackComplaintPage />} />
        <Route path="message-md" element={<MessageMDPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="dealers" element={<DealerLocatorPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
