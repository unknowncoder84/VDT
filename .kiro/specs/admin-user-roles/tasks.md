# Implementation Plan

- [x] 1. Update User type and AuthContext with role management




  - [ ] 1.1 Enhance User type in src/types/index.ts
    - Add isActive boolean field
    - Add updatedAt field


    - Update role type to 'admin' | 'user'
    - _Requirements: 3.1, 4.1, 6.1_
  - [ ] 1.2 Extend AuthContext with user management functions
    - Add users array state
    - Add isAdmin computed property
    - Add createUser, updateUserRole, toggleUserStatus, deleteUser functions
    - Add self-protection logic for admin actions




    - _Requirements: 2.1, 3.1, 3.3, 4.1, 4.3, 7.1, 7.2_
  - [ ]* 1.3 Write property test for user data round-trip
    - **Property 10: User Data Round-Trip**
    - **Validates: Requirements 6.3, 6.4**





- [ ] 2. Create AdminRoute component for route protection
  - [ ] 2.1 Create AdminRoute component in src/components/AdminRoute.tsx
    - Check if user has admin role
    - Redirect non-admins to dashboard
    - _Requirements: 1.2_
  - [ ]* 2.2 Write property test for admin route protection
    - **Property 1: Admin Route Protection**
    - **Validates: Requirements 1.2**

- [ ] 3. Create AdminPage component with user management UI
  - [x] 3.1 Create AdminPage in src/pages/AdminPage.tsx




    - Display user list with roles and status
    - Add create user form/modal
    - Add role change buttons
    - Add activate/deactivate buttons
    - Add delete button with confirmation



    - _Requirements: 1.1, 1.3, 2.1, 2.3, 3.1, 4.1, 7.1, 7.3_

  - [ ]* 3.2 Write property tests for user management operations
    - **Property 3: User Creation Grows List**
    - **Property 4: Email Uniqueness Enforcement**
    - **Property 5: Role Change Persistence**
    - **Property 11: User Deletion Shrinks List**
    - **Validates: Requirements 2.1, 2.2, 3.1, 3.2, 7.1**

- [x] 4. Update Sidebar with conditional admin menu




  - [ ] 4.1 Add admin panel link to Sidebar
    - Show admin link only for admin users


    - Use Shield icon for admin panel
    - _Requirements: 5.1, 5.2_
  - [ ]* 4.2 Write property test for conditional menu visibility
    - **Property 9: Conditional Menu Visibility**
    - **Validates: Requirements 5.1**

- [ ] 5. Update App.tsx with admin routes
  - [ ] 5.1 Add AdminRoute wrapper and AdminPage route
    - Import AdminRoute and AdminPage
    - Add /admin route with AdminRoute protection
    - _Requirements: 1.1, 1.2_

- [ ] 6. Add self-protection validation tests
  - [ ]* 6.1 Write property tests for self-protection rules
    - **Property 6: Self-Demotion Prevention**
    - **Property 8: Self-Deactivation Prevention**
    - **Property 12: Self-Deletion Prevention**
    - **Validates: Requirements 3.3, 4.3, 7.2**

- [ ] 7. Update login to support multiple users and inactive check
  - [ ] 7.1 Update login function in AuthContext
    - Check against users array for credentials
    - Prevent login for inactive accounts
    - _Requirements: 4.1_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
