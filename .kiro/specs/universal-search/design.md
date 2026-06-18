# Design Document

## Overview

The universal search feature enhances the existing Header search bar to provide comprehensive search capabilities across all data entities in the legal case management system. The design focuses on creating a unified search experience that queries multiple data sources simultaneously, presents results in a categorized format, and enables quick navigation to detailed views.

The implementation will extend the current Header component by replacing the limited search logic (currently only searching cases and counsel) with a comprehensive search system that includes cases, counsel, appointments, tasks, expenses, books, and sofa items.

## Architecture

### Component Structure

```
Header Component (Enhanced)
├── Search Input (Existing)
├── Universal Search Results Dropdown (New)
│   ├── Category Section (Cases)
│   │   └── Result Items
│   ├── Category Section (Counsel)
│   │   └── Result Items
│   ├── Category Section (Appointments)
│   │   └── Result Items
│   ├── Category Section (Tasks)
│   │   └── Result Items
│   ├── Category Section (Expenses)
│   │   └── Result Items
│   ├── Category Section (Books)
│   │   └── Result Items
│   └── Category Section (Sofa Items)
│       └── Result Items
```

### Data Flow

1. User types in search input
2. Search term is debounced (300ms delay)
3. useMemo hook computes search results across all data sources
4. Results are categorized and limited per category
5. Results dropdown renders with categorized sections
6. User clicks a result item
7. Navigation occurs to the appropriate page
8. Search state is reset

## Components and Interfaces

### Enhanced Header Component

The Header component will be modified to include universal search functionality:

**Props:**
- `onMenuClick: () => void` (existing)

**State:**
- `searchTerm: string` - Current search input value
- `showResults: boolean` - Controls results dropdown visibility

**Hooks:**
- `useNavigate()` - React Router navigation
- `useTheme()` - Theme context for styling
- `useAuth()` - User authentication context
- `useData()` - Access to all data entities

### Search Result Types

```typescript
interface SearchResults {
  cases: Case[];
  counsel: Counsel[];
  appointments: Appointment[];
  tasks: Task[];
  expenses: Expense[];
  books: Book[];
  sofaItems: SofaItemWithCase[];
}

interface SofaItemWithCase extends SofaItem {
  caseName: string;
}

type SearchCategory = 
  | 'cases' 
  | 'counsel' 
  | 'appointments' 
  | 'tasks' 
  | 'expenses' 
  | 'books' 
  | 'sofaItems';
```

### Search Logic Interface

```typescript
interface SearchMatcher {
  matchCase: (c: Case, term: string) => boolean;
  matchCounsel: (c: Counsel, term: string) => boolean;
  matchAppointment: (a: Appointment, term: string) => boolean;
  matchTask: (t: Task, term: string) => boolean;
  matchExpense: (e: Expense, term: string) => boolean;
  matchBook: (b: Book, term: string) => boolean;
  matchSofaItem: (s: SofaItem, cases: Case[], term: string) => boolean;
}
```

## Data Models

### Search Result Item Display

Each category will display specific fields:

**Cases:**
- Primary: Client Name
- Secondary: File Number | Case Type

**Counsel:**
- Primary: Name
- Secondary: Email

**Appointments:**
- Primary: Client Name
- Secondary: Date | Time

**Tasks:**
- Primary: Title
- Secondary: Assigned To | Deadline

**Expenses:**
- Primary: Description
- Secondary: Amount | Month

**Books:**
- Primary: Book Name
- Secondary: Added Date

**Sofa Items:**
- Primary: Case Name
- Secondary: Compartment | Added Date

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Search completeness
*For any* valid search term and any data entity in the system, if the entity contains the search term in any searchable field, then that entity should appear in the search results.
**Validates: Requirements 1.1, 5.1, 5.2**

### Property 2: Case-insensitive matching
*For any* search term and any data entity, searching with the term in uppercase, lowercase, or mixed case should return the same results.
**Validates: Requirements 5.1**

### Property 3: Category grouping consistency
*For any* search results, all results of the same entity type should be grouped together under the same category header.
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 4: Result limit per category
*For any* category with more than 5 matching results, the displayed results should contain exactly 5 items.
**Validates: Requirements 2.5**

### Property 5: Navigation correctness
*For any* search result item clicked, the system should navigate to the correct page corresponding to that entity type.
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7**

### Property 6: Search state reset on navigation
*For any* navigation action triggered by clicking a search result, the search input should be cleared and the results dropdown should be closed.
**Validates: Requirements 4.8**

### Property 7: Empty search handling
*For any* empty or whitespace-only search term, the results dropdown should not be displayed.
**Validates: Requirements 1.3**

### Property 8: Field matching specificity
*For any* entity type and search term, the search should match against all and only the specified searchable fields for that entity type.
**Validates: Requirements 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9**

## Error Handling

### Input Validation
- Empty search terms are handled by not displaying results
- Whitespace-only terms are treated as empty
- Special characters in search terms are escaped for safe matching

### Data Availability
- If DataContext is unavailable, search returns empty results
- If specific data arrays are undefined, they are treated as empty arrays
- Missing fields in data entities are handled gracefully (treated as empty strings)

### Navigation Errors
- If navigation fails, the search state remains unchanged
- Invalid entity IDs are handled by the routing system
- Missing routes fall back to 404 handling

### Performance Safeguards
- Search is debounced to prevent excessive computations
- Results are memoized to avoid unnecessary recalculations
- Each category is limited to 5 results to prevent DOM overload

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

1. **Empty Search Tests**
   - Empty string returns no results
   - Whitespace-only string returns no results
   - Null/undefined search term is handled

2. **Single Entity Tests**
   - Search finds a specific case by client name
   - Search finds a specific counsel by email
   - Search finds a specific task by title

3. **Edge Case Tests**
   - Special characters in search terms
   - Very long search terms
   - Unicode characters in search terms
   - Search with no matching results

4. **Navigation Tests**
   - Clicking case result navigates to case details
   - Clicking counsel result navigates to counsel page
   - Search state is cleared after navigation

### Property-Based Testing

Property-based tests will verify universal properties using **fast-check** library for TypeScript. Each test will run a minimum of 100 iterations.

1. **Property 1: Search completeness**
   - Generate random data entities with known searchable content
   - Generate search terms that match parts of the content
   - Verify all matching entities appear in results
   - **Feature: universal-search, Property 1: Search completeness**

2. **Property 2: Case-insensitive matching**
   - Generate random search terms
   - Search with lowercase, uppercase, and mixed case versions
   - Verify all three searches return identical results
   - **Feature: universal-search, Property 2: Case-insensitive matching**

3. **Property 3: Category grouping consistency**
   - Generate random search results with mixed entity types
   - Verify all entities of the same type are grouped together
   - Verify category headers match entity types
   - **Feature: universal-search, Property 3: Category grouping consistency**

4. **Property 4: Result limit per category**
   - Generate categories with varying numbers of results (0-20)
   - Verify categories with >5 results show exactly 5
   - Verify categories with ≤5 results show all results
   - **Feature: universal-search, Property 4: Result limit per category**

5. **Property 5: Navigation correctness**
   - Generate random entity types and IDs
   - Simulate clicking each result type
   - Verify navigation path matches entity type
   - **Feature: universal-search, Property 5: Navigation correctness**

6. **Property 6: Search state reset on navigation**
   - Generate random search states
   - Simulate navigation action
   - Verify search input is empty and dropdown is closed
   - **Feature: universal-search, Property 6: Search state reset on navigation**

7. **Property 7: Empty search handling**
   - Generate various empty/whitespace strings
   - Verify results dropdown is never shown
   - Verify no search computation occurs
   - **Feature: universal-search, Property 7: Empty search handling**

8. **Property 8: Field matching specificity**
   - Generate entities with data in searchable and non-searchable fields
   - Generate search terms matching non-searchable fields
   - Verify no results are returned for non-searchable field matches
   - Generate search terms matching searchable fields
   - Verify results are returned for searchable field matches
   - **Feature: universal-search, Property 8: Field matching specificity**

### Integration Testing

Integration tests will verify the complete search workflow:

1. User types in search input → Results appear
2. User clicks result → Navigation occurs
3. User clears search → Results disappear
4. User clicks outside → Dropdown closes

### Testing Framework

- **Unit Tests**: Vitest with React Testing Library
- **Property-Based Tests**: fast-check library
- **Test Configuration**: Minimum 100 iterations per property test
- **Coverage Target**: 90%+ for search logic functions

## Implementation Notes

### Performance Optimization

1. **Debouncing**: Use a 300ms debounce on search input to reduce computation frequency
2. **Memoization**: Use `useMemo` to cache search results based on search term and data dependencies
3. **Result Limiting**: Limit each category to 5 results to reduce rendering overhead
4. **Lazy Evaluation**: Only compute results when search term is non-empty

### Accessibility

1. **Keyboard Navigation**: Support arrow keys to navigate results
2. **ARIA Labels**: Add appropriate ARIA labels to search input and results
3. **Focus Management**: Maintain focus state during search interactions
4. **Screen Reader Support**: Announce result counts and categories

### Theme Integration

The search interface will respect the existing theme system:

- Light theme: White background, gray borders, purple accents
- Dark theme: Dark background, cyan/purple borders, gradient accents
- Hover states: Theme-appropriate background changes
- Focus states: Gradient glow effect (existing)

### Responsive Design

- Mobile: Compact result items, smaller fonts
- Tablet: Medium-sized result items
- Desktop: Full-sized result items with all details

## Future Enhancements

1. **Search History**: Store recent searches for quick access
2. **Search Suggestions**: Auto-complete based on common searches
3. **Advanced Filters**: Filter results by date, status, or other criteria
4. **Keyboard Shortcuts**: Global shortcut to focus search (e.g., Cmd+K)
5. **Search Analytics**: Track popular searches to improve UX
6. **Fuzzy Matching**: Implement fuzzy search for typo tolerance
7. **Result Highlighting**: Highlight matching text in results
8. **Pagination**: "View all" links to see complete category results
