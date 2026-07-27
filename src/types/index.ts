// User Types
export type UserRole = 'admin' | 'user' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: UserRole;
  isActive: boolean;
  avatar?: string;
  tenant_id?: string;
  tenant_plan?: string;
  trial_ends_at?: string;
  subscription_status?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  name: string;
  email: string;
  username: string;
  password: string;
  role: UserRole;
}

// Case Types
export type CaseStage = 
  | 'consultation'
  | 'drafting'
  | 'filing'
  | 'circulation'
  | 'notice'
  | 'pre-admission'
  | 'admitted'
  | 'final-hearing'
  | 'reserved'
  | 'disposed';

export interface Case {
  id: string;
  clientName: string;
  clientEmail: string;
  clientMobile: string;
  clientAlternateNo?: string;
  fileNo: string;
  stampNo: string;
  regNo: string;
  partiesName: string;
  district: string;
  caseType: string;
  court: string;
  onBehalfOf: string;
  noResp: string;
  opponentLawyer: string;
  additionalDetails: string;
  feesQuoted: number;
  status: 'pending' | 'active' | 'closed' | 'on-hold';
  stage: CaseStage;
  nextDate: Date | string;
  filingDate: Date | string;
  circulationStatus: string;
  circulationDate?: Date | string;
  interimRelief: string;
  interimDate?: Date | string;
  grantedDate?: Date | string;
  assignedTo?: string;
  assignedToName?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Counsel Types
export interface Counsel {
  id: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  details: string;
  totalCases: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Appointment Types
export interface Appointment {
  id: string;
  date: Date;
  time: string;
  user: string; // For frontend form compatibility
  userName?: string; // From database (user_name column)
  userId?: string; // From database (user_id column)
  client: string;
  details: string;
  createdAt: Date;
  updatedAt: Date;
}

// Transaction Types (Removed - Payment section removed)
export type PaymentMode = 'upi' | 'cash' | 'check' | 'bank-transfer' | 'card' | 'other';

export interface Transaction {
  id: string;
  amount: number;
  status: 'received' | 'pending';
  paymentMode: PaymentMode;
  receivedBy: string;
  confirmedBy: string;
  caseId: string;
  createdAt: Date;
}

// Expense Types
export interface Expense {
  id: string;
  amount: number;
  description: string;
  addedBy: string; // User ID
  addedByName: string; // User name for display
  month: string; // Format: "YYYY-MM"
  createdAt: Date;
  updatedAt: Date;
}

// Court Types
export interface Court {
  id: string;
  name: string;
  createdAt: Date;
}

// CaseType Types
export interface CaseType {
  id: string;
  name: string;
  createdAt: Date;
}

// District Types
export interface District {
  id: string;
  name: string;
  createdAt: Date;
}

// Task Management Types
export type TaskType = 'case' | 'custom';
export type TaskStatus = 'pending' | 'completed';

export interface Task {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  assignedTo: string; // User ID
  assignedToName: string; // User name for display
  assignedBy: string; // User ID
  assignedByName: string; // User name for display
  caseId?: string; // Only for case tasks
  caseName?: string; // Case client name for display
  deadline: Date | string;
  status: TaskStatus;
  completedAt?: Date;
  /** Set once the assignee has seen the "task assigned to you" popup */
  assigneeNotifiedAt?: string | null;
  /** Set once the assigner has seen the "task completed" popup */
  assignerNotifiedAt?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Attendance Management Types
export type AttendanceStatus = 'present' | 'absent';

export interface Attendance {
  id: string;
  userId: string;
  userName: string;
  date: Date;
  status: AttendanceStatus;
  markedBy: string; // Admin user ID
  markedByName: string; // Admin name for display
  createdAt: Date;
  updatedAt: Date;
}

// Auth Context Types
export interface AuthContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void | Promise<void>;
  createUser: (userData: CreateUserData) => Promise<{ success: boolean; error?: string }>;
  updateUserRole: (userId: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  toggleUserStatus: (userId: string) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
  error: string | null;
}

// Theme Context Types
export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// Data Context Types
export interface DataContextType {
  cases: Case[];
  counsel: Counsel[];
  appointments: Appointment[];
  transactions: Transaction[];
  courts: Court[];
  caseTypes: CaseType[];
  districts: District[];
  tasks: Task[];
  attendance: Attendance[];
  expenses: Expense[];
  addCase: (caseData: Omit<Case, 'id' | 'createdAt' | 'updatedAt'>) => void | Promise<void>;
  updateCase: (id: string, caseData: Partial<Case>) => void | Promise<void>;
  deleteCase: (id: string) => void | Promise<void>;
  addCounsel: (counselData: Omit<Counsel, 'id' | 'createdAt' | 'updatedAt'>) => void | Promise<void>;
  updateCounsel: (id: string, counselData: Partial<Counsel>) => void | Promise<void>;
  deleteCounsel: (id: string) => void | Promise<void>;
  addAppointment: (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => void | Promise<void>;
  updateAppointment: (id: string, appointmentData: Partial<Appointment>) => void | Promise<void>;
  deleteAppointment: (id: string) => void | Promise<void>;
  addTransaction: (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => void | Promise<void>;
  addCourt: (courtName: string) => Promise<Court | void>;
  deleteCourt: (id: string) => void | Promise<void>;
  addCaseType: (caseTypeName: string) => Promise<CaseType | void>;
  deleteCaseType: (id: string) => void | Promise<void>;
  // District Management
  addDistrict: (districtName: string) => Promise<District | void>;
  deleteDistrict: (id: string) => void | Promise<void>;
  // Task Management
  addTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void | Promise<void>;
  updateTask: (id: string, taskData: Partial<Task>) => void | Promise<void>;
  deleteTask: (id: string) => void | Promise<void>;
  completeTask: (id: string) => void | Promise<void>;
  markTaskNotified: (id: string, who: 'assignee' | 'assigner') => void | Promise<void>;
  getPendingTasksCount: (userId?: string) => number;
  // Attendance Management
  markAttendance: (userId: string, date: Date, status: AttendanceStatus) => void | Promise<void>;
  clearAttendance: (userId: string, date: Date) => void | Promise<void>;
  getAttendanceByUser: (userId: string, month?: number, year?: number) => Attendance[];
  getAttendanceByDate: (date: Date) => Attendance[];
  // Expense Management
  addExpense: (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void | Promise<void>;
  updateExpense: (id: string, expenseData: Partial<Expense>) => void | Promise<void>;
  deleteExpense: (id: string) => void | Promise<void>;
  getExpensesByMonth: (month: string) => Expense[];
  updateTransaction: (id: string, transactionData: Partial<Transaction>) => void | Promise<void>;
}

// Tenant (Firm) Types
export interface Tenant {
  id: string;
  firm_name: string;
  owner_name: string;
  owner_email: string;
  owner_mobile: string;
  bar_council_no: string;
  city: string;
  state: string;
  plan: 'trial' | 'basic' | 'pro' | 'advanced' | 'enterprise' | 'custom';
  subscription_status: 'active' | 'expired' | 'cancelled' | 'paused';
  trial_ends_at: string;
  subscription_ends_at?: string;
  max_users: number;
  max_cases: number;
  max_files?: number;
  created_at: string;
}

export interface TenantBranding {
  id: string;
  tenant_id: string;
  firm_display_name: string;
  primary_color: string;
  white_label_active: boolean;
}

export interface TenantAddon {
  id: string;
  tenant_id: string;
  addon: 'whatsapp_reminders' | 'telegram_reminders' | 'gmail_reminders' | 'ai_summarizer' | 'client_portal' | 'advanced_reports';
  is_active: boolean;
  activated_at: string;
}
