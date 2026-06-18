# Requirements Document

## Introduction

This document outlines the requirements for implementing Supabase Storage integration for case file uploads in the Legal Case Management Dashboard. Currently, files uploaded by one user create local blob URLs that are not accessible to other users remotely. This feature will enable true remote file sharing where any authenticated user can upload files and all users can download them from a centralized cloud storage.

## Glossary

- **Supabase Storage**: Cloud storage service provided by Supabase for storing and serving files
- **Storage Bucket**: A container in Supabase Storage that holds files with specific access policies
- **Public URL**: A permanent, shareable URL that points to a file in Supabase Storage
- **RLS (Row Level Security)**: Security policies that control who can access files based on authentication
- **Case File**: A document or file attached to a specific legal case
- **Blob URL**: A temporary local browser URL (blob:) that only works in the same browser session

## Requirements

### Requirement 1

**User Story:** As a user, I want to upload files to case records, so that all team members can access and download these files from any location.

#### Acceptance Criteria

1. WHEN a user uploads a file THEN the system SHALL store the file in Supabase Storage and generate a permanent public URL
2. WHEN a file is uploaded THEN the system SHALL save the file metadata (name, size, type, URL) to the case_files database table
3. WHEN a file upload completes THEN the system SHALL display a success notification with the file name
4. WHEN a file upload fails THEN the system SHALL display an error message with the reason for failure
5. WHEN uploading a file THEN the system SHALL show a loading indicator until the upload completes

### Requirement 2

**User Story:** As a user, I want to download files attached to cases, so that I can view and work with case documents regardless of who uploaded them.

#### Acceptance Criteria

1. WHEN a user clicks on a file download button THEN the system SHALL retrieve the file from Supabase Storage using the stored URL
2. WHEN a file is available THEN the system SHALL open the file in a new browser tab or trigger a download
3. WHEN a file URL is invalid or expired THEN the system SHALL display an error message indicating the file is unavailable
4. WHEN displaying files THEN the system SHALL show all files uploaded by any user with proper metadata (title, date, uploader name)

### Requirement 3

**User Story:** As a user, I want to delete files from case records, so that I can remove outdated or incorrect documents.

#### Acceptance Criteria

1. WHEN a user deletes a file THEN the system SHALL remove the file from both Supabase Storage and the database
2. WHEN a file deletion succeeds THEN the system SHALL display a success notification and update the file list
3. WHEN a file deletion fails THEN the system SHALL display an error message and keep the file in the list
4. WHEN deleting a file THEN the system SHALL require confirmation to prevent accidental deletions

### Requirement 4

**User Story:** As a system administrator, I want files to be stored securely with proper access control, so that only authenticated users can access case files.

#### Acceptance Criteria

1. WHEN creating the storage bucket THEN the system SHALL configure RLS policies to allow authenticated users to upload files
2. WHEN accessing files THEN the system SHALL allow authenticated users to read all files in the bucket
3. WHEN a user is not authenticated THEN the system SHALL prevent file uploads and downloads
4. WHEN configuring storage THEN the system SHALL set appropriate file size limits and allowed file types

### Requirement 5

**User Story:** As a user, I want to optionally provide external links (Dropbox/Google Drive) for files, so that I can reference files stored in other cloud services.

#### Acceptance Criteria

1. WHEN attaching a file THEN the system SHALL allow the user to provide either a local file upload OR an external URL
2. WHEN an external URL is provided THEN the system SHALL store the URL in the database without uploading to Supabase Storage
3. WHEN downloading a file with an external URL THEN the system SHALL open the external URL in a new tab
4. WHEN both a file and external URL are provided THEN the system SHALL prioritize the external URL for downloads
5. WHEN displaying files THEN the system SHALL indicate whether a file is stored locally or externally
