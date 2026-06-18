import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType, CreateUserData, UserRole } from '../types';
import {
  authenticateUser,
  getAllUsers as getAllUsersDb,
  createUserAccount as createUserAccountDb,
  updateUserRoleDb,
  toggleUserStatusDb,
  deleteUserAccountDb,
} from '../lib/userManagement';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CACHED_USER_KEY = 'lf_cached_user';

// Read user from localStorage cache for instant load on refresh
const getCachedUser = (): User | null => {
  try {
    const cached = localStorage.getItem(CACHED_USER_KEY);
    if (!cached) return null;
    const p = JSON.parse(cached);
    if (!p?.id) return null;
    return {
      ...p,
      createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
      updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
    };
  } catch {
    return null;
  }
};

const cacheUser = (u: User | null) => {
  if (u) localStorage.setItem(CACHED_USER_KEY, JSON.stringify(u));
  else localStorage.removeItem(CACHED_USER_KEY);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cached = getCachedUser();
  const [user, setUser] = useState<User | null>(cached);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On mount, if we have a cached user, load team users for admin
  useEffect(() => {
    if (user?.role === 'admin') {
      getAllUsersDb().then(res => {
        if (res.success && res.users) setUsers(res.users);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const result = await authenticateUser(username, password);

      if (!result.success || !result.user) {
        throw new Error(result.error || 'Login failed');
      }

      setUser(result.user);
      cacheUser(result.user);
      localStorage.setItem('tenant_id', result.user.tenant_id || '');

      // Load team users if admin
      if (result.user.role === 'admin') {
        getAllUsersDb().then(res => {
          if (res.success && res.users) setUsers(res.users);
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setUser(null);
    setUsers([]);
    cacheUser(null);
    localStorage.removeItem('tenant_id');
    localStorage.removeItem(CACHED_USER_KEY);
  };

  const createUser = async (userData: CreateUserData): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await createUserAccountDb(userData, user?.id);
      if (!result.success) return { success: false, error: result.error };
      const res = await getAllUsersDb();
      if (res.success && res.users) setUsers(res.users);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed' };
    }
  };

  const updateUserRole = async (userId: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };
    try {
      const result = await updateUserRoleDb(userId, role, user.id);
      if (!result.success) return { success: false, error: result.error };
      const res = await getAllUsersDb();
      if (res.success && res.users) {
        setUsers(res.users);
        if (user.id === userId) {
          const updated = res.users.find(u => u.id === userId);
          if (updated) {
            setUser(updated);
            cacheUser(updated);
          }
        }
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to update role' };
    }
  };

  const toggleUserStatus = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };
    try {
      const result = await toggleUserStatusDb(userId, user.id);
      if (!result.success) return { success: false, error: result.error };
      const res = await getAllUsersDb();
      if (res.success && res.users) setUsers(res.users);
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to toggle status' };
    }
  };

  const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };
    try {
      const result = await deleteUserAccountDb(userId, user.id);
      if (!result.success) return { success: false, error: result.error };
      const res = await getAllUsersDb();
      if (res.success && res.users) setUsers(res.users);
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to delete user' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user, users,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      login, logout,
      createUser, updateUserRole, toggleUserStatus, deleteUser,
      loading, error,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
