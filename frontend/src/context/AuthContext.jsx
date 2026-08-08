import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

/**
 * AuthProvider manages authentication state across the app.
 * Stores JWT token and user data in localStorage for persistence.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore auth state from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('recruitx_token');
    const savedUser = localStorage.getItem('recruitx_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('recruitx_token');
        localStorage.removeItem('recruitx_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = res.data;

    localStorage.setItem('recruitx_token', newToken);
    localStorage.setItem('recruitx_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);

    return userData;
  };

  const loginWithGoogle = async (googleUser) => {
    const res = await api.post('/auth/google', { 
      email: googleUser.email,
      name: googleUser.displayName,
      photoURL: googleUser.photoURL
    });
    
    const { token: newToken, user: userData } = res.data;

    localStorage.setItem('recruitx_token', newToken);
    localStorage.setItem('recruitx_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);

    return userData;
  };

  const signup = async (data) => {
    const res = await api.post('/auth/signup', data);
    const { token: newToken, user: userData } = res.data;

    localStorage.setItem('recruitx_token', newToken);
    localStorage.setItem('recruitx_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);

    return userData;
  };

  const logout = () => {
    localStorage.removeItem('recruitx_token');
    localStorage.removeItem('recruitx_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedFields) => {
    const updated = { ...user, ...updatedFields };
    setUser(updated);
    localStorage.setItem('recruitx_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginWithGoogle, signup, logout, updateUser, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
