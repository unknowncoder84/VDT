# Implementation Plan

- [x] 1. Add data types and database schema

  - [x] 1.1 Add LibraryLocation and StorageLocation interfaces to src/types/index.ts


    - Define id, name, createdBy, createdAt fields
    - Export interfaces for use across components


    - _Requirements: 5.1_
  - [ ] 1.2 Create SQL migration for library_locations and storage_locations tables
    - Create library_locations table with id, name, created_by, created_at

    - Create storage_locations table with id, name, created_by, created_at


    - Add RLS policies for authenticated users
    - _Requirements: 5.1, 5.2_


- [ ] 2. Implement database operations in Supabase client
  - [ ] 2.1 Add libraryLocations CRUD operations to src/lib/supabase.ts
    - Implement getAll, create, delete functions


    - Follow existing pattern from courts/caseTypes
    - _Requirements: 1.2, 1.5, 5.2_
  - [ ] 2.2 Add storageLocations CRUD operations to src/lib/supabase.ts
    - Implement getAll, create, delete functions
    - Follow existing pattern from courts/caseTypes
    - _Requirements: 2.2, 2.5, 5.2_


- [ ] 3. Extend DataContext with location state and operations
  - [ ] 3.1 Add libraryLocations state and CRUD functions to DataContext
    - Add state array for libraryLocations
    - Implement addLibraryLocation with validation
    - Implement deleteLibraryLocation
    - Fetch locations on user login
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 5.2_
  - [ ] 3.2 Write property test for library location validation
    - **Property 2: Whitespace-only names are rejected**
    - **Validates: Requirements 1.3, 2.3**
  - [ ] 3.3 Add storageLocations state and CRUD functions to DataContext
    - Add state array for storageLocations
    - Implement addStorageLocation with validation
    - Implement deleteStorageLocation
    - Fetch locations on user login
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 5.2_


  - [ ] 3.4 Write property test for location persistence
    - **Property 1: Valid location names are persisted**
    - **Validates: Requirements 1.2, 2.2**
  - [x] 3.5 Write property test for location deletion

    - **Property 4: Deleted locations are removed**
    - **Validates: Requirements 1.5, 2.5, 5.3, 5.4**

- [ ] 4. Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Update Settings page with location management sections
  - [ ] 5.1 Add Library Management section to SettingsPage
    - Add input field and add button for library locations
    - Display existing library locations with delete buttons


    - Follow existing Court Management UI pattern
    - Admin-only visibility
    - _Requirements: 1.1, 1.2, 1.4, 1.5_
  - [x] 5.2 Add Storage Management section to SettingsPage

    - Add input field and add button for storage locations
    - Display existing storage locations with delete buttons
    - Follow existing Court Management UI pattern
    - Admin-only visibility

    - _Requirements: 2.1, 2.2, 2.4, 2.5_
  - [ ] 5.3 Write property test for added locations appearing in list
    - **Property 3: Added locations appear in list**
    - **Validates: Requirements 1.4, 2.4**

- [ ] 6. Update Library page with location buttons
  - [ ] 6.1 Add location buttons section to LibraryPage
    - Fetch libraryLocations from DataContext
    - Render each location as a styled button


    - Add "All" button to show all items
    - Style buttons similar to Dropbox integration format
    - _Requirements: 3.1, 3.2_
  - [x] 6.2 Implement location filtering on LibraryPage

    - Add selectedLocation state
    - Filter libraryItems based on selected location
    - Update item display when location is clicked
    - _Requirements: 3.3, 3.4_


  - [ ] 6.3 Update LibraryPage add form to include location dropdown
    - Add location field to the add item form
    - Populate dropdown with available library locations
    - Save location with new items
    - _Requirements: 3.3_
  - [ ] 6.4 Write property test for location button rendering
    - **Property 5: All locations render as buttons**
    - **Validates: Requirements 3.1, 4.1**

- [ ] 7. Update Storage page with location buttons
  - [ ] 7.1 Add location buttons section to StoragePage
    - Fetch storageLocations from DataContext
    - Render each location as a styled button
    - Add "All" button to show all items
    - Style buttons similar to Dropbox integration format
    - _Requirements: 4.1, 4.2_
  - [ ] 7.2 Implement location filtering on StoragePage
    - Add selectedLocation state
    - Filter storageItems based on selected location
    - Update item display when location is clicked
    - _Requirements: 4.3, 4.4_
  - [ ] 7.3 Update StoragePage add form to include location dropdown
    - Add location field to the add item form
    - Populate dropdown with available storage locations
    - Save location with new items
    - _Requirements: 4.3_
  - [ ] 7.4 Write property test for location filtering
    - **Property 6: Location filtering returns correct items**
    - **Validates: Requirements 3.3, 4.3**

- [ ] 8. Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Additional property tests
  - [ ] 9.1 Write property test for unique location IDs
    - **Property 7: All location IDs are unique**
    - **Validates: Requirements 5.1**
  - [ ] 9.2 Write property test for persistence round-trip
    - **Property 8: Locations persist across sessions**
    - **Validates: Requirements 5.2**

- [ ] 10. Final Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.
