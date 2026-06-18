import { supabase } from './supabase';
import { User, CreateUserData, UserRole } from '../types';

// Map RPC result to User object
const mapResultToUser = (r: any): User => ({
  id: r.user_id || r.id,
  name: r.name || r.username || '',
  email: r.email || '',
  username: r.username,
  role: (r.role || 'user') as UserRole,
  isActive: r.is_active !== false,
  tenant_id: r.tenant_id,
  tenant_plan: r.tenant_plan,
  trial_ends_at: r.trial_ends_at,
  subscription_status: r.subscription_status,
  createdAt: r.created_at ? new Date(r.created_at) : new Date(),
  updatedAt: r.updated_at ? new Date(r.updated_at) : new Date(),
});

// Authenticate user via custom RPC (username + password)
export const authenticateUser = async (
  username: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('authenticate_user', {
      p_username: username,
      p_password: password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data || !data.success) {
      return { success: false, error: data?.error_message || 'Invalid username or password' };
    }

    const user = mapResultToUser(data);

    // Store tenant_id for data isolation
    localStorage.setItem('tenant_id', data.tenant_id || '');

    return { success: true, user };
  } catch (err) {
    return { success: false, error: 'Authentication failed. Please try again.' };
  }
};

// Get all users in the system (called by admin)
export const getAllUsers = async (): Promise<{ success: boolean; users?: User[]; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('get_all_users');

    if (error) return { success: false, error: error.message };

    const arr = Array.isArray(data) ? data : [];
    const tenantId = localStorage.getItem('tenant_id');

    // Filter to current tenant
    const filtered = tenantId
      ? arr.filter((u: any) => u.tenant_id === tenantId)
      : arr;

    const users = filtered.map((u: any): User => ({
      id: u.id,
      name: u.name || u.username || '',
      email: u.email || '',
      username: u.username,
      role: (u.role || 'user') as UserRole,
      isActive: u.is_active !== false,
      tenant_id: u.tenant_id,
      createdAt: u.created_at ? new Date(u.created_at) : new Date(),
      updatedAt: u.updated_at ? new Date(u.updated_at) : new Date(),
    }));

    return { success: true, users };
  } catch (err) {
    return { success: false, error: 'Failed to fetch users' };
  }
};

// Create a new user account (admin action)
export const createUserAccount = async (
  userData: CreateUserData,
  createdBy?: string
): Promise<{ success: boolean; userId?: string; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('create_user_account', {
      p_name: userData.name,
      p_email: userData.email || '',
      p_username: userData.username || userData.email,
      p_password: userData.password,
      p_role: userData.role || 'user',
      p_created_by: createdBy || null,
    });

    if (error) return { success: false, error: error.message };
    if (!data || !data.success) {
      return { success: false, error: data?.error_message || 'Failed to create user' };
    }

    return { success: true, userId: data.user_id };
  } catch (err) {
    return { success: false, error: 'Failed to create user' };
  }
};

// Update user role
export const updateUserRoleDb = async (
  userId: string,
  newRole: UserRole,
  updatedBy: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('update_user_role', {
      p_user_id: userId,
      p_new_role: newRole,
      p_updated_by: updatedBy,
    });
    if (error) return { success: false, error: error.message };
    if (!data?.success) return { success: false, error: data?.error_message || 'Failed' };
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to update role' };
  }
};

// Toggle user active status
export const toggleUserStatusDb = async (
  userId: string,
  updatedBy: string
): Promise<{ success: boolean; newStatus?: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('toggle_user_status', {
      p_user_id: userId,
      p_updated_by: updatedBy,
    });
    if (error) return { success: false, error: error.message };
    if (!data?.success) return { success: false, error: data?.error_message || 'Failed' };
    return { success: true, newStatus: data.new_status };
  } catch (err) {
    return { success: false, error: 'Failed to toggle status' };
  }
};

// Delete user account
export const deleteUserAccountDb = async (
  userId: string,
  deletedBy: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('delete_user_account', {
      p_user_id: userId,
      p_deleted_by: deletedBy,
    });
    if (error) return { success: false, error: error.message };
    if (!data?.success) return { success: false, error: data?.error_message || 'Failed' };
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to delete user' };
  }
};
