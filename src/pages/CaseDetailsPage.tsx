import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit, Home, FileText, Shield, RefreshCw, CheckSquare, Clock, Trash2, ExternalLink, Download, CheckCircle, Bell, CreditCard, BookOpen } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import RichTextEditor from '../components/RichTextEditor';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { getAllUsers } from '../lib/userManagement';
import { db, supabase } from '../lib/supabase';
import { User } from '../types';
import { formatIndianDate } from '../utils/dateFormat';
import { uploadFile, deleteFile, downloadFile } from '../lib/fileStorage';
import { generateReceipt } from '../utils/pdfGenerator';
import GatedFeature from '../components/GatedFeature';

type TabType = 'basic' | 'files' | 'interim' | 'circulation' | 'payments' | 'tasks' | 'timeline' | 'cause';

interface CauseEntry {
  id: string;
  case_id: string;
  tenant_id: string;
  hearing_date: string;
  outcome: string;
  notes: string;
  created_by_name: string;
  created_at: string;
}

interface CaseFile {  id: string;
  title: string;
  file: string;
  url: string;
  dateAttached: Date;
  attachedBy: string;
  caseId?: string;
  fileUrl?: string;
  externalUrl?: string;
}

interface CaseTask {
  id: string;
  title: string;
  user: string;
  deadline: Date;
  details: string;
  completed: boolean;
}

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
}

const CaseDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cases, deleteCase, updateCase, courts, caseTypes, districts } = useData();
  const { theme } = useTheme();
  const { isAdmin, user } = useAuth();
  const { tenant, branding } = useTenant();
  
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [assignedUserId, setAssignedUserId] = useState<string>('');
  const [isAssignmentSaving, setIsAssignmentSaving] = useState(false);
  const [assignmentNotification, setAssignmentNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Files state
  const [files, setFiles] = useState<CaseFile[]>([]);
  const [newFile, setNewFile] = useState({ title: '', file: '', url: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [fileNotification, setFileNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Interim Relief state — values must match SQL CHECK: 'favor', 'against', 'none'
  const [interimRelief, setInterimRelief] = useState('none');
  const [interimDate, setInterimDate] = useState('');
  const [grantedDate, setGrantedDate] = useState('');
  const [isInterimLoading, setIsInterimLoading] = useState(false);
  const [interimNotification, setInterimNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Circulation state — values must match SQL CHECK: 'circulated', 'non-circulated'
  const [circulationStatus, setCirculationStatus] = useState('non-circulated');
  const [circulationDate, setCirculationDate] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [isCirculationLoading, setIsCirculationLoading] = useState(false);
  const [circulationNotification, setCirculationNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Basic Details editable state
  const [basicDetailsState, setBasicDetailsState] = useState({
    status: 'pending',
    stage: 'consultation',
    caseType: '',
    court: '',
    district: '',
    filingDate: '',
    nextDateBasic: '',
  });
  const [isBasicDetailsLoading, setIsBasicDetailsLoading] = useState(false);
  const [basicDetailsNotification, setBasicDetailsNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [hasBasicDetailsChanged, setHasBasicDetailsChanged] = useState(false);
  
  // Tasks state
  const [tasks, setTasks] = useState<CaseTask[]>([]);
  const [newTask, setNewTask] = useState({ title: '', user: '', deadline: '', details: '' });

  // Fetch case tasks from DB
  useEffect(() => {
    if (!id) return;
    supabase
      .from('tasks')
      .select('*')
      .eq('case_id', id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setTasks(data.map((t: any) => ({
            id: t.id,
            title: t.title,
            user: t.assigned_to_name || '',
            deadline: t.deadline ? new Date(t.deadline) : new Date(),
            details: t.description || '',
            completed: t.status === 'completed',
          })));
        }
      });
  }, [id]);
  
  // Timeline state
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [newTimelineEvent, setNewTimelineEvent] = useState({ title: '', description: '' });
  const [editingTimelineEvent, setEditingTimelineEvent] = useState<TimelineEvent | null>(null);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);

  // Payments state
  const [payments, setPayments] = useState<any[]>([]);
  const [newPayment, setNewPayment] = useState({
    amount: '',
    date: '',
    referenceId: '',
    tdsAmount: '',
    paymentMode: ''
  });
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [paymentNotification, setPaymentNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Cause List state
  const [causeEntries, setCauseEntries] = useState<CauseEntry[]>([]);
  const [causeLoading, setCauseLoading] = useState(false);
  const [newCauseDate, setNewCauseDate] = useState(new Date().toISOString().split('T')[0]);
  const [newCauseOutcome, setNewCauseOutcome] = useState('');
  const [newCauseNotes, setNewCauseNotes] = useState('');
  const [savingCause, setSavingCause] = useState(false);

  // Case Report PDF state
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Fetch all users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      const result = await getAllUsers();
      if (result.success && result.users) {
        setUsers(result.users);
      }
    };
    fetchUsers();
  }, []);

  // Fetch case files from database
  useEffect(() => {
    const fetchCaseFiles = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await db.caseFiles.getByCaseId(id);
        if (error) {
          console.error('Error fetching case files:', error);
          return;
        }
        if (data) {
          // Convert database format to component format
          const formattedFiles: CaseFile[] = data.map((f: any) => ({
            id: f.id,
            title: f.title || f.file_name || 'Document',
            file: f.file_url || f.storage_path || '',
            url: f.external_url || '',
            dateAttached: new Date(f.created_at),
            attachedBy: f.attached_by || f.uploaded_by_name || f.uploaded_by || 'Unknown',
            caseId: f.case_id,
          }));
          setFiles(formattedFiles);
          console.log('✅ Loaded', formattedFiles.length, 'files for case');
        }
      } catch (err) {
        console.error('Error fetching case files:', err);
      }
    };
    
    fetchCaseFiles();
  }, [id]);

  // Fetch case timeline from database
  useEffect(() => {
    const fetchCaseTimeline = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await db.caseTimeline.getByCaseId(id);
        if (error) {
          console.error('Error fetching case timeline:', error);
          return;
        }
        if (data && data.length > 0) {
          // Convert database format to component format
          const formattedTimeline: TimelineEvent[] = data.map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description || '',
            date: new Date(t.event_date),
          }));
          setTimeline(formattedTimeline);
          console.log('✅ Loaded', formattedTimeline.length, 'timeline events for case');
        }
      } catch (err) {
        console.error('Error fetching case timeline:', err);
      }
    };
    
    fetchCaseTimeline();
  }, [id]);

  // Fetch case payments from database
  useEffect(() => {
    const fetchCasePayments = async () => {
      if (!id) return;
      
      try {
        // Try to fetch from database first
        const { data, error } = await db.casePayments.getByCaseId(id);
        if (error) {
          console.error('Error fetching payments:', error);
          // Fallback to localStorage for demo data
          const storedPayments = localStorage.getItem('case_payments');
          if (storedPayments) {
            const allPayments = JSON.parse(storedPayments);
            const casePayments = allPayments.filter((p: any) => p.case_id === id);
            setPayments(casePayments);
            console.log('✅ Loaded', casePayments.length, 'payments from demo data');
          }
          return;
        }
        if (data) {
          setPayments(data);
          console.log('✅ Loaded', data.length, 'payments for case');
        }
      } catch (err) {
        console.error('Error fetching payments:', err);
        // Fallback to localStorage for demo data
        const storedPayments = localStorage.getItem('case_payments');
        if (storedPayments) {
          const allPayments = JSON.parse(storedPayments);
          const casePayments = allPayments.filter((p: any) => p.case_id === id);
          setPayments(casePayments);
          console.log('✅ Loaded', casePayments.length, 'payments from demo data');
        }
      }
    };
    
    fetchCasePayments();
  }, [id]);

  // Fetch cause list entries
  useEffect(() => {
    const fetchCauseEntries = async () => {
      if (!id) return;
      setCauseLoading(true);
      try {
        const { data, error } = await supabase
          .from('case_cause_list')
          .select('*')
          .eq('case_id', id)
          .order('hearing_date', { ascending: false });
        if (!error && data) {
          setCauseEntries(data as CauseEntry[]);
        }
      } catch (err) {
        console.error('Cause list error:', err);
      } finally {
        setCauseLoading(false);
      }
    };
    fetchCauseEntries();
  }, [id]);

  // Get case data
  const caseData = useMemo(() => {
    if (id) {
      return cases.find(c => c.id === id);
    }
    return cases[0];
  }, [cases, id]);

  // Dynamic fee calculations from case data
  // Removed: feesQuoted and feesPaid calculations (payment section removed)

  // Initialize state from case data
  useEffect(() => {
    if (caseData) {
      // Set interim relief values
      if (caseData.interimRelief) {
        setInterimRelief(caseData.interimRelief);
      }
      if (caseData.interimDate) {
        setInterimDate(new Date(caseData.interimDate).toISOString().split('T')[0]);
      }
      if (caseData.grantedDate) {
        setGrantedDate(new Date(caseData.grantedDate).toISOString().split('T')[0]);
      }
      
      // Set circulation values
      if (caseData.circulationStatus) {
        setCirculationStatus(caseData.circulationStatus);
      }
      if (caseData.circulationDate) {
        setCirculationDate(new Date(caseData.circulationDate).toISOString().split('T')[0]);
      }
      if (caseData.nextDate) {
        setNextDate(new Date(caseData.nextDate).toISOString().split('T')[0]);
      }
      
      // Set assigned user from database
      if (caseData.assignedTo) {
        setAssignedUserId(caseData.assignedTo);
      }
      
      // Set basic details values
      setBasicDetailsState({
        status: caseData.status || 'pending',
        stage: caseData.stage || 'consultation',
        caseType: caseData.caseType || '',
        court: caseData.court || '',
        district: caseData.district || '',
        filingDate: caseData.filingDate ? new Date(caseData.filingDate).toISOString().split('T')[0] : '',
        nextDateBasic: caseData.nextDate ? new Date(caseData.nextDate).toISOString().split('T')[0] : '',
      });
      setHasBasicDetailsChanged(false);
    }
  }, [caseData]);

  const bgClass = theme === 'light' ? 'bg-white text-black' : 'glass-dark text-cyber-blue';
  const borderClass = theme === 'light' ? 'border-gray-300' : 'border-cyber-blue/20';
  const inputBgClass = theme === 'light' ? 'bg-white text-gray-900 border-gray-300 placeholder-gray-500' : 'bg-white/5 text-white border-orange-500/30 placeholder-gray-400';
  const labelClass = theme === 'light' ? 'text-gray-700' : 'text-cyber-blue/80';
  const cardBgClass = theme === 'light' ? 'bg-orange-50 border border-orange-200' : 'bg-cyber-blue/10 border border-cyber-blue/20';

  if (!caseData) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className={theme === 'light' ? 'text-gray-500' : 'text-gray-400'}>Case not found</p>
        </div>
      </MainLayout>
    );
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'basic', label: 'BASIC DETAILS', icon: <Home size={16} /> },
    { id: 'files', label: 'FILES', icon: <FileText size={16} /> },
    { id: 'interim', label: 'INTERIM RELIEF', icon: <Shield size={16} /> },
    { id: 'circulation', label: 'CIRCULATION', icon: <RefreshCw size={16} /> },
    { id: 'payments', label: 'PAYMENTS', icon: <Download size={16} /> },
    { id: 'tasks', label: 'CASE TASKS', icon: <CheckSquare size={16} /> },
    { id: 'timeline', label: 'CASE TIMELINE', icon: <Clock size={16} /> },
    { id: 'cause', label: 'CAUSE LIST', icon: <BookOpen size={16} /> },
  ];

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create a local URL for the file that can be downloaded
      const fileUrl = URL.createObjectURL(file);
      setNewFile({ ...newFile, file: fileUrl });
    }
  };

  const handleAddFile = async () => {
    if (!id) return;
    
    if (!newFile.title) {
      setFileNotification({ type: 'error', message: 'Please select a document type' });
      setTimeout(() => setFileNotification(null), 3000);
      return;
    }
    
    if (!selectedFile && !newFile.url) {
      setFileNotification({ type: 'error', message: 'Please select a file or provide a URL' });
      setTimeout(() => setFileNotification(null), 3000);
      return;
    }
    
    setIsFileLoading(true);
    try {
      let fileUrl = '';
      let storagePath = '';
      
      // If user selected a file, upload to Supabase Storage
      if (selectedFile) {
        console.log('📤 Uploading file to Supabase Storage...');
        const uploadResult = await uploadFile(selectedFile, id, selectedFile.name);
        
        if (!uploadResult.success) {
          setFileNotification({ type: 'error', message: `Upload failed: ${uploadResult.error}` });
          setTimeout(() => setFileNotification(null), 5000);
          setIsFileLoading(false);
          return;
        }
        
        fileUrl = uploadResult.url || '';
        storagePath = uploadResult.path || '';
        console.log('✅ File uploaded to storage:', fileUrl);
      }
      
      // Save to database
      const fileData: Record<string, any> = {
        case_id: id,
        tenant_id: user?.tenant_id,
        title: newFile.title,
        attached_by: user?.name || 'Admin User',
        uploaded_by: user?.id,
        uploaded_by_name: user?.name || 'Admin User',
      };
      
      // Add file URLs
      if (fileUrl) {
        fileData.file_url = fileUrl;
        fileData.storage_path = storagePath;
      }
      if (newFile.url) {
        fileData.external_url = newFile.url;
      }
      
      // Add file metadata
      if (selectedFile) {
        fileData.file_name = selectedFile.name;
        fileData.file_type = selectedFile.type;
        fileData.file_size = selectedFile.size;
        fileData.mime_type = selectedFile.type;
      }
      
      console.log('💾 Saving file metadata to database:', fileData);
      
      const { data, error } = await db.caseFiles.create(fileData);
      
      if (error) {
        console.error('❌ Error saving file metadata:', error);
        setFileNotification({ type: 'error', message: `Failed to save file: ${error.message}` });
        setTimeout(() => setFileNotification(null), 5000);
        setIsFileLoading(false);
        return;
      }
      
      if (data) {
        // Add to local state
        const newFileEntry: CaseFile = {
          id: data.id,
          title: data.title,
          file: data.file_url || '',
          url: data.external_url || '',
          dateAttached: new Date(data.created_at),
          attachedBy: data.attached_by || 'Unknown',
          caseId: data.case_id,
        };
        
        setFiles(prev => [newFileEntry, ...prev]);
        setNewFile({ title: '', file: '', url: '' });
        setSelectedFile(null);
        
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        setFileNotification({ 
          type: 'success', 
          message: `✅ File "${newFile.title}" uploaded successfully! All users can now download it from anywhere.` 
        });
        setTimeout(() => setFileNotification(null), 5000);
        
        console.log('✅ File saved successfully:', data);
      }
    } catch (err: any) {
      console.error('❌ Error adding file:', err);
      setFileNotification({ type: 'error', message: `Failed to attach file: ${err.message || 'Unknown error'}` });
      setTimeout(() => setFileNotification(null), 5000);
    } finally {
      setIsFileLoading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    
    try {
      // Find the file to get storage path
      const fileToDelete = files.find(f => f.id === fileId);
      
      // Delete from Supabase Storage if it has a storage path
      if (fileToDelete) {
        // Get the file data from database to find storage_path
        const { data: fileData } = await supabase
          .from('case_files')
          .select('storage_path')
          .eq('id', fileId)
          .single();
        
        if (fileData?.storage_path) {
          console.log('🗑️ Deleting file from storage:', fileData.storage_path);
          const deleteResult = await deleteFile(fileData.storage_path);
          if (!deleteResult.success) {
            console.warn('⚠️ Failed to delete from storage:', deleteResult.error);
          }
        }
      }
      
      // Delete from database
      const { error } = await db.caseFiles.delete(fileId);
      
      if (error) {
        console.error('Error deleting file from database:', error);
        setFileNotification({ type: 'error', message: 'Failed to delete file' });
        setTimeout(() => setFileNotification(null), 3000);
        return;
      }
      
      setFiles(prev => prev.filter(f => f.id !== fileId));
      setFileNotification({ type: 'success', message: 'File deleted successfully from storage and database' });
      setTimeout(() => setFileNotification(null), 3000);
    } catch (err) {
      console.error('Error deleting file:', err);
      setFileNotification({ type: 'error', message: 'Failed to delete file' });
      setTimeout(() => setFileNotification(null), 3000);
    }
  };

  const handleDownloadFile = (file: CaseFile) => {
    // Priority: 1. External URL, 2. Supabase Storage URL
    if (file.url && file.url.trim() !== '') {
      // Open external URL in new tab
      console.log('📥 Opening external URL:', file.url);
      window.open(file.url, '_blank');
    } else if (file.file && file.file.trim() !== '') {
      // Download from Supabase Storage
      console.log('📥 Downloading from Supabase Storage:', file.file);
      downloadFile(file.file, file.title);
    } else {
      setFileNotification({ 
        type: 'error', 
        message: 'No file URL available. The file may not have been uploaded correctly.' 
      });
      setTimeout(() => setFileNotification(null), 5000);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.user) {
      setAssignmentNotification({ type: 'error', message: 'Please fill task title and assign a user' });
      setTimeout(() => setAssignmentNotification(null), 3000);
      return;
    }

    // Find the assigned user object so we can persist their ID
    const assignedUser = users.find(u => u.name === newTask.user || u.id === newTask.user);

    try {
      const payload = {
        tenant_id: user?.tenant_id,
        type: 'case' as const,
        title: newTask.title,
        description: newTask.details || '',
        assigned_to: assignedUser?.id || null,
        assigned_to_name: assignedUser?.name || newTask.user,
        assigned_by: user?.id || null,
        assigned_by_name: user?.name || '',
        case_id: id || null,
        case_name: caseData?.clientName || '',
        deadline: newTask.deadline ? new Date(newTask.deadline).toISOString() : null,
        status: 'pending' as const,
      };

      const { data, error } = await supabase.from('tasks').insert([payload]).select().single();

      if (error) {
        setAssignmentNotification({ type: 'error', message: `Failed to create task: ${error.message}` });
        setTimeout(() => setAssignmentNotification(null), 4000);
        return;
      }

      if (data) {
        const newCaseTask: CaseTask = {
          id: data.id,
          title: data.title,
          user: data.assigned_to_name || newTask.user,
          deadline: new Date(data.deadline || Date.now()),
          details: data.description || '',
          completed: data.status === 'completed',
        };
        setTasks(prev => [...prev, newCaseTask]);
        setNewTask({ title: '', user: '', deadline: '', details: '' });

        setAssignmentNotification({
          type: 'success',
          message: `Task "${data.title}" assigned to ${data.assigned_to_name} and saved!`,
        });
        setTimeout(() => setAssignmentNotification(null), 4000);
      }
    } catch (err: any) {
      setAssignmentNotification({ type: 'error', message: `Error: ${err.message}` });
      setTimeout(() => setAssignmentNotification(null), 4000);
    }
  };

  const handleAddTimelineEvent = async () => {
    if (!newTimelineEvent.title || !id) return;
    
    setIsTimelineLoading(true);
    try {
      const { data, error } = await db.caseTimeline.create({
        case_id: id,
        tenant_id: user?.tenant_id,
        title: newTimelineEvent.title,
        description: newTimelineEvent.description || '',
        event_date: new Date().toISOString(),
        created_by: user?.id,
        created_by_name: user?.name || 'Admin'
      });
      
      if (error) {
        console.error('Error saving timeline event:', error);
        return;
      }
      
      if (data) {
        const newEvent: TimelineEvent = {
          id: data.id,
          title: data.title,
          description: data.description || '',
          date: new Date(data.event_date)
        };
        setTimeline(prev => [newEvent, ...prev]);
        setNewTimelineEvent({ title: '', description: '' });
        console.log('✅ Timeline event saved:', data);
      }
    } catch (err) {
      console.error('Error adding timeline event:', err);
    } finally {
      setIsTimelineLoading(false);
    }
  };

  const handleEditTimelineEvent = (event: TimelineEvent) => {
    setEditingTimelineEvent(event);
  };

  const handleSaveTimelineEvent = async () => {
    if (!editingTimelineEvent || !editingTimelineEvent.title) return;
    
    try {
      const { error } = await db.caseTimeline.update(editingTimelineEvent.id, {
        title: editingTimelineEvent.title,
        description: editingTimelineEvent.description
      });
      
      if (error) {
        console.error('Error updating timeline event:', error);
        return;
      }
      
      setTimeline(prev => prev.map(e => 
        e.id === editingTimelineEvent.id ? editingTimelineEvent : e
      ));
      setEditingTimelineEvent(null);
      console.log('✅ Timeline event updated');
    } catch (err) {
      console.error('Error saving timeline event:', err);
    }
  };

  const handleDeleteTimelineEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this timeline event?')) return;
    
    try {
      const { error } = await db.caseTimeline.delete(eventId);
      
      if (error) {
        console.error('Error deleting timeline event:', error);
        return;
      }
      
      setTimeline(prev => prev.filter(e => e.id !== eventId));
      console.log('✅ Timeline event deleted');
    } catch (err) {
      console.error('Error deleting timeline event:', err);
    }
  };

  // Handle Basic Details field change
  const handleBasicDetailsChange = (field: string, value: string) => {
    setBasicDetailsState(prev => ({ ...prev, [field]: value }));
    setHasBasicDetailsChanged(true);
  };

  // Handle Assignment Change - Auto-save immediately
  const handleAssignmentChange = async (userId: string) => {
    if (!id) return;
    
    setAssignedUserId(userId);
    setIsAssignmentSaving(true);
    
    try {
      // Find the assigned user's name
      const assignedUser = users.find(u => u.id === userId);
      const assignedToName = assignedUser ? assignedUser.name : '';
      
      // Save directly to database using supabase
      const { error } = await db.cases.update(id, {
        assigned_to: userId || null,
        assigned_to_name: assignedToName || null,
      });
      
      if (error) {
        console.error('Error saving assignment:', error);
        setAssignmentNotification({ type: 'error', message: 'Failed to save assignment. Please run the database migration.' });
        setTimeout(() => setAssignmentNotification(null), 5000);
        return;
      }
      
      setAssignmentNotification({ 
        type: 'success', 
        message: assignedToName ? `Case assigned to ${assignedToName}` : 'Assignment removed' 
      });
      setTimeout(() => setAssignmentNotification(null), 3000);
      
      console.log('✅ Assignment saved:', assignedToName || 'None');
    } catch (error) {
      console.error('Error saving assignment:', error);
      setAssignmentNotification({ type: 'error', message: 'Failed to save assignment' });
      setTimeout(() => setAssignmentNotification(null), 3000);
    } finally {
      setIsAssignmentSaving(false);
    }
  };

  // Handle Save Basic Details
  const handleSaveBasicDetails = async () => {
    if (!id) return;
    
    setIsBasicDetailsLoading(true);
    try {
      // Find the assigned user's name
      const assignedUser = users.find(u => u.id === assignedUserId);
      const assignedToName = assignedUser ? assignedUser.name : '';
      
      await updateCase(id, {
        status: basicDetailsState.status as any,
        stage: basicDetailsState.stage as any,
        caseType: basicDetailsState.caseType,
        court: basicDetailsState.court,
        district: basicDetailsState.district,
        filingDate: basicDetailsState.filingDate || undefined,
        nextDate: basicDetailsState.nextDateBasic || undefined,
        assignedTo: assignedUserId || undefined,
        assignedToName: assignedToName || undefined,
      });
      
      // Add to timeline
      setTimeline([{
        id: Date.now().toString(),
        title: `Case Details Updated`,
        description: `Stage: ${basicDetailsState.stage}, Status: ${basicDetailsState.status}`,
        date: new Date()
      }, ...timeline]);
      
      setBasicDetailsNotification({ type: 'success', message: 'Case details saved successfully! Dashboard will reflect the changes.' });
      setHasBasicDetailsChanged(false);
      setTimeout(() => setBasicDetailsNotification(null), 4000);
    } catch (error) {
      setBasicDetailsNotification({ type: 'error', message: 'Failed to save case details' });
      setTimeout(() => setBasicDetailsNotification(null), 3000);
    } finally {
      setIsBasicDetailsLoading(false);
    }
  };

  // Handle Update Interim Relief
  const handleUpdateInterimRelief = async () => {
    if (!id) return;
    
    setIsInterimLoading(true);
    try {
      await updateCase(id, {
        interimRelief: interimRelief,
        interimDate: interimDate ? new Date(interimDate) : undefined,
        grantedDate: grantedDate ? new Date(grantedDate) : undefined,
      });
      
      // Add to timeline
      const dateInfo = [];
      if (interimDate) dateInfo.push(`Date: ${formatIndianDate(interimDate)}`);
      if (grantedDate) dateInfo.push(`Granted: ${formatIndianDate(grantedDate)}`);
      
      setTimeline([{
        id: Date.now().toString(),
        title: `Interim Relief Updated to ${interimRelief}`,
        description: dateInfo.join(', '),
        date: new Date()
      }, ...timeline]);
      
      setInterimNotification({ type: 'success', message: `Interim Relief updated to ${interimRelief} successfully!` });
      setTimeout(() => setInterimNotification(null), 4000);
    } catch (error) {
      setInterimNotification({ type: 'error', message: 'Failed to update interim relief' });
      setTimeout(() => setInterimNotification(null), 3000);
    } finally {
      setIsInterimLoading(false);
    }
  };

  // Handle Update Circulation Status
  const handleUpdateCirculation = async () => {
    if (!id) return;
    
    setIsCirculationLoading(true);
    try {
      await updateCase(id, {
        circulationStatus: circulationStatus,
        circulationDate: circulationDate ? new Date(circulationDate) : undefined,
        nextDate: nextDate ? new Date(nextDate) : undefined,
      });
      
      // Add to timeline
      setTimeline([{
        id: Date.now().toString(),
        title: `Circulation Status Updated to ${circulationStatus}`,
        description: circulationDate ? `Circulation Date: ${formatIndianDate(circulationDate)}${nextDate ? `, Grant Date: ${formatIndianDate(nextDate)}` : ''}` : '',
        date: new Date()
      }, ...timeline]);
      
      setCirculationNotification({ type: 'success', message: `Circulation status updated to ${circulationStatus} successfully!` });
      setTimeout(() => setCirculationNotification(null), 4000);
    } catch (error) {
      setCirculationNotification({ type: 'error', message: 'Failed to update circulation status' });
      setTimeout(() => setCirculationNotification(null), 3000);
    } finally {
      setIsCirculationLoading(false);
    }
  };

  const handleEdit = () => {
    if (id) {
      navigate(`/cases/${id}/edit`);
    }
  };

  // Generate a printable/downloadable case report (client-shareable)
  const generateCaseReport = async () => {
    if (!caseData) return;
    setGeneratingPDF(true);
    try {
      // Fetch timeline for this case
      const { data: timelineData } = await supabase
        .from('case_timeline')
        .select('*')
        .eq('case_id', id)
        .order('event_date', { ascending: true });

      // Fetch cause list for this case
      const { data: causeListData } = await supabase
        .from('case_cause_list')
        .select('*')
        .eq('case_id', id)
        .order('hearing_date', { ascending: false });

      const firmName = branding?.firm_display_name || tenant?.firm_name || 'VakilDesk';

      const formatDate = (d: string | Date | null | undefined) => {
        if (!d) return 'Not set';
        const parsed = new Date(d);
        if (isNaN(parsed.getTime())) return 'Not set';
        return parsed.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });
      };

      const formatShort = (d: string | Date | null | undefined) => {
        if (!d) return '';
        const parsed = new Date(d);
        if (isNaN(parsed.getTime())) return '';
        return parsed.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      };

      // Escape user-entered values so special characters don't break the layout
      const esc = (v: unknown) => {
        if (v === null || v === undefined) return '';
        return String(v)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      };

      // caseData.court / caseData.caseType store the record ID (UUID), not the
      // display name — resolve them against the loaded lists so the report shows
      // readable names instead of a hash-looking UUID.
      const courtName =
        courts.find((c: any) => c.id === caseData.court)?.name || caseData.court || 'N/A';
      const caseTypeName =
        caseTypes.find((ct: any) => ct.id === caseData.caseType)?.name || caseData.caseType || 'N/A';

      const interimHtml = caseData.interimRelief === 'favor'
        ? '<span class="badge badge-green">FAVOR</span>'
        : caseData.interimRelief === 'against'
          ? '<span class="badge badge-red">AGAINST</span>'
          : 'None';

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Case Report — ${esc(caseData.clientName)}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: #1e293b; background: #ffffff; padding: 36px; max-width: 820px; margin: 0 auto; line-height: 1.5; }
.header { background: linear-gradient(135deg, #f97316, #ea580c); color: #ffffff; padding: 26px 30px; border-radius: 14px; margin-bottom: 26px; text-align: center; }
.header h1 { font-size: 26px; font-weight: 800; margin-bottom: 6px; letter-spacing: 0.2px; }
.header p { font-size: 13px; opacity: 0.92; }
.section { margin-bottom: 22px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; page-break-inside: avoid; }
.section-title { background: #f8fafc; padding: 13px 20px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #475569; border-bottom: 1px solid #e2e8f0; }
.grid { display: grid; grid-template-columns: 1fr 1fr; }
.field { padding: 13px 20px; border-bottom: 1px solid #f1f5f9; }
.field:nth-child(odd) { border-right: 1px solid #f1f5f9; }
.field-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.7px; color: #94a3b8; margin-bottom: 4px; }
.field-value { font-size: 14.5px; color: #0f172a; font-weight: 500; word-break: break-word; }
.field-full { padding: 13px 20px; border-top: 1px solid #f1f5f9; }
.badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; }
.badge-orange { background: #fff7ed; color: #ea580c; border: 1px solid #fed7aa; }
.badge-green { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
.badge-red { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.list-item { padding: 15px 20px; border-bottom: 1px solid #f1f5f9; }
.list-item:last-child { border-bottom: none; }
.item-date { display: inline-block; background: #fff7ed; color: #ea580c; border: 1px solid #fed7aa; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; margin-bottom: 7px; }
.item-title { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 3px; }
.item-desc { font-size: 13px; color: #475569; line-height: 1.55; white-space: pre-wrap; }
.empty { padding: 22px 20px; color: #94a3b8; font-size: 13px; text-align: center; }
.footer { margin-top: 26px; padding: 18px 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; }
.footer p { font-size: 11.5px; color: #64748b; line-height: 1.7; }
@media print {
  body { padding: 16px; }
  .section, .header, .footer { page-break-inside: avoid; }
}
</style>
</head>
<body>
<div class="header">
<h1>⚖️ ${esc(firmName)}</h1>
<p>Case Report &nbsp;•&nbsp; Generated on ${formatDate(new Date())}</p>
</div>

<div class="section">
<div class="section-title">Client &amp; Case Information</div>
<div class="grid">
<div class="field"><div class="field-label">Client Name</div><div class="field-value">${esc(caseData.clientName) || 'N/A'}</div></div>
<div class="field"><div class="field-label">File Number</div><div class="field-value">${esc(caseData.fileNo) || 'N/A'}</div></div>
<div class="field"><div class="field-label">Client Mobile</div><div class="field-value">${esc(caseData.clientMobile) || 'N/A'}</div></div>
<div class="field"><div class="field-label">Client Email</div><div class="field-value">${esc(caseData.clientEmail) || 'N/A'}</div></div>
<div class="field"><div class="field-label">Parties</div><div class="field-value">${esc(caseData.partiesName) || 'N/A'}</div></div>
<div class="field"><div class="field-label">On Behalf Of</div><div class="field-value">${esc(caseData.onBehalfOf) || 'N/A'}</div></div>
</div>
</div>

<div class="section">
<div class="section-title">Court Details</div>
<div class="grid">
<div class="field"><div class="field-label">Court</div><div class="field-value">${esc(courtName)}</div></div>
<div class="field"><div class="field-label">District</div><div class="field-value">${esc(caseData.district) || 'N/A'}</div></div>
<div class="field"><div class="field-label">Case Type</div><div class="field-value">${esc(caseTypeName)}</div></div>
<div class="field"><div class="field-label">Registration No</div><div class="field-value">${esc(caseData.regNo) || 'N/A'}</div></div>
<div class="field"><div class="field-label">Stamp Number</div><div class="field-value">${esc(caseData.stampNo) || 'N/A'}</div></div>
<div class="field"><div class="field-label">Opponent Lawyer</div><div class="field-value">${esc(caseData.opponentLawyer) || 'N/A'}</div></div>
</div>
</div>

<div class="section">
<div class="section-title">Case Status</div>
<div class="grid">
<div class="field"><div class="field-label">Status</div><div class="field-value"><span class="badge badge-orange">${esc((caseData.status || 'pending').toUpperCase())}</span></div></div>
<div class="field"><div class="field-label">Stage</div><div class="field-value"><span class="badge badge-orange">${esc((caseData.stage || 'consultation').toUpperCase().replace(/-/g, ' '))}</span></div></div>
<div class="field"><div class="field-label">Next Hearing Date</div><div class="field-value">${formatDate(caseData.nextDate)}</div></div>
<div class="field"><div class="field-label">Filing Date</div><div class="field-value">${formatDate(caseData.filingDate)}</div></div>
<div class="field"><div class="field-label">Interim Relief</div><div class="field-value">${interimHtml}</div></div>
<div class="field"><div class="field-label">Circulation</div><div class="field-value">${esc(caseData.circulationStatus) || 'N/A'}</div></div>
<div class="field"><div class="field-label">Fees Quoted</div><div class="field-value">₹${(caseData.feesQuoted || 0).toLocaleString('en-IN')}</div></div>
<div class="field"><div class="field-label">Created On</div><div class="field-value">${formatDate(caseData.createdAt)}</div></div>
</div>
${caseData.additionalDetails ? `<div class="field-full"><div class="field-label">Additional Details</div><div class="field-value" style="white-space:pre-wrap">${esc(caseData.additionalDetails)}</div></div>` : ''}
</div>

<div class="section">
<div class="section-title">Hearing History (Cause List)</div>
${causeListData && causeListData.length > 0
  ? causeListData.map((entry: any) => `<div class="list-item"><div class="item-date">${formatShort(entry.hearing_date)}</div><div class="item-title">${esc(entry.outcome)}</div>${entry.notes ? `<div class="item-desc">${esc(entry.notes)}</div>` : ''}</div>`).join('')
  : '<div class="empty">No hearing entries recorded yet.</div>'}
</div>

<div class="section">
<div class="section-title">Case Timeline</div>
${timelineData && timelineData.length > 0
  ? timelineData.map((event: any) => `<div class="list-item"><div class="item-date">${formatShort(event.event_date)}</div><div class="item-title">${esc(event.title)}</div>${event.description ? `<div class="item-desc">${esc(event.description)}</div>` : ''}</div>`).join('')
  : '<div class="empty">No timeline events recorded yet.</div>'}
</div>

<div class="footer">
<p>This case report was generated by <strong>${esc(firmName)}</strong> using VakilDesk Legal Office Management System.<br>For queries contact your advocate directly. This document is confidential and intended for the named client only.</p>
</div>
</body>
</html>`;

      // Render into a hidden iframe and print — more reliable than window.open
      // (not blocked by popup blockers) and keeps the app page intact.
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        document.body.removeChild(iframe);
        alert('Could not open the report. Please try again.');
        return;
      }
      doc.open();
      doc.write(html);
      doc.close();

      // Wait for content (fonts/layout) to settle, then trigger print.
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('Print error:', e);
        }
        // Clean up the iframe after the print dialog is handled.
        setTimeout(() => {
          if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        }, 1000);
      }, 400);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate report. Try again.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleDelete = async () => {
    if (id) {
      await deleteCase(id);
      navigate('/cases');
    }
  };

  // Handle Add Payment
  const handleAddPayment = async () => {
    if (!id || !newPayment.amount || !newPayment.date || !newPayment.paymentMode) {
      setPaymentNotification({ type: 'error', message: 'Please fill all required fields' });
      setTimeout(() => setPaymentNotification(null), 3000);
      return;
    }
    
    setIsPaymentLoading(true);
    try {
      const paymentData = {
        case_id: id,
        tenant_id: user?.tenant_id,
        amount: parseFloat(newPayment.amount),
        date: newPayment.date,
        received_by: user?.name || 'Admin User',
        payment_mode: newPayment.paymentMode,
        reference_id: newPayment.referenceId || undefined,
        tds: newPayment.tdsAmount ? parseFloat(newPayment.tdsAmount) : 0,
        is_accepted: isAdmin, // Auto-accept if admin
      };
      
      const { data, error } = await db.casePayments.create(paymentData);
      
      if (error) {
        console.error('Error adding payment:', error);
        setPaymentNotification({ type: 'error', message: 'Failed to add payment' });
        setTimeout(() => setPaymentNotification(null), 3000);
        return;
      }
      
      if (data) {
        setPayments(prev => [data, ...prev]);
        setNewPayment({ amount: '', date: '', referenceId: '', tdsAmount: '', paymentMode: '' });
        setPaymentNotification({ 
          type: 'success', 
          message: isAdmin ? 'Payment added and accepted!' : 'Payment added! Waiting for admin approval.' 
        });
        setTimeout(() => setPaymentNotification(null), 4000);
        
        // Add to timeline
        setTimeline([{
          id: Date.now().toString(),
          title: `Payment Received: ₹${paymentData.amount.toLocaleString('en-IN')}`,
          description: `Payment mode: ${paymentData.payment_mode}${paymentData.reference_id ? `, Ref: ${paymentData.reference_id}` : ''}`,
          date: new Date()
        }, ...timeline]);
      }
    } catch (err) {
      console.error('Error adding payment:', err);
      setPaymentNotification({ type: 'error', message: 'Failed to add payment' });
      setTimeout(() => setPaymentNotification(null), 3000);
    } finally {
      setIsPaymentLoading(false);
    }
  };

  // Handle Download Receipt
  const handleDownloadReceipt = () => {
    if (!caseData) return;
    
    // Calculate fees paid
    const feesPaid = payments
      .filter(p => p.is_accepted)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // Use tenant firm name (with fallback to VakilDesk)
    const firmName = branding?.firm_display_name || tenant?.firm_name || 'VakilDesk';
    
    generateReceipt({
      firmName,
      caseData: {
        client_name: caseData.clientName,
        mobile: caseData.clientMobile,
        email: caseData.clientEmail,
        case_type: caseData.caseType,
        court: caseData.court,
        district: caseData.district,
        file_no: caseData.fileNo,
        registration_no: caseData.regNo,
        fees_quoted: caseData.feesQuoted,
        id: caseData.id,
      },
      payments: payments.filter(p => p.is_accepted).map(p => ({
        amount: p.amount,
        date: p.date,
        payment_mode: p.payment_mode,
        reference_id: p.reference_id ?? undefined,
        tds_amount: p.tds,
      })),
      feesPaid,
    });
    
    setPaymentNotification({ type: 'success', message: 'Receipt downloaded successfully!' });
    setTimeout(() => setPaymentNotification(null), 3000);
  };

  return (
    <MainLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${bgClass} p-6 rounded-xl border ${borderClass} mb-6`}
      >
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-bold font-cyber ${theme === 'light' ? 'text-gray-900' : 'holographic-text'}`}>Case Details</h1>
          <div className="flex gap-3">
            <button
              onClick={generateCaseReport}
              disabled={generatingPDF}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border transition-colors disabled:opacity-50 ${theme === 'light' ? 'border-gray-300 text-gray-700 hover:bg-gray-50 bg-white' : 'border-white/20 text-white hover:bg-white/10 bg-white/5'}`}
            >
              <Download size={16} />
              {generatingPDF ? 'Generating...' : 'Download'}
            </button>
            <button 
              onClick={handleEdit}
              className="px-6 py-2 rounded-lg font-semibold font-cyber transition-all duration-300 flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg border border-amber-500/30"
            >
              <Edit size={18} />
              EDIT
            </button>
            {isAdmin && (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-2 rounded-lg font-semibold font-cyber transition-all duration-300 flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg border border-red-500/30"
              >
                <Trash2 size={18} />
                DELETE
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className={`${bgClass} p-8 rounded-2xl border ${borderClass} max-w-md w-full mx-4`}
          >
            <h2 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-cyber-blue'}`}>
              Confirm Delete
            </h2>
            <p className={`mb-6 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              Are you sure you want to delete this case? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleDelete}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all duration-300 border border-red-500/30"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`flex-1 font-semibold py-3 rounded-lg transition-all duration-300 ${
                  theme === 'light' 
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300' 
                    : 'bg-cyber-blue/10 text-cyber-blue hover:bg-cyber-blue/20 border border-cyber-blue/30'
                }`}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className={`flex gap-1 mb-6 border-b ${borderClass} overflow-x-auto`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-4 font-medium font-cyber transition-all duration-300 whitespace-nowrap flex items-center gap-2 text-sm ${
              activeTab === tab.id
                ? 'text-cyber-blue border-b-2 border-cyber-blue text-glow'
                : theme === 'light' ? 'text-gray-600 hover:text-black' : 'text-cyber-blue/50 hover:text-cyber-blue'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Basic Details Tab */}
        {activeTab === 'basic' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Notification */}
            {basicDetailsNotification && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`md:col-span-2 p-4 rounded-xl flex items-center gap-3 ${
                  basicDetailsNotification.type === 'success' 
                    ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
                    : 'bg-red-500/20 border border-red-500/30 text-red-400'
                }`}
              >
                {basicDetailsNotification.type === 'success' ? <CheckCircle size={20} /> : <Bell size={20} />}
                <span className="font-medium">{basicDetailsNotification.message}</span>
              </motion.div>
            )}
            
            {/* Basic Details Card */}
            <div className={`${cardBgClass} p-6 rounded-xl`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-orange-600">Basic Details</h3>
                {hasBasicDetailsChanged && (
                  <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full">Unsaved changes</span>
                )}
              </div>
              <div className="space-y-3">
                <p><span className="font-medium">Client -</span> <span className="text-cyan-500">{caseData.clientName} | {caseData.clientMobile}</span></p>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Assigned To -</span>
                  <select 
                    value={assignedUserId} 
                    onChange={(e) => handleAssignmentChange(e.target.value)}
                    disabled={isAssignmentSaving}
                    className={`px-3 py-1 rounded border ${inputBgClass} flex-1 ${isAssignmentSaving ? 'opacity-50' : ''}`}
                  >
                    <option value="">Not Assigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                  {isAssignmentSaving && <span className="text-xs text-amber-500">Saving...</span>}
                </div>
                {assignmentNotification && (
                  <div className={`text-sm px-2 py-1 rounded ${
                    assignmentNotification.type === 'success' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {assignmentNotification.message}
                  </div>
                )}
                <p><span className="font-medium">Name of Parties -</span> {caseData.partiesName}</p>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Case Status -</span>
                  <select 
                    className={`px-3 py-1 rounded border ${inputBgClass}`} 
                    value={basicDetailsState.status}
                    onChange={(e) => handleBasicDetailsChange('status', e.target.value)}
                  >
                    <option value="pending">PENDING</option>
                    <option value="active">ACTIVE</option>
                    <option value="on-hold">ON HOLD</option>
                    <option value="closed">CLOSED</option>
                  </select>
                </div>
                <p><span className="font-medium">On Behalf Of -</span> {caseData.onBehalfOf || 'PETITIONER'}</p>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Case Stage -</span>
                  <select 
                    className={`px-3 py-1 rounded border ${inputBgClass} flex-1`} 
                    value={basicDetailsState.stage}
                    onChange={(e) => handleBasicDetailsChange('stage', e.target.value)}
                  >
                    <option value="">Select Stage</option>
                    <option value="consultation">Consultation</option>
                    <option value="drafting">Drafting</option>
                    <option value="filing">Filing</option>
                    <option value="circulation">Circulation</option>
                    <option value="notice">Notice</option>
                    <option value="pre-admission">Pre Admission</option>
                    <option value="admitted">Admitted</option>
                    <option value="final-hearing">Final Hearing</option>
                    <option value="reserved">Reserved For Judgement</option>
                    <option value="disposed">Disposed</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Case Type -</span>
                  <select 
                    className={`px-3 py-1 rounded border ${inputBgClass}`} 
                    value={basicDetailsState.caseType}
                    onChange={(e) => handleBasicDetailsChange('caseType', e.target.value)}
                  >
                    <option value="">Select Case Type</option>
                    {caseTypes.map((ct) => (
                      <option key={ct.id} value={ct.name}>{ct.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Court -</span>
                  <select 
                    className={`px-3 py-1 rounded border ${inputBgClass}`} 
                    value={basicDetailsState.court}
                    onChange={(e) => handleBasicDetailsChange('court', e.target.value)}
                  >
                    <option value="">Select Court</option>
                    {courts.map((court) => (
                      <option key={court.id} value={court.name}>{court.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">District -</span>
                  <select 
                    className={`px-3 py-1 rounded border ${inputBgClass}`} 
                    value={basicDetailsState.district}
                    onChange={(e) => handleBasicDetailsChange('district', e.target.value)}
                  >
                    <option value="">Select District</option>
                    {districts.map((district) => (
                      <option key={district.id} value={district.name}>{district.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Important Details Card */}
            <div className={`${cardBgClass} p-6 rounded-xl`}>
              <h3 className="text-lg font-bold mb-4 text-orange-600">Important Details</h3>
              <div className="space-y-3">
                <p><span className="font-medium">Circulation Status -</span> {caseData.circulationStatus?.toUpperCase() || 'NON CIRCULATED'}</p>
                <p><span className="font-medium">Office File Number -</span> {caseData.fileNo}</p>
                <p><span className="font-medium">Stamp Number -</span> {caseData.stampNo || '-'}</p>
                <p><span className="font-medium">Registration Number -</span> {caseData.regNo}</p>
                <p><span className="font-medium">Created On -</span> {formatIndianDate(caseData.createdAt)}</p>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Filing Date -</span>
                  <input 
                    type="date" 
                    className={`px-3 py-1 rounded border ${inputBgClass}`} 
                    value={basicDetailsState.filingDate}
                    onChange={(e) => handleBasicDetailsChange('filingDate', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Next Date -</span>
                  <input 
                    type="date" 
                    className={`px-3 py-1 rounded border ${inputBgClass}`} 
                    value={basicDetailsState.nextDateBasic}
                    onChange={(e) => handleBasicDetailsChange('nextDateBasic', e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Save Button for Basic Details - More Prominent */}
            <div className="md:col-span-2">
              {hasBasicDetailsChanged && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-4 mb-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Bell size={20} className="text-amber-400" />
                    <span className="text-amber-400 font-medium">You have unsaved changes. Click Save to update the case and reflect changes on dashboard.</span>
                  </div>
                </motion.div>
              )}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveBasicDetails}
                  disabled={isBasicDetailsLoading || !hasBasicDetailsChanged}
                  className={`px-10 py-4 rounded-xl font-bold font-cyber transition-all duration-300 flex items-center gap-3 text-lg ${
                    hasBasicDetailsChanged
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:scale-105 border border-green-500/30 animate-pulse'
                      : 'bg-gray-500/20 text-gray-400 cursor-not-allowed border border-gray-500/30'
                  }`}
                >
                  {isBasicDetailsLoading ? (
                    <>
                      <RefreshCw size={22} className="animate-spin" />
                      Saving to Database...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={22} />
                      SAVE ALL CHANGES
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Additional Details */}
            <div className={`${cardBgClass} p-6 rounded-xl md:col-span-2`}>
              <h3 className="text-lg font-bold mb-4 text-orange-600">Additional Details</h3>
              <p>{caseData.additionalDetails || 'No additional details'}</p>
            </div>
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className={`${bgClass} p-6 rounded-xl border ${borderClass}`}>
            {/* Info Message */}
            <div className="mb-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-3">
              <FileText size={20} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-300">
                <p className="font-semibold mb-1">📤 Cloud File Storage Enabled</p>
                <p>Files uploaded here are stored in Supabase Cloud Storage. All authenticated users can download files from anywhere, anytime. Files are permanently accessible even after browser restart.</p>
              </div>
            </div>
            
            {/* File Notification */}
            {fileNotification && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-4 p-4 rounded-xl flex items-center gap-3 ${
                  fileNotification.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {fileNotification.type === 'success' ? <CheckCircle size={20} /> : <Bell size={20} />}
                {fileNotification.message}
              </motion.div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>FILE TITLE</label>
                <select
                  value={newFile.title}
                  onChange={(e) => setNewFile({ ...newFile, title: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${inputBgClass}`}
                >
                  <option value="">Select Document Type</option>
                  <option value="Petition">Petition</option>
                  <option value="Case Proceedings">Case Proceedings</option>
                  <option value="Praecipe">Praecipe</option>
                  <option value="Acknowledgments">Acknowledgments</option>
                  <option value="Service">Service</option>
                  <option value="Intimation Notice">Intimation Notice</option>
                  <option value="Communications">Communications</option>
                  <option value="Court Orders">Court Orders</option>
                  <option value="Affidavit">Affidavit</option>
                  <option value="Written Statement">Written Statement</option>
                  <option value="Evidence">Evidence</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>FILE</label>
                <input
                  type="file"
                  onChange={handleFileInputChange}
                  className={`w-full px-4 py-2 rounded-lg border ${inputBgClass}`}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                />
                {selectedFile && (
                  <p className="text-xs text-green-400 mt-1">Selected: {selectedFile.name}</p>
                )}
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>URL</label>
                <input
                  type="text"
                  placeholder="External Link (Optional)"
                  value={newFile.url}
                  onChange={(e) => setNewFile({ ...newFile, url: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${inputBgClass}`}
                />
              </div>
            </div>
            <div className="flex justify-end mb-6">
              <button 
                onClick={handleAddFile} 
                disabled={isFileLoading}
                className="bg-gradient-cyber text-white px-6 py-2 rounded-lg font-semibold font-cyber hover:shadow-cyber transition-all border border-cyber-blue/30 flex items-center gap-2 disabled:opacity-50"
              >
                {isFileLoading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    ATTACHING...
                  </>
                ) : (
                  'ATTACH'
                )}
              </button>
            </div>

            {/* Files Table */}
            <table className="w-full">
              <thead>
                <tr className={`border-b ${borderClass}`}>
                  <th className={`text-left py-3 px-4 ${labelClass}`}>SR</th>
                  <th className={`text-left py-3 px-4 ${labelClass}`}>ATTACHMENT TITLE</th>
                  <th className={`text-left py-3 px-4 ${labelClass}`}>DATE ATTACHED</th>
                  <th className={`text-left py-3 px-4 ${labelClass}`}>ATTACHED BY</th>
                  <th className={`text-left py-3 px-4 ${labelClass}`}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {files.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">0 Attachments Found</td></tr>
                ) : (
                  files.map((file, index) => (
                    <tr key={file.id} className={`border-b ${borderClass}`}>
                      <td className="py-3 px-4">{index + 1}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleDownloadFile(file)}
                          className="text-blue-400 hover:text-blue-300 underline hover:no-underline transition-all cursor-pointer font-medium text-left"
                          title="Click to download file"
                        >
                          {file.title}
                        </button>
                      </td>
                      <td className="py-3 px-4">{formatIndianDate(file.dateAttached)}</td>
                      <td className="py-3 px-4">{file.attachedBy}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleDownloadFile(file)}
                            className="text-green-400 hover:text-green-300 p-2 rounded-lg hover:bg-green-500/20 transition-all flex items-center gap-1"
                            title="Download File"
                          >
                            <Download size={18} />
                          </button>
                          <button 
                            onClick={() => handleDownloadFile(file)}
                            className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-blue-500/20 transition-all"
                            title="Open in New Tab"
                          >
                            <ExternalLink size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteFile(file.id)} 
                            className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/20 transition-all"
                            title="Delete File"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Interim Relief Tab */}
        {activeTab === 'interim' && (
          <div className={`${bgClass} p-6 rounded-xl border ${borderClass}`}>
            {/* Interim Relief Notification */}
            {interimNotification && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mb-4 p-4 rounded-xl flex items-center gap-3 ${
                  interimNotification.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {interimNotification.type === 'success' ? <CheckCircle size={20} /> : <Bell size={20} />}
                {interimNotification.message}
              </motion.div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>INTERIM RELIEF</label>
                <select
                  value={interimRelief}
                  onChange={(e) => setInterimRelief(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border ${inputBgClass}`}
                >
                  <option value="none">None</option>
                  <option value="favor">Favor</option>
                  <option value="against">Against</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>DATE</label>
                <input
                  type="date"
                  value={interimDate}
                  onChange={(e) => setInterimDate(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border ${inputBgClass}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>GRANTED DATE</label>
                <input
                  type="date"
                  value={grantedDate}
                  onChange={(e) => setGrantedDate(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border ${inputBgClass}`}
                />
              </div>
              <button 
                onClick={handleUpdateInterimRelief}
                disabled={isInterimLoading}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  isInterimLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 hover:shadow-lg hover:shadow-orange-500/30'
                } text-white border border-orange-500/30`}
              >
                <Shield size={18} />
                {isInterimLoading ? 'UPDATING...' : 'UPDATE INTERIM RELIEF'}
              </button>
            </div>
          </div>
        )}

        {/* Circulation Tab */}
        {activeTab === 'circulation' && (
          <div className={`${bgClass} p-6 rounded-xl border ${borderClass}`}>
            {/* Circulation Notification */}
            {circulationNotification && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mb-4 p-4 rounded-xl flex items-center gap-3 ${
                  circulationNotification.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {circulationNotification.type === 'success' ? <CheckCircle size={20} /> : <Bell size={20} />}
                {circulationNotification.message}
              </motion.div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>CIRCULATION STATUS</label>
                <select
                  value={circulationStatus}
                  onChange={(e) => setCirculationStatus(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border ${inputBgClass}`}
                >
                  <option value="non-circulated">Non Circulated</option>
                  <option value="circulated">Circulated</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>CIRCULATION DATE</label>
                <input
                  type="date"
                  value={circulationDate}
                  onChange={(e) => setCirculationDate(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border ${inputBgClass}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>GRANT DATE</label>
                <input
                  type="date"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border ${inputBgClass}`}
                />
              </div>
              <button 
                onClick={handleUpdateCirculation}
                disabled={isCirculationLoading}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  isCirculationLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 hover:shadow-lg hover:shadow-orange-500/30'
                } text-white border border-orange-500/30`}
              >
                <RefreshCw size={18} />
                {isCirculationLoading ? 'UPDATING...' : 'UPDATE CIRCULATION STATUS'}
              </button>
            </div>
          </div>
        )}

        {/* Case Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className={`${bgClass} p-6 rounded-xl border ${borderClass}`}>
            {/* Task Notification */}
            {assignmentNotification && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mb-4 p-4 rounded-xl flex items-center gap-3 ${
                  assignmentNotification.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {assignmentNotification.type === 'success' ? <CheckCircle size={20} /> : <Bell size={20} />}
                {assignmentNotification.message}
              </motion.div>
            )}
            
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckSquare className="text-orange-500" size={24} />
              Assign Task
              {isAdmin && <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full ml-2">Admin Mode</span>}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>TASK TITLE</label>
                <input
                  type="text"
                  placeholder="Ex - Prepare Draft"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${inputBgClass}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>FOR USER</label>
                <select
                  value={newTask.user}
                  onChange={(e) => setNewTask({ ...newTask, user: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${inputBgClass}`}
                >
                  <option value="">Select User</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>DEADLINE</label>
                <input
                  type="date"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${inputBgClass}`}
                />
              </div>
            </div>
            <div className="mb-6">
              <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>TASK DETAILS</label>
              <RichTextEditor
                label=""
                value={newTask.details}
                onChange={(value) => setNewTask({ ...newTask, details: value })}
              />
            </div>
            <div className="flex justify-end gap-3">
              <p className={`text-sm ${labelClass} flex items-center gap-2`}>
                <Bell size={16} className="text-amber-500" />
                User will receive a notification when task is assigned
              </p>
              <button onClick={handleAddTask} className="bg-gradient-cyber text-white px-6 py-3 rounded-lg font-semibold font-cyber hover:shadow-cyber transition-all border border-cyber-blue/30 flex items-center gap-2">
                <CheckSquare size={18} />
                CREATE TASK
              </button>
            </div>

            {/* Tasks List */}
            {tasks.length > 0 && (
              <div className="mt-6 space-y-4">
                <h4 className={`font-semibold ${labelClass} mb-3`}>Assigned Tasks ({tasks.length})</h4>
                {tasks.map((task: any) => (
                  <motion.div 
                    key={task.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl ${theme === 'light' ? 'bg-gray-100 border border-gray-200' : 'bg-white/5 border border-white/10'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{task.title}</h4>
                          {task.completed ? (
                            <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">Completed</span>
                          ) : (
                            <span className="text-xs bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full">Pending</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p className={labelClass}>
                            <span className="font-medium">Assigned to:</span> {task.user}
                          </p>
                          <p className={labelClass}>
                            <span className="font-medium">Deadline:</span> {formatIndianDate(task.deadline)}
                          </p>
                          {task.assignedBy && (
                            <p className={labelClass}>
                              <span className="font-medium">Assigned by:</span> {task.assignedBy}
                              {task.assignedByRole === 'admin' && (
                                <span className="ml-1 text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded">Admin</span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => setTasks(tasks.filter(t => t.id !== task.id))} 
                        className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/20 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Case Timeline Tab */}
        {activeTab === 'timeline' && (
          <div className={`${bgClass} p-6 rounded-xl border ${borderClass}`}>
            {/* Add New Timeline Event Form */}
            <div className="mb-6 p-4 rounded-xl border border-dashed border-cyan-500/30 bg-cyan-500/5">
              <h4 className={`font-semibold mb-4 ${theme === 'light' ? 'text-cyan-600' : 'text-cyan-400'}`}>Add New Timeline Event</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>EVENT TITLE *</label>
                  <input
                    type="text"
                    placeholder="Ex - Case Status Updated"
                    value={newTimelineEvent.title}
                    onChange={(e) => setNewTimelineEvent({ ...newTimelineEvent, title: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg border ${inputBgClass}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>DESCRIPTION</label>
                  <input
                    type="text"
                    placeholder="Additional details..."
                    value={newTimelineEvent.description}
                    onChange={(e) => setNewTimelineEvent({ ...newTimelineEvent, description: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg border ${inputBgClass}`}
                  />
                </div>
              </div>
              <button 
                onClick={handleAddTimelineEvent} 
                disabled={!newTimelineEvent.title || isTimelineLoading}
                className={`px-6 py-2 rounded-lg font-semibold font-cyber transition-all border ${
                  newTimelineEvent.title && !isTimelineLoading
                    ? 'bg-gradient-cyber text-white hover:shadow-cyber border-cyber-blue/30' 
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed border-gray-400'
                }`}
              >
                {isTimelineLoading ? 'ADDING...' : 'ADD EVENT'}
              </button>
            </div>

            {/* Edit Timeline Event Modal */}
            {editingTimelineEvent && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 p-4 rounded-xl border ${theme === 'light' ? 'border-amber-300 bg-amber-50' : 'border-amber-500/30 bg-amber-500/10'}`}
              >
                <h4 className={`font-semibold mb-4 ${theme === 'light' ? 'text-amber-600' : 'text-amber-400'}`}>Edit Timeline Event</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>EVENT TITLE *</label>
                    <input
                      type="text"
                      value={editingTimelineEvent.title}
                      onChange={(e) => setEditingTimelineEvent({ ...editingTimelineEvent, title: e.target.value })}
                      className={`w-full px-4 py-3 rounded-lg border ${inputBgClass}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${labelClass}`}>DESCRIPTION</label>
                    <input
                      type="text"
                      value={editingTimelineEvent.description}
                      onChange={(e) => setEditingTimelineEvent({ ...editingTimelineEvent, description: e.target.value })}
                      className={`w-full px-4 py-3 rounded-lg border ${inputBgClass}`}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleSaveTimelineEvent}
                    className="px-6 py-2 rounded-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg transition-all"
                  >
                    SAVE CHANGES
                  </button>
                  <button 
                    onClick={() => setEditingTimelineEvent(null)}
                    className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                      theme === 'light' 
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    CANCEL
                  </button>
                </div>
              </motion.div>
            )}

            {/* Timeline */}
            <div className="relative">
              <div className={`absolute left-4 top-0 bottom-0 w-0.5 ${theme === 'light' ? 'bg-gray-300' : 'bg-white/20'}`}></div>
              <div className="space-y-6">
                {timeline.map((event) => (
                  <motion.div 
                    key={event.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-start gap-4 ml-2 p-3 rounded-lg transition-all ${
                      theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-cyan-500 border-4 ${theme === 'light' ? 'border-white' : 'border-gray-900'} z-10 flex-shrink-0 mt-1`}></div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${theme === 'light' ? 'text-cyan-600' : 'text-cyan-400'}`}>{event.title}</p>
                      {event.description && (
                        <p className={`${labelClass} mt-1 text-sm`}>{event.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`font-cyber text-sm ${theme === 'light' ? 'text-orange-600' : 'text-orange-500'}`}>
                        {formatIndianDate(event.date)}
                      </span>
                      <button
                        onClick={() => handleEditTimelineEvent(event)}
                        className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
                        title="Edit Event"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTimelineEvent(event.id)}
                        className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                        title="Delete Event"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {timeline.length === 0 && (
              <div className={`text-center py-8 ${labelClass}`}>
                <Clock size={48} className="mx-auto mb-4 opacity-30" />
                <p>No timeline events yet</p>
                <p className="text-sm mt-2">Add your first event above</p>
              </div>
            )}
          </div>
        )}

        {/* Cause List Tab */}
        {activeTab === 'cause' && (
          <div className="space-y-6">
            {/* Add Entry Form */}
            <div className={`rounded-2xl border p-6 ${theme === 'light' ? 'bg-white border-gray-200' : 'glass-dark border-white/10'}`}>
              <h3 className={`font-semibold text-base mb-5 flex items-center gap-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                <BookOpen size={18} className="text-orange-500" />
                Record Hearing Outcome
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Hearing Date *</label>
                  <input
                    type="date"
                    value={newCauseDate}
                    onChange={e => setNewCauseDate(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors ${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900 focus:border-orange-500' : 'bg-white/5 border-white/10 text-white focus:border-orange-500/50'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Outcome / Order *</label>
                  <input
                    type="text"
                    value={newCauseOutcome}
                    onChange={e => setNewCauseOutcome(e.target.value)}
                    placeholder="e.g. Adjourned, Order passed, Part heard..."
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors ${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900 focus:border-orange-500' : 'bg-white/5 border-white/10 text-white focus:border-orange-500/50'}`}
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className={`block text-xs font-medium mb-1.5 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Detailed Notes / Diary Entry</label>
                <textarea
                  value={newCauseNotes}
                  onChange={e => setNewCauseNotes(e.target.value)}
                  rows={4}
                  placeholder="What happened in court today — arguments made, judge remarks, orders passed, next steps..."
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none transition-colors ${theme === 'light' ? 'bg-gray-50 border-gray-200 text-gray-900 focus:border-orange-500 placeholder-gray-400' : 'bg-white/5 border-white/10 text-white focus:border-orange-500/50 placeholder-gray-500'}`}
                />
              </div>
              <button
                disabled={savingCause}
                onClick={async () => {
                  if (!newCauseDate || !newCauseOutcome.trim()) {
                    alert('Please fill Hearing Date and Outcome.');
                    return;
                  }
                  setSavingCause(true);
                  try {
                    const { error } = await supabase.from('case_cause_list').insert([{
                      case_id: id,
                      tenant_id: user?.tenant_id || localStorage.getItem('tenant_id'),
                      hearing_date: newCauseDate,
                      outcome: newCauseOutcome.trim(),
                      notes: newCauseNotes.trim(),
                      created_by_name: user?.name || user?.username || 'Admin',
                    }]);
                    if (error) throw error;
                    setNewCauseOutcome('');
                    setNewCauseNotes('');
                    setNewCauseDate(new Date().toISOString().split('T')[0]);
                    // Refresh list
                    setCauseLoading(true);
                    const { data } = await supabase
                      .from('case_cause_list')
                      .select('*')
                      .eq('case_id', id)
                      .order('hearing_date', { ascending: false });
                    if (data) setCauseEntries(data as CauseEntry[]);
                    setCauseLoading(false);
                  } catch (err) {
                    console.error('Save error:', err);
                    alert('Failed to save. Try again.');
                  } finally {
                    setSavingCause(false);
                  }
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {savingCause ? 'Saving...' : '+ Save Entry'}
              </button>
            </div>

            {/* History list */}
            <div className={`rounded-2xl border overflow-hidden ${theme === 'light' ? 'bg-white border-gray-200' : 'glass-dark border-white/10'}`}>
              <div className={`px-6 py-4 border-b ${theme === 'light' ? 'border-gray-100' : 'border-white/10'}`}>
                <h3 className={`font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  Hearing History
                  <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded-full ${theme === 'light' ? 'bg-gray-100 text-gray-500' : 'bg-white/10 text-gray-400'}`}>
                    {causeEntries.length} entries
                  </span>
                </h3>
              </div>
              {causeLoading ? (
                <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
              ) : causeEntries.length === 0 ? (
                <div className="p-10 text-center">
                  <BookOpen size={32} className="mx-auto mb-3 text-gray-500 opacity-40" />
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                    No entries yet. Record your first hearing outcome above.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                  {causeEntries.map((entry, idx) => (
                    <div key={entry.id} className={`p-5 transition-colors ${theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-white/3'}`}>
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-orange-500/10 text-orange-500 border border-orange-500/20">
                            {new Date(entry.hearing_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                            {entry.outcome}
                          </span>
                        </div>
                        <span className={`text-xs shrink-0 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>
                          #{causeEntries.length - idx}
                        </span>
                      </div>
                      {entry.notes && (
                        <p className={`text-sm mt-2 leading-relaxed whitespace-pre-wrap ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                          {entry.notes}
                        </p>
                      )}
                      <p className={`text-xs mt-3 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>
                        Recorded by {entry.created_by_name} · {new Date(entry.created_at).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${bgClass} p-6 rounded-xl border ${borderClass}`}
          >
            {/* Payment Notification */}
            {paymentNotification && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 p-4 rounded-lg border ${
                  paymentNotification.type === 'success'
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                {paymentNotification.message}
              </motion.div>
            )}

            {/* Download Receipt Button */}
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                Payment Management
              </h2>
              <GatedFeature requiredPlan="pro" featureName="receipt downloads">
                <button
                  onClick={handleDownloadReceipt}
                  disabled={payments.filter(p => p.is_accepted).length === 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                    payments.filter(p => p.is_accepted).length === 0
                      ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                      : 'bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg'
                  }`}
                  title={payments.filter(p => p.is_accepted).length === 0 ? 'No payments recorded yet' : 'Download PDF Receipt'}
                >
                  <Download size={18} />
                  Download Receipt
                </button>
              </GatedFeature>
            </div>

            {/* Receive Payment Form */}
            <div className={`p-6 rounded-xl border ${borderClass} mb-6`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${theme === 'light' ? 'text-gray-900' : 'text-cyan-400'}`}>
                <CreditCard size={20} />
                Receive Payment
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    AMOUNT <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                    placeholder="Amount"
                    className={`w-full px-4 py-2 rounded-lg border ${inputBgClass} focus:outline-none focus:ring-2 focus:ring-orange-500`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    DATE <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newPayment.date}
                    onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${inputBgClass} focus:outline-none focus:ring-2 focus:ring-orange-500`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    REFERENCE ID
                  </label>
                  <input
                    type="text"
                    value={newPayment.referenceId}
                    onChange={(e) => setNewPayment({ ...newPayment, referenceId: e.target.value })}
                    placeholder="Transaction/Reference ID"
                    className={`w-full px-4 py-2 rounded-lg border ${inputBgClass} focus:outline-none focus:ring-2 focus:ring-orange-500`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    TDS AMOUNT
                  </label>
                  <input
                    type="number"
                    value={newPayment.tdsAmount}
                    onChange={(e) => setNewPayment({ ...newPayment, tdsAmount: e.target.value })}
                    placeholder="TDS Amount (if any)"
                    className={`w-full px-4 py-2 rounded-lg border ${inputBgClass} focus:outline-none focus:ring-2 focus:ring-orange-500`}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${labelClass}`}>
                    PAYMENT MODE <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newPayment.paymentMode}
                    onChange={(e) => setNewPayment({ ...newPayment, paymentMode: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${inputBgClass} focus:outline-none focus:ring-2 focus:ring-orange-500`}
                  >
                    <option value="">Select Mode</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Online Transfer">Online Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
              </div>
              
              {!isAdmin && (
                <div className={`p-3 rounded-lg border mb-4 ${theme === 'light' ? 'bg-yellow-50 border-yellow-200' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                  <p className={`text-sm ${theme === 'light' ? 'text-yellow-700' : 'text-yellow-400'}`}>
                    ⚠️ Fees must be accepted by admin before it's added to the client's account
                  </p>
                </div>
              )}
              
              <button
                onClick={handleAddPayment}
                disabled={isPaymentLoading}
                className="w-full bg-green-500 text-white font-semibold py-3 rounded-lg hover:bg-green-600 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {isPaymentLoading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    RECEIVE PAYMENT
                  </>
                )}
              </button>
            </div>

            {/* Payment Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className={`p-4 rounded-lg border ${borderClass}`}>
                <p className={`text-sm ${labelClass} mb-1`}>Fees Quoted</p>
                <p className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  ₹{(caseData?.feesQuoted || 0).toLocaleString('en-IN')}
                </p>
              </div>
              
              <div className={`p-4 rounded-lg border ${borderClass}`}>
                <p className={`text-sm ${labelClass} mb-1`}>Fees Paid</p>
                <p className={`text-2xl font-bold text-green-500`}>
                  ₹{payments.filter(p => p.is_accepted).reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Payment History */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                Payment History
              </h3>
              
              {payments.length === 0 ? (
                <div className={`text-center py-8 ${labelClass}`}>
                  <CreditCard size={48} className="mx-auto mb-4 opacity-30" />
                  <p>No payments recorded yet</p>
                  <p className="text-sm mt-2">Add your first payment above</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <motion.div
                      key={payment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 rounded-lg border ${borderClass} ${
                        payment.is_accepted 
                          ? theme === 'light' ? 'bg-green-50' : 'bg-green-500/10'
                          : theme === 'light' ? 'bg-yellow-50' : 'bg-yellow-500/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                              ₹{payment.amount.toLocaleString('en-IN')}
                            </p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              payment.is_accepted
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            }`}>
                              {payment.is_accepted ? '✓ Accepted' : '⏳ Pending'}
                            </span>
                          </div>
                          <div className={`text-sm ${labelClass} space-y-1`}>
                            <p>Date: {formatIndianDate(payment.date)}</p>
                            <p>Mode: {payment.payment_mode}</p>
                            {payment.reference_id && <p>Ref: {payment.reference_id}</p>}
                            {payment.tds > 0 && <p>TDS: ₹{payment.tds.toLocaleString('en-IN')}</p>}
                            <p>Received by: {payment.received_by}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 text-center"
      >
        <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
          Designed and Developed by <span className="text-cyan-400">sawantrishi152@gmail.com</span> © 2025
        </p>
      </motion.div>

      {/* Floating Save Bar - Appears when there are unsaved changes */}
      {hasBasicDetailsChanged && activeTab === 'basic' && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-r from-amber-600 to-orange-600 shadow-2xl border-t-2 border-amber-400"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <Bell size={24} className="animate-bounce" />
              <div>
                <p className="font-bold text-lg">Unsaved Changes Detected!</p>
                <p className="text-sm opacity-90">Click Save to update case stage and reflect on dashboard</p>
              </div>
            </div>
            <button
              onClick={handleSaveBasicDetails}
              disabled={isBasicDetailsLoading}
              className="px-8 py-3 bg-white text-orange-600 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 flex items-center gap-2 shadow-lg"
            >
              {isBasicDetailsLoading ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  SAVE NOW
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </MainLayout>
  );
};

export default CaseDetailsPage;
