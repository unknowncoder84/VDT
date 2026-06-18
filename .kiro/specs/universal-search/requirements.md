# Requirements Document

## Introduction

This document outlines the requirements for implementing a universal search feature in the legal case management dashboard. The universal search will enhance the existing search bar in the top center of the Header component to search across all data entities in the system (cases, clients, appointments, counsel, tasks, expenses, books, and sofa items) and display comprehensive results in a unified interface.

## Glossary

- **Universal Search**: A search functionality that queries multiple data sources simultaneously and presents unified results
- **Header Component**: The top navigation bar component that contains the search interface
- **Search Results Dropdown**: A dropdown panel that displays categorized search results below the search input
- **Data Entity**: Any searchable data type in the system (Case, Counsel, Appointment, Task, Expense, Book, SofaItem)
- **Search Term**: The text input provided by the user to query the system
- **Result Item**: An individual search result representing a matched data entity
- **Navigation Action**: The action of redirecting the user to the detailed view of a selected search result

## Requirements

### Requirement 1

**User Story:** As a user, I want to search across all data in the system from the header search bar, so that I can quickly find any information without navigating to specific pages.

#### Acceptance Criteria

1. WHEN a user types in the header search bar, THE system SHALL search across cases, counsel, appointments, tasks, expenses, books, and sofa items simultaneously
2. WHEN search results are found, THE system SHALL display them in a categorized dropdown below the search input
3. WHEN no search term is entered, THE system SHALL not display the results dropdown
4. WHEN the search term matches no data, THE system SHALL display a "No results found" message
5. WHEN a user clears the search input, THE system SHALL hide the results dropdown and reset the search state

### Requirement 2

**User Story:** As a user, I want search results to be organized by category, so that I can easily identify the type of information I'm looking for.

#### Acceptance Criteria

1. WHEN displaying search results, THE system SHALL group results by entity type (Cases, Counsel, Appointments, Tasks, Expenses, Books, Sofa Items)
2. WHEN a category has matching results, THE system SHALL display a category header with the entity type name
3. WHEN a category has no matching results, THE system SHALL not display that category in the dropdown
4. WHEN multiple categories have results, THE system SHALL display them in a consistent order (Cases, Counsel, Appointments, Tasks, Expenses, Books, Sofa Items)
5. WHEN a category has more than 5 results, THE system SHALL limit the display to the first 5 results and show a "View all" indicator

### Requirement 3

**User Story:** As a user, I want to see relevant information for each search result, so that I can identify the correct item before clicking.

#### Acceptance Criteria

1. WHEN displaying a case result, THE system SHALL show the client name, file number, and case type
2. WHEN displaying a counsel result, THE system SHALL show the counsel name and email address
3. WHEN displaying an appointment result, THE system SHALL show the client name, date, and time
4. WHEN displaying a task result, THE system SHALL show the task title, assigned to name, and deadline
5. WHEN displaying an expense result, THE system SHALL show the description, amount, and month
6. WHEN displaying a book result, THE system SHALL show the book name and added date
7. WHEN displaying a sofa item result, THE system SHALL show the case name, compartment, and added date

### Requirement 4

**User Story:** As a user, I want to click on a search result to navigate to its detailed view, so that I can access the full information quickly.

#### Acceptance Criteria

1. WHEN a user clicks on a case search result, THE system SHALL navigate to the case details page for that case
2. WHEN a user clicks on a counsel search result, THE system SHALL navigate to the counsel page
3. WHEN a user clicks on an appointment search result, THE system SHALL navigate to the appointments page
4. WHEN a user clicks on a task search result, THE system SHALL navigate to the tasks page
5. WHEN a user clicks on an expense search result, THE system SHALL navigate to the expenses page
6. WHEN a user clicks on a book search result, THE system SHALL navigate to the library books page
7. WHEN a user clicks on a sofa item search result, THE system SHALL navigate to the sofa page
8. WHEN navigation occurs, THE system SHALL clear the search input and close the results dropdown

### Requirement 5

**User Story:** As a user, I want the search to be case-insensitive and match partial text, so that I can find results even with incomplete or lowercase queries.

#### Acceptance Criteria

1. WHEN a user enters a search term, THE system SHALL perform case-insensitive matching across all searchable fields
2. WHEN a search term partially matches a field value, THE system SHALL include that result in the search results
3. WHEN searching cases, THE system SHALL match against client name, file number, parties name, and case type
4. WHEN searching counsel, THE system SHALL match against name and email
5. WHEN searching appointments, THE system SHALL match against client name and details
6. WHEN searching tasks, THE system SHALL match against title, description, and assigned to name
7. WHEN searching expenses, THE system SHALL match against description
8. WHEN searching books, THE system SHALL match against book name
9. WHEN searching sofa items, THE system SHALL match against the associated case name

### Requirement 6

**User Story:** As a user, I want the search interface to be responsive and performant, so that I can get results quickly without lag.

#### Acceptance Criteria

1. WHEN a user types in the search input, THE system SHALL debounce the search to avoid excessive computations
2. WHEN search results are computed, THE system SHALL use memoization to optimize performance
3. WHEN the results dropdown is displayed, THE system SHALL render smoothly without blocking the UI
4. WHEN the user clicks outside the search area, THE system SHALL close the results dropdown
5. WHEN the search input loses focus, THE system SHALL close the results dropdown after a brief delay to allow result clicks

### Requirement 7

**User Story:** As a user, I want the search interface to maintain the existing visual design, so that it integrates seamlessly with the current theme system.

#### Acceptance Criteria

1. WHEN the search interface is displayed, THE system SHALL apply the current theme (light or dark) styling
2. WHEN the results dropdown is shown, THE system SHALL use consistent colors, borders, and shadows matching the theme
3. WHEN hovering over a result item, THE system SHALL provide visual feedback consistent with the theme
4. WHEN the search input is focused, THE system SHALL display the existing gradient glow effect
5. WHEN displaying category headers, THE system SHALL use the theme-appropriate background and text colors
