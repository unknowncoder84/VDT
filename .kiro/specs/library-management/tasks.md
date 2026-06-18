# Implementation Plan

- [-] 1. Extend type definitions and data context



  - [ ] 1.1 Add Book and SofaItem interfaces to types/index.ts
    - Add Book interface with id, name, location, addedAt, addedBy fields

    - Add SofaItem interface with id, caseId, compartment, addedAt, addedBy fields
    - _Requirements: 2.2, 3.2, 3.3_
  - [ ] 1.2 Extend DataContextType with library management methods
    - Add books and sofaItems state arrays


    - Add addBook, deleteBook, addSofaItem, removeSofaItem methods
    - Add getDisposedCases helper method
    - _Requirements: 2.2, 2.5, 3.2, 3.5, 4.1_
  - [ ] 1.3 Implement library management functions in DataContext
    - Implement addBook with validation and localStorage persistence
    - Implement deleteBook with localStorage update
    - Implement addSofaItem with compartment assignment
    - Implement removeSofaItem with localStorage update
    - Implement getDisposedCases to filter closed cases
    - _Requirements: 2.2, 2.4, 2.5, 3.2, 3.5, 4.1, 5.1, 5.2_
  - [-] 1.4 Write property tests for data context library functions



    - **Property 1: Adding a book with valid name increases book list**
    - **Property 2: Empty/whitespace book names are rejected**
    - **Property 3: Deleting a book removes it from storage**
    - **Validates: Requirements 2.2, 2.4, 2.5**

- [ ] 2. Create Library Books Page (L1)
  - [ ] 2.1 Create LibraryBooksPage component
    - Create page with form to add new books



    - Display list of all books in L1 with name and date
    - Add delete functionality for each book
    - Style consistently with existing pages
    - _Requirements: 2.1, 2.2, 2.3, 2.5_
  - [ ] 2.2 Write property tests for book management
    - **Property 8: Book data persistence round-trip**
    - **Validates: Requirements 5.1, 5.4**

- [ ] 3. Create Sofa Page with compartments
  - [-] 3.1 Create SofaPage component with C1 and C2 sections


    - Create page with two compartment sections

    - Add dropdown to select case from case management
    - Display case files in each compartment with details
    - Add remove functionality for each item
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  - [ ] 3.2 Write property tests for compartment management
    - **Property 4: Adding case to compartment stores it correctly**
    - **Property 5: Removing case from compartment updates list**
    - **Property 9: Compartment data persistence round-trip**





    - **Validates: Requirements 3.2, 3.3, 3.5, 5.2, 5.4**

- [x] 4. Create Dispose Page


  - [ ] 4.1 Create DisposePage component
    - Create page displaying all closed/disposed cases
    - Add search functionality to filter cases
    - Display case details: client name, file number, disposal date, case type
    - Add export buttons for CSV, Excel, PDF
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [ ] 4.2 Write property tests for dispose page
    - **Property 6: Dispose page shows only closed cases**
    - **Property 7: Search filters disposed cases correctly**
    - **Validates: Requirements 4.1, 4.2, 4.4**

- [ ] 5. Integrate with Sidebar navigation
  - [ ] 5.1 Update Sidebar component with Library Management menu
    - Add "Library Management" expandable menu section
    - Add sub-items: "Add Book (L1)", "Sofa", "Dispose"
    - Add appropriate icons (BookOpen, Sofa, Archive)
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ] 5.2 Add routes to App.tsx
    - Add route for /library/books
    - Add route for /library/sofa
    - Add route for /library/dispose
    - Wrap routes with ProtectedRoute
    - _Requirements: 1.3_

- [ ] 6. Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.
