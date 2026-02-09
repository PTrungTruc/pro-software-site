import React, { createContext, useState, useContext, useEffect } from 'react';
import { getAuthStatus, login as loginApi, logout as logoutApi } from '@/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await getAuthStatus();
        if (data.loggedIn) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Auth check failed", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (credentials) => {
    const { data } = await loginApi(credentials);
    if (data.success) {
      setUser(data.user);
    }
    return data;
  };

  const logout = async (navigate) => {
    await logoutApi();
    setUser(null);
    if(navigate) navigate('/admin/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);