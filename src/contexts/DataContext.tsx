import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Case, Counsel, Appointment, Transaction, Court, CaseType, District,
  Task, Attendance, AttendanceStatus, Expense, DataContextType
} from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const DataContext = createContext<DataContextType | undefined>(undefined);

// camelCase ↔ snake_case helpers
const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
};

const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (obj instanceof Date) return obj.toISOString().split('T')[0];
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
      acc[snakeKey] = toSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  const [cases, setCases] = useState<Case[]>([]);
  const [counsel, setCounsel] = useState<Counsel[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Single fetch — only runs when tenant_id is available
  // Each query is independent and non-blocking
  const fetchAllData = useCallback(() => {
    if (!tenantId) return;
    const tid = tenantId;

    supabase.from('cases').select('*').eq('tenant_id', tid).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setCases(toCamelCase(data)); });
    supabase.from('counsel').select('*').eq('tenant_id', tid).order('name', { ascending: true })
      .then(({ data }) => { if (data) setCounsel(toCamelCase(data)); });
    supabase.from('appointments').select('*').eq('tenant_id', tid).order('date', { ascending: true })
      .then(({ data }) => { if (data) setAppointments(toCamelCase(data)); });
    supabase.from('transactions').select('*').eq('tenant_id', tid).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setTransactions(toCamelCase(data)); });
    supabase.from('tasks').select('*').eq('tenant_id', tid).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setTasks(toCamelCase(data)); });
    supabase.from('expenses').select('*').eq('tenant_id', tid).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setExpenses(toCamelCase(data)); });
    supabase.from('attendance').select('*').eq('tenant_id', tid).order('date', { ascending: false })
      .then(({ data }) => { if (data) setAttendance(toCamelCase(data)); });
    supabase.from('courts').select('*').order('name', { ascending: true })
      .then(({ data }) => { if (data?.length) setCourts(toCamelCase(data)); });
    supabase.from('case_types').select('*').order('name', { ascending: true })
      .then(({ data }) => { if (data?.length) setCaseTypes(toCamelCase(data)); });
    supabase.from('districts').select('*').order('name', { ascending: true })
      .then(({ data }) => { if (data?.length) setDistricts(toCamelCase(data)); });
  }, [tenantId]);

  // Fetch on mount and when tenant_id becomes available
  // [tenantId] dep — only re-runs when tenant changes (not user object reference)
  useEffect(() => {
    if (tenantId) {
      fetchAllData();
    } else {
      setCases([]); setCounsel([]); setAppointments([]); setTransactions([]);
      setTasks([]); setAttendance([]); setExpenses([]);
    }
  }, [tenantId, fetchAllData]);

  // ============================================================
  // CASE operations — all throw on error so handlers can stop loading
  // ============================================================
  const addCase = async (caseData: Omit<Case, 'id' | 'createdAt' | 'updatedAt'>) => {
    const payload = toSnakeCase(caseData);
    payload.tenant_id = tenantId;
    payload.created_by = user?.id;

    // 60 second timeout — Supabase free tier can be slow on cold start
    const insertPromise = supabase.from('cases').insert([payload]).select().single();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out after 60s. Please check your Supabase project is active and try again.')), 60000)
    );

    const { data, error } = await Promise.race([insertPromise, timeoutPromise]);
    if (error) throw new Error(error.message);
    if (data) setCases(prev => [toCamelCase(data), ...prev]);
  };

  const updateCase = async (id: string, caseData: Partial<Case>) => {
    const payload = toSnakeCase(caseData);
    delete payload.tenant_id; // never update tenant
    const { data, error } = await supabase.from('cases').update(payload).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    if (data) setCases(prev => prev.map(c => c.id === id ? toCamelCase(data) : c));
  };

  const deleteCase = async (id: string) => {
    const { error } = await supabase.from('cases').delete().eq('id', id);
    if (error) throw new Error(error.message);
    setCases(prev => prev.filter(c => c.id !== id));
  };

  // ============================================================
  // COUNSEL operations
  // ============================================================
  const addCounsel = async (counselData: Omit<Counsel, 'id' | 'createdAt' | 'updatedAt'>) => {
    const payload = toSnakeCase(counselData);
    payload.tenant_id = tenantId;
    payload.created_by = user?.id;
    const { data, error } = await supabase.from('counsel').insert([payload]).select().single();
    if (error) throw new Error(error.message);
    if (data) setCounsel(prev => [toCamelCase(data), ...prev]);
  };

  const updateCounsel = async (id: string, counselData: Partial<Counsel>) => {
    const payload = toSnakeCase(counselData);
    delete payload.tenant_id;
    const { data, error } = await supabase.from('counsel').update(payload).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    if (data) setCounsel(prev => prev.map(c => c.id === id ? toCamelCase(data) : c));
  };

  const deleteCounsel = async (id: string) => {
    const { error } = await supabase.from('counsel').delete().eq('id', id);
    if (error) throw new Error(error.message);
    setCounsel(prev => prev.filter(c => c.id !== id));
  };

  // ============================================================
  // APPOINTMENT operations
  // ============================================================
  const addAppointment = async (a: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const dateStr = a.date instanceof Date ? a.date.toISOString().split('T')[0] : (a.date as string);
    const payload: any = {
      tenant_id: tenantId,
      date: dateStr,
      time: a.time || '',
      user_name: a.user || user?.name || '',
      client: a.client || '',
      details: a.details || '',
    };
    const { data, error } = await supabase.from('appointments').insert([payload]).select().single();
    if (error) throw new Error(error.message);
    if (data) setAppointments(prev => [toCamelCase(data), ...prev]);
  };

  const updateAppointment = async (id: string, a: Partial<Appointment>) => {
    const payload: any = {};
    if (a.date !== undefined) {
      payload.date = a.date instanceof Date ? a.date.toISOString().split('T')[0] : a.date;
    }
    if (a.time !== undefined) payload.time = a.time;
    if (a.user !== undefined) payload.user_name = a.user;
    if (a.client !== undefined) payload.client = a.client;
    if (a.details !== undefined) payload.details = a.details;
    const { data, error } = await supabase.from('appointments').update(payload).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    if (data) setAppointments(prev => prev.map(x => x.id === id ? toCamelCase(data) : x));
  };

  const deleteAppointment = async (id: string) => {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) throw new Error(error.message);
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  // ============================================================
  // TRANSACTION operations
  // ============================================================
  const addTransaction = async (t: Omit<Transaction, 'id' | 'createdAt'>) => {
    const payload = toSnakeCase(t);
    payload.tenant_id = tenantId;
    const { data, error } = await supabase.from('transactions').insert([payload]).select().single();
    if (error) throw new Error(error.message);
    if (data) setTransactions(prev => [toCamelCase(data), ...prev]);
  };

  const updateTransaction = async (id: string, t: Partial<Transaction>) => {
    const payload = toSnakeCase(t);
    delete payload.tenant_id;
    const { data, error } = await supabase.from('transactions').update(payload).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    if (data) setTransactions(prev => prev.map(x => x.id === id ? toCamelCase(data) : x));
  };

  // ============================================================
  // COURTS / CASE TYPES / DISTRICTS (shared lookup tables)
  // ============================================================
  const addCourt = async (name: string) => {
    const { data, error } = await supabase.from('courts').insert([{ name }]).select().single();
    if (error) throw new Error(error.message);
    if (data) setCourts(prev => [...prev, toCamelCase(data)]);
  };
  const deleteCourt = async (id: string) => {
    const { error } = await supabase.from('courts').delete().eq('id', id);
    if (error) throw new Error(error.message);
    setCourts(prev => prev.filter(c => c.id !== id));
  };

  const addCaseType = async (name: string) => {
    const { data, error } = await supabase.from('case_types').insert([{ name }]).select().single();
    if (error) throw new Error(error.message);
    if (data) setCaseTypes(prev => [...prev, toCamelCase(data)]);
  };
  const deleteCaseType = async (id: string) => {
    const { error } = await supabase.from('case_types').delete().eq('id', id);
    if (error) throw new Error(error.message);
    setCaseTypes(prev => prev.filter(c => c.id !== id));
  };

  const addDistrict = async (name: string) => {
    const { data, error } = await supabase.from('districts').insert([{ name }]).select().single();
    if (error) throw new Error(error.message);
    if (data) setDistricts(prev => [...prev, toCamelCase(data)]);
  };
  const deleteDistrict = async (id: string) => {
    const { error } = await supabase.from('districts').delete().eq('id', id);
    if (error) throw new Error(error.message);
    setDistricts(prev => prev.filter(d => d.id !== id));
  };

  // ============================================================
  // TASK operations
  // ============================================================
  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const payload = toSnakeCase(taskData);
    payload.tenant_id = tenantId;
    const { data, error } = await supabase.from('tasks').insert([payload]).select().single();
    if (error) throw new Error(error.message);
    if (data) setTasks(prev => [toCamelCase(data), ...prev]);
  };

  const updateTask = async (id: string, taskData: Partial<Task>) => {
    const payload = toSnakeCase(taskData);
    delete payload.tenant_id;
    const { data, error } = await supabase.from('tasks').update(payload).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    if (data) setTasks(prev => prev.map(t => t.id === id ? toCamelCase(data) : t));
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw new Error(error.message);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const completeTask = async (id: string) => {
    const { data, error } = await supabase.from('tasks')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw new Error(error.message);
    if (data) setTasks(prev => prev.map(t => t.id === id ? toCamelCase(data) : t));
  };

  const getPendingTasksCount = (userId?: string): number => {
    if (userId) return tasks.filter(t => t.assignedTo === userId && t.status === 'pending').length;
    return tasks.filter(t => t.status === 'pending').length;
  };

  // ============================================================
  // ATTENDANCE operations
  // ============================================================
  const markAttendance = async (userId: string, date: Date, status: AttendanceStatus) => {
    const dateStr = date.toISOString().split('T')[0];
    const payload = {
      tenant_id: tenantId,
      user_id: userId,
      user_name: '',
      date: dateStr,
      status,
      marked_by: user?.id,
      marked_by_name: user?.name || '',
    };
    const { data, error } = await supabase.from('attendance')
      .upsert([payload], { onConflict: 'tenant_id,user_id,date' })
      .select().single();
    if (error) throw new Error(error.message);
    if (data) {
      const newRec = toCamelCase(data);
      setAttendance(prev => {
        const idx = prev.findIndex(a => a.userId === userId && new Date(a.date).toISOString().split('T')[0] === dateStr);
        if (idx >= 0) return prev.map((a, i) => i === idx ? newRec : a);
        return [...prev, newRec];
      });
    }
  };

  const clearAttendance = async (userId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const { error } = await supabase.from('attendance')
      .delete().eq('user_id', userId).eq('date', dateStr);
    if (error) throw new Error(error.message);
    setAttendance(prev => prev.filter(a =>
      !(a.userId === userId && new Date(a.date).toISOString().split('T')[0] === dateStr)
    ));
  };

  const getAttendanceByUser = (userId: string, month?: number, year?: number): Attendance[] => {
    let f = attendance.filter(a => a.userId === userId);
    if (month !== undefined && year !== undefined) {
      f = f.filter(a => {
        const d = new Date(a.date);
        return d.getMonth() === month && d.getFullYear() === year;
      });
    }
    return f.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getAttendanceByDate = (date: Date): Attendance[] => {
    const dateStr = date.toISOString().split('T')[0];
    return attendance.filter(a => new Date(a.date).toISOString().split('T')[0] === dateStr);
  };

  // ============================================================
  // EXPENSE operations
  // ============================================================
  const addExpense = async (e: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    const payload = toSnakeCase(e);
    payload.tenant_id = tenantId;
    const { data, error } = await supabase.from('expenses').insert([payload]).select().single();
    if (error) throw new Error(error.message);
    if (data) setExpenses(prev => [toCamelCase(data), ...prev]);
  };

  const updateExpense = async (id: string, e: Partial<Expense>) => {
    const payload = toSnakeCase(e);
    delete payload.tenant_id;
    const { data, error } = await supabase.from('expenses').update(payload).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    if (data) setExpenses(prev => prev.map(x => x.id === id ? toCamelCase(data) : x));
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw new Error(error.message);
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const getExpensesByMonth = (month: string): Expense[] =>
    expenses.filter(e => e.month === month)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const value: DataContextType = {
    cases, counsel, appointments, transactions, courts, caseTypes, districts,
    tasks, attendance, expenses,
    addCase, updateCase, deleteCase,
    addCounsel, updateCounsel, deleteCounsel,
    addAppointment, updateAppointment, deleteAppointment,
    addTransaction, updateTransaction,
    addCourt, deleteCourt,
    addCaseType, deleteCaseType,
    addDistrict, deleteDistrict,
    addTask, updateTask, deleteTask, completeTask, getPendingTasksCount,
    markAttendance, clearAttendance, getAttendanceByUser, getAttendanceByDate,
    addExpense, updateExpense, deleteExpense, getExpensesByMonth,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextType => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
