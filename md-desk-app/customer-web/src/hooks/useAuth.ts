import { useState, useEffect } from 'react';
import { authApi } from '../api/endpoints';

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(!!token);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    authApi
      .me()
      .then((res) => setUser(res.data.user))
      .catch(() => {
        setToken(null);
        localStorage.removeItem('token');
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const register = async (data: { name: string; email: string; otp: string; password: string; confirmPassword: string; phone?: string; city?: string; company?: string }) => {
    const res = await authApi.register(data);
    const t = res.data.token;
    localStorage.setItem('token', t);
    setToken(t);
    setUser(res.data.user);
  };

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const t = res.data.token;
    localStorage.setItem('token', t);
    setToken(t);
    setUser(res.data.user);
  };

  const loginWithOtp = async (email: string, otp: string) => {
    const res = await authApi.verifyLoginOtp(email, otp);
    const t = res.data.token;
    localStorage.setItem('token', t);
    setToken(t);
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return { token, user, register, login, loginWithOtp, logout, isLoading };
}
