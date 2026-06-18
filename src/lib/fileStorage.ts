import { supabase } from './supabase';

const BUCKET_NAME = 'case-files';

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Storage bucket is created and configured via STORAGE_SETUP.sql
 * (run once in Supabase). The browser uses the anon key, which cannot
 * create buckets, so we no longer attempt that here — we just upload.
 */
export const initializeStorage = async () => {
  return { success: true };
};

/**
 * Upload a file to Supabase Storage
 * @param file - The file to upload
 * @param caseId - The case ID to organize files
 * @param fileName - Optional custom file name
 * @returns Upload result with public URL
 */
export const uploadFile = async (
  file: File,
  caseId: string,
  fileName?: string
): Promise<UploadResult> => {
  try {
    // Generate unique file name, organised under the tenant's folder
    const timestamp = Date.now();
    const sanitizedFileName = fileName || file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const tenantId = localStorage.getItem('tenant_id') || 'shared';
    const filePath = `${tenantId}/${caseId}/${timestamp}_${sanitizedFileName}`;

    console.log('📤 Uploading file:', filePath);

    // Upload file to Supabase Storage
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);
    
    console.log('✅ File uploaded successfully:', urlData.publicUrl);
    
    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath
    };
  } catch (err: any) {
    console.error('❌ Upload exception:', err);
    return {
      success: false,
      error: err.message || 'Unknown error occurred'
    };
  }
};

/**
 * Delete a file from Supabase Storage
 * @param filePath - The path of the file to delete
 * @returns Delete result
 */
export const deleteFile = async (filePath: string): Promise<DeleteResult> => {
  try {
    console.log('🗑️ Deleting file:', filePath);
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);
    
    if (error) {
      console.error('❌ Delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }
    
    console.log('✅ File deleted successfully');
    return { success: true };
  } catch (err: any) {
    console.error('❌ Delete exception:', err);
    return {
      success: false,
      error: err.message || 'Unknown error occurred'
    };
  }
};

/**
 * Get the download URL for a file
 * @param filePath - The path of the file
 * @returns Public URL
 */
export const getFileUrl = (filePath: string): string => {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
};

/**
 * Download a file (opens in new tab or triggers download)
 * @param url - The public URL of the file
 * @param fileName - Optional file name for download
 */
export const downloadFile = (url: string, fileName?: string) => {
  try {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    if (fileName) {
      link.download = fileName;
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Error downloading file:', err);
    // Fallback: open in new tab
    window.open(url, '_blank');
  }
};
