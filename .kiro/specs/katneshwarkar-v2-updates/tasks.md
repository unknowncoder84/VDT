# Implementation Plan

- [ ] 1. Implement simple username/password authentication
- [x] 1.1 Create user_accounts table for authentication



  - Add username (unique), password_hash, role, is_active columns
  - Add created_at, created_by tracking fields
  - Implement password hashing (bcrypt or similar)



  - _Requirements: 1.1, 1.2, 8.2_

- [ ] 1.2 Remove Gmail/external authentication
  - Remove all external auth provider code from AuthContext
  - Remove social login buttons from LoginPage
  - Implement simple username/password login form
  - _Requirements: 1.5_

- [ ] 1.3 Implement login validation
  - Validate username and password against user_accounts table
  - Return appropriate error messages for invalid credentials
  - Set user session on successful login
  - _Requirements: 1.2, 1.3, 1.4_

- [ ] 1.4 Write property test for simple login authentication
  - **Property 1: Simple Login Authentication**
  - **Validates: Requirements 1.2, 1.3**

- [ ] 1.5 Write property test for invalid credentials rejection
  - **Property 2: Invalid Credentials Rejection**
  - **Validates: Requirements 1.4**

- [ ] 2. Implement Admin User Management
- [ ] 2.1 Create User Management UI in Admin section
  - Display list of all users with username, role, and status
  - Add "Create User" button (Admin only)
  - Add edit and delete actions for each user
  - _Requirements: 8.1_

- [ ] 2.2 Implement Create User functionality
  - Form with username, password, and role dropdown
  - Validate username uniqueness
  - Validate password requirements (minimum length, complexity)
  - Hash password before storing
  - _Requirements: 8.2, 8.3_

- [ ] 2.3 Implement Edit User functionality
  - Allow Admin to change username, password, and role
  - Validate changes before saving
  - Update user permissions immediately
  - _Requirements: 8.4_

- [ ] 2.4 Implement Delete User functionality
  - Confirm deletion with Admin
  - Remove user account from database
  - Prevent future logins with deleted credentials
  - _Requirements: 8.5_

- [ ] 2.5 Write property test for admin user creation
  - **Property 3: Admin User Creation**
  - **Validates: Requirements 8.2, 8.3**

- [ ] 2.6 Write property test for username uniqueness
  - **Property 4: Username Uniqueness**
  - **Validates: Requirements 8.3**

- [ ] 2.7 Write property test for admin role management
  - **Property 5: Admin Role Management**
  - **Validates: Requirements 8.4, 8.6**

- [ ] 2.8 Write property test for admin user deletion
  - **Property 6: Admin User Deletion**
  - **Validates: Requirements 8.5**

- [ ] 3. Update database schema and RLS policies
  - Add `vipin` role to profiles table role enum
  - Make case fields nullable (client_name, file_no, etc.)
  - Add counsel_required and counsel_name columns to cases table
  - Add assigned_to column to cases table
  - Create library_resources table with book_name, location_slot, book_number
  - Create storage_files table with file_no, party_name, storage_location, matter_no
  - Implement RLS policy for user case visibility (creator OR assigned)
  - Implement RLS policy for admin full case visibility
  - Implement RLS policy for library_resources INSERT (Admin/Vipin only)
  - Implement RLS policy for storage_files INSERT (Admin/Vipin only)
  - _Requirements: 2.1, 3.4, 4.2, 4.3, 5.2, 5.4, 9.1_

- [ ] 4. Update TypeScript types and interfaces
  - Add `vipin` to UserRole type in types/index.ts
  - Update Case interface with optional fields, assigned_to, counsel_required, counsel_name
  - Create LibraryBook interface with bookName, locationSlot, bookNumber
  - Create StorageFile interface with fileNo, partyName, storageLocation, matterNo
  - Update CaseFormData interface to reflect optional fields
  - _Requirements: 2.1, 3.4, 4.1, 5.1_

- [ ] 5. Update AuthContext for role-based permissions
- [ ] 5.1 Add canManageLibrary helper method
  - Implement helper that returns true for Admin or Vipin roles
  - _Requirements: 4.2, 5.2_

- [ ] 5.2 Implement getVisibleCases method
  - Filter cases based on user role (Admin sees all, User sees own/assigned)
  - _Requirements: 2.1, 9.1_

- [ ] 5.3 Write property test for user case visibility
  - **Property 7: User Case Visibility Restriction**
  - **Validates: Requirements 2.1**

- [ ] 5.4 Write property test for admin case visibility
  - **Property 8: Admin Full Case Visibility**
  - **Validates: Requirements 9.1**

- [ ] 6. Update CreateCaseForm component
- [ ] 6.1 Make all fields optional except assignedTo
  - Remove required attributes from all form inputs
  - Keep assignedTo as required field
  - Update form validation logic
  - _Requirements: 2.1, 2.2_

- [ ] 6.2 Implement counsel required dropdown with conditional field
  - Add "Counsel Required" dropdown (Yes/No)
  - Conditionally render "Counsel Name" text field when Yes is selected
  - Clear counsel name when No is selected
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 6.3 Implement role-based assignedTo dropdown
  - For Admin: populate with all users
  - For standard User: populate with only current user
  - _Requirements: 2.3, 2.4_

- [ ] 6.4 Write property test for optional fields case creation
  - **Property 9: Case Creation with Optional Fields**
  - **Validates: Requirements 2.1, 2.2**

- [ ] 6.5 Write property test for admin assignment dropdown
  - **Property 10: Admin Assignment Dropdown Contains All Users**
  - **Validates: Requirements 2.3**

- [ ] 6.6 Write property test for user assignment dropdown
  - **Property 11: User Assignment Dropdown Self-Only**
  - **Validates: Requirements 2.4**

- [ ] 6.7 Write property test for case creation round-trip
  - **Property 12: Case Creation Round-Trip**
  - **Validates: Requirements 2.5**

- [ ] 6.8 Write property test for counsel field visibility
  - **Property 13: Counsel Field Conditional Visibility**
  - **Validates: Requirements 3.2, 3.3**

- [ ] 6.9 Write property test for counsel data persistence
  - **Property 14: Counsel Data Persistence Round-Trip**
  - **Validates: Requirements 3.4**

- [ ] 7. Update CasesPage for role-based filtering
  - Use getVisibleCases method from AuthContext to filter displayed cases
  - Display assigned user information in case list
  - Update case detail view to show creator and assignee
  - _Requirements: 2.1, 9.1, 9.2_

- [ ] 8. Implement Library module updates
- [ ] 8.1 Update LibraryBooksPage component
  - Display columns: Book Name, Location (location_slot), Book No. (book_number)
  - Show "Add Book" button only for Admin/Vipin roles
  - Implement add/edit form with required fields
  - _Requirements: 4.1, 4.2_

- [ ] 8.2 Implement library search functionality
  - Add SearchBar component to LibraryBooksPage
  - Filter results across Book Name, Location, and Book No. fields
  - Real-time filtering as user types
  - _Requirements: 4.4, 6.1, 6.2_

- [ ] 8.3 Write property test for library insert permissions (authorized)
  - **Property 16: Library Insert Permission - Authorized Roles**
  - **Validates: Requirements 4.2**

- [ ] 8.4 Write property test for library insert permissions (unauthorized)
  - **Property 17: Library Insert Permission - Unauthorized Roles**
  - **Validates: Requirements 4.3**

- [ ] 8.5 Write property test for library search results
  - **Property 18: Library Search Results Match Query**
  - **Validates: Requirements 4.4**

- [ ] 9. Implement Storage module
- [ ] 9.1 Create StoragePage component
  - Display columns: File No., Party Name, Location, Matter No.
  - Show "Add Storage Record" button only for Admin/Vipin roles
  - _Requirements: 5.1, 5.4_

- [ ] 9.2 Create storage entry form with validation
  - Required fields: File No., Party Name, Location
  - Optional field: Matter No.
  - Validate required fields before submission
  - _Requirements: 5.2, 5.3_

- [ ] 9.3 Implement storage search functionality
  - Add SearchBar component to StoragePage
  - Filter results across File No., Party Name, Location, and Matter No. fields
  - Real-time filtering as user types
  - _Requirements: 5.5, 6.1, 6.2_

- [ ] 9.4 Write property test for storage required fields validation
  - **Property 19: Storage Required Fields Validation**
  - **Validates: Requirements 5.2, 5.3**

- [ ] 9.5 Write property test for storage insert permissions
  - **Property 20: Storage Insert Permission - Unauthorized Roles**
  - **Validates: Requirements 5.4**

- [ ] 9.6 Write property test for storage search results
  - **Property 21: Storage Search Results Match Query**
  - **Validates: Requirements 5.5**

- [ ] 10. Implement universal SearchBar component
- [ ] 10.1 Create reusable SearchBar component
  - Accept module prop ('cases' | 'library' | 'storage')
  - Prominent styling at top of data views
  - Real-time onChange handler
  - _Requirements: 6.1, 6.2_

- [ ] 10.2 Integrate SearchBar into CasesPage
  - Filter cases based on search term across relevant fields
  - Update displayed results in real-time
  - _Requirements: 6.2, 6.3_

- [ ] 10.3 Write property test for universal search filter consistency
  - **Property 22: Universal Search Filter Consistency**
  - **Validates: Requirements 6.2, 6.4**

- [ ] 11. Update Appointment Scheduler
- [ ] 11.1 Ensure appointment persistence
  - Verify date, time, and details are saved correctly
  - Test retrieval of saved appointments
  - _Requirements: 7.3_

- [ ] 11.2 Implement chronological ordering
  - Sort appointments by date and time
  - Display in ascending order
  - _Requirements: 7.4_

- [ ] 11.3 Write property test for appointment persistence
  - **Property 23: Appointment Persistence Round-Trip**
  - **Validates: Requirements 7.3**

- [ ] 11.4 Write property test for appointment ordering
  - **Property 24: Appointment Chronological Ordering**
  - **Validates: Requirements 7.4**

- [ ] 12. Implement admin case reassignment
  - Allow Admin users to change assigned_to field when editing cases
  - Populate dropdown with all users for Admin
  - Update case record with new assignment
  - _Requirements: 9.3_

- [ ] 12.1 Write property test for admin case reassignment
  - **Property 25: Admin Case Reassignment**
  - **Validates: Requirements 9.3**

- [ ] 13. Update navigation and routing
  - Add Storage module to sidebar navigation
  - Add User Management link to Admin section
  - Ensure Library link uses updated naming
  - Update route definitions in App.tsx
  - _Requirements: 4.1, 5.1, 8.1_

- [ ] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Final integration and error handling
  - Implement authentication error messages (invalid username/password)
  - Implement authorization error messages (403 for unauthorized access)
  - Implement validation error messages for forms
  - Test all role-based access scenarios
  - Verify RLS policies are working correctly
  - Test user management CRUD operations
  - _Requirements: 1.4, 4.3, 5.4, 8.2, 8.3, 8.4, 8.5_
