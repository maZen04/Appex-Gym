import { createContext, useContext, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('appex_user');
    return stored ? JSON.parse(stored) : null;
  });

  async function login(phone, password) {
    const { data } = await api.post('/auth/login', { phone, password });
    localStorage.setItem('appex_token', data.token);
    localStorage.setItem('appex_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('appex_token');
    localStorage.removeItem('appex_user');
    setUser(null);
  }

  const isOwner = user?.role === 'Owner';

  return (
    <AuthContext.Provider value={{ user, login, logout, isOwner }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
