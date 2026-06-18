# Requirements Document

## Introduction

This document specifies the requirements for Katneshwarkar Firm Management V2.1, a secure, role-based legal case management application built with React/TypeScript and Supabase. The system provides comprehensive case management, library resource tracking, physical file storage management, and appointment scheduling with strict role-based access control.

## Glossary

- **Admin**: A user role with full CRUD permissions on all data tables including cases, library resources, and storage files
- **User**: A standard user role with limited visibility restricted to cases they created or were assigned
- **Vipin**: A special user role with INSERT permissions for Library and Storage modules alongside Admin
- **RLS**: Row Level Security - Supabase's mechanism for enforcing data access policies at the database level
- **CRUD**: Create, Read, Update, Delete - the four basic operations on data
- **Office Cases**: The primary module for managing legal matters and case records
- **Library**: Module for tracking book resources with location and reference numbers
- **Storage**: Module for tracking physical file locations in the firm's storage system
- **Supabase**: The backend-as-a-service platform providing authentication, database, and edge functions
- **Edge Function**: Serverless function running on Supabase for handling Dropbox file storage integration

## Requirements

### Requirement 1: Simple Username/Password Authentication

**User Story:** As a firm user, I want to login with a simple username and password, so that I can access the system without external authentication providers.

#### Acceptance Criteria

1. WHEN a user accesses the application, THE Authentication_System SHALL display a simple login form with username and password fields.
2. WHEN a user submits login credentials, THE Authentication_System SHALL validate the username and password against stored user records in the database.
3. WHEN valid credentials are provided, THE Authentication_System SHALL authenticate the user and retrieve their assigned role from the profiles table.
4. IF invalid credentials are provided, THEN THE Authentication_System SHALL display an error message and prevent access.
5. WHEN any login attempt occurs, THE Authentication_System SHALL NOT use external authentication providers including Gmail or social logins.

### Requirement 2: Case Creation with Optional Fields

**User Story:** As a legal professional, I want to quickly create new case records with minimal required information, so that I can capture matters efficiently without being blocked by mandatory fields.

#### Acceptance Criteria

1. WHEN a user accesses the Create Case form, THE Case_Management_System SHALL display all input fields including Case Title and Client Name as optional (accepting NULL values).
2. WHEN a user submits a case creation form, THE Case_Management_System SHALL require only the "Assign Task To" field as mandatory before allowing submission.
3. WHEN an Admin user creates a case, THE Case_Management_System SHALL populate the "Assign Task To" dropdown with all defined users from the system.
4. WHEN a standard User creates a case, THE Case_Management_System SHALL restrict the "Assign Task To" dropdown to only include that user's own account.
5. WHEN a case is successfully created, THE Case_Management_System SHALL persist the record to the database with the assigned user relationship established.

### Requirement 3: Counsel Integration

**User Story:** As a legal professional, I want to indicate whether external counsel is required for a case and capture their name, so that counsel involvement is tracked without complex multi-field entry.

#### Acceptance Criteria

1. WHEN a user views the case creation or edit form, THE Case_Management_System SHALL display a single "Counsel Required" dropdown with Yes/No options.
2. WHEN a user selects "Yes" for Counsel Required, THE Case_Management_System SHALL conditionally display a text input field for Counsel Name.
3. WHEN a user selects "No" for Counsel Required, THE Case_Management_System SHALL hide the Counsel Name field and clear any previously entered value.
4. WHEN a case with counsel information is saved, THE Case_Management_System SHALL persist both the counsel_required flag and counsel_name to the database.

### Requirement 4: Library Resource Management

**User Story:** As a firm member, I want to search and browse the library catalog, so that I can locate legal resources efficiently.

#### Acceptance Criteria

1. WHEN any authenticated user accesses the Library module, THE Library_System SHALL display the catalog with Book Name, Location (location_slot), and Book No. (book_number) columns.
2. WHEN a user with Admin or Vipin role attempts to add a new library resource, THE Library_System SHALL permit the INSERT operation and save the record.
3. IF a user without Admin or Vipin role attempts to add a library resource, THEN THE Library_System SHALL deny the INSERT operation and display an appropriate permission error.
4. WHEN any authenticated user performs a search in the Library module, THE Library_System SHALL filter results based on matching keywords across Book Name, Location, and Book No. fields.

### Requirement 5: Physical Storage Management

**User Story:** As a firm member, I want to track physical file locations in storage, so that I can quickly locate case documents when needed.

#### Acceptance Criteria

1. WHEN any authenticated user accesses the Storage module, THE Storage_System SHALL display records with File No., Party Name, Location (storage_location), and Matter No. columns.
2. WHEN a user with Admin or Vipin role submits the storage entry form, THE Storage_System SHALL validate that File No., Party Name, and Location are provided before allowing submission.
3. WHEN a user with Admin or Vipin role submits the storage entry form, THE Storage_System SHALL accept Matter No. as an optional field.
4. IF a user without Admin or Vipin role attempts to add a storage record, THEN THE Storage_System SHALL deny the INSERT operation and display an appropriate permission error.
5. WHEN any authenticated user performs a search in the Storage module, THE Storage_System SHALL filter results based on matching keywords across File No., Party Name, Location, and Matter No. fields.

### Requirement 6: Universal Free Search

**User Story:** As a firm member, I want a single search bar to filter data in any active module, so that I can quickly find relevant records without navigating complex filter interfaces.

#### Acceptance Criteria

1. WHEN a user views any data module (Office Cases, Library, or Storage), THE Search_System SHALL display a prominent Free Search bar at the top of the data view.
2. WHEN a user enters search terms in the Free Search bar, THE Search_System SHALL filter the visible data in the active module based on matching keywords, names, or reference numbers.
3. WHEN search results are displayed, THE Search_System SHALL update the data view in real-time as the user types without requiring form submission.
4. WHEN the search field is cleared, THE Search_System SHALL restore the full unfiltered data view for the active module.

### Requirement 7: Appointment Scheduling

**User Story:** As a legal professional, I want to schedule and manage appointments with flexible date and time entry, so that I can maintain an organized calendar of meetings and court dates.

#### Acceptance Criteria

1. WHEN a user accesses the Appointment Scheduler module, THE Appointment_System SHALL display a calendar-based interface with existing appointments visible.
2. WHEN a user creates or edits an appointment, THE Appointment_System SHALL provide easily editable date and time input fields.
3. WHEN an appointment is saved, THE Appointment_System SHALL persist the record with date, time, and associated details to the database.
4. WHEN a user views the appointment list, THE Appointment_System SHALL display appointments in chronological order with relevant case or client associations.

### Requirement 8: Admin User Management

**User Story:** As an administrator, I want to create, edit, and delete user accounts with assigned roles, so that I can manage firm access and permissions centrally.

#### Acceptance Criteria

1. WHEN an Admin user accesses the User Management section, THE User_Management_System SHALL display a list of all users with their username, role, and status.
2. WHEN an Admin user creates a new user, THE User_Management_System SHALL require username, password, and role selection (Admin, User, or Vipin).
3. WHEN an Admin user creates a new user, THE User_Management_System SHALL validate that the username is unique and the password meets minimum requirements.
4. WHEN an Admin user edits an existing user, THE User_Management_System SHALL allow modification of username, password, and role assignment.
5. WHEN an Admin user deletes a user, THE User_Management_System SHALL remove the user account and prevent future logins with those credentials.
6. WHEN an Admin user promotes another user to Admin role, THE User_Management_System SHALL grant that user full CRUD permissions on all data including user management.

### Requirement 9: Admin Case Visibility

**User Story:** As an administrator, I want to view all cases across the firm regardless of assignment, so that I can maintain oversight and manage workload distribution.

#### Acceptance Criteria

1. WHEN an Admin user accesses the Office Cases module, THE Case_Management_System SHALL display all cases in the system regardless of creator or assignee.
2. WHEN an Admin user views case details, THE Case_Management_System SHALL show the assigned user and creator information for audit purposes.
3. WHEN an Admin user edits a case, THE Case_Management_System SHALL permit reassignment to any user in the system.
