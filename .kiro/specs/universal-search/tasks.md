# Implementation Plan

- [x] 1. Enhance Header component with universal search logic



  - Modify the existing searchResults useMemo to include all data entities (cases, counsel, appointments, tasks, expenses, books, sofaItems)
  - Implement search matching functions for each entity type with case-insensitive partial matching
  - Add logic to enrich sofa items with case names for display
  - Limit each category to 5 results maximum
  - _Requirements: 1.1, 2.5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

- [x] 1.1 Write property test for search completeness


  - **Property 1: Search completeness**
  - **Validates: Requirements 1.1, 5.1, 5.2**



- [x] 1.2 Write property test for case-insensitive matching

  - **Property 2: Case-insensitive matching**
  - **Validates: Requirements 5.1**

- [x] 1.3 Write property test for field matching specificity


  - **Property 8: Field matching specificity**
  - **Validates: Requirements 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9**

- [ ] 2. Update search results dropdown UI to display all categories
  - Modify the results dropdown JSX to render all entity types (cases, counsel, appointments, tasks, expenses, books, sofaItems)
  - Implement conditional rendering to only show categories with results
  - Add category headers for each entity type
  - Display appropriate fields for each result type (client name, file no, email, date, etc.)
  - Add "No results found" message when search term exists but no matches found
  - _Requirements: 1.2, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 2.1 Write property test for category grouping consistency
  - **Property 3: Category grouping consistency**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [ ] 2.2 Write property test for result limit per category
  - **Property 4: Result limit per category**
  - **Validates: Requirements 2.5**

- [ ] 2.3 Write unit tests for result display formatting
  - Test that case results show client name, file number, and case type
  - Test that counsel results show name and email
  - Test that appointment results show client name, date, and time
  - Test that task results show title, assigned to, and deadline
  - Test that expense results show description, amount, and month
  - Test that book results show name and added date
  - Test that sofa item results show case name, compartment, and added date
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 3. Implement navigation handlers for all result types
  - Update handleResultClick to accept all entity types (case, counsel, appointment, task, expense, book, sofaItem)
  - Add navigation logic for each entity type to the appropriate page
  - Ensure search state is cleared (searchTerm reset, showResults set to false) after navigation
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [ ] 3.1 Write property test for navigation correctness
  - **Property 5: Navigation correctness**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7**

- [ ] 3.2 Write property test for search state reset on navigation
  - **Property 6: Search state reset on navigation**
  - **Validates: Requirements 4.8**

- [ ] 4. Add empty search handling and state management
  - Ensure results dropdown only shows when searchTerm is non-empty (trim whitespace)
  - Implement clear button functionality to reset search state
  - Add onBlur handler with delay to allow result clicks before closing
  - Add click-outside detection to close dropdown
  - _Requirements: 1.3, 1.5, 6.4, 6.5_

- [ ] 4.1 Write property test for empty search handling
  - **Property 7: Empty search handling**
  - **Validates: Requirements 1.3**

- [ ] 4.2 Write unit tests for state management
  - Test that clearing search input hides dropdown and resets state
  - Test that clicking outside closes dropdown
  - Test that blur event closes dropdown after delay
  - _Requirements: 1.5, 6.4, 6.5_

- [ ] 5. Verify theme integration and responsive design
  - Test search interface in both light and dark themes
  - Verify all category sections and result items use theme-appropriate styling
  - Test responsive behavior on mobile, tablet, and desktop viewports
  - Ensure hover states work correctly with theme colors
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
