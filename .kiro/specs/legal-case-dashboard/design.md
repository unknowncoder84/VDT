# Design Document: PRK's Office - Legal Case Management Dashboard

## Overview

PRK's Office is a premium legal case management dashboard built with React, Tailwind CSS, and Lucide-React icons. The system provides a sophisticated, glassmorphic interface with smooth animations and refined typography. The design emphasizes a "Classy yet Stylish" aesthetic using a dark color palette with electric magenta accents, creating a SaaS-quality experience for law firm case management.

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Routing Layer (React Router)             │   │
│  │  - Auth Routes (Login)                               │   │
│  │  - Protected Routes (Dashboard, Cases, etc.)         │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           State Management (Context/Hooks)           │   │
│  │  - Auth Context (user, token, login/logout)         │   │
│  │  - Theme Context (light/dark mode)                  │   │
│  │  - Data Context (cases, counsel, appointments)      │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Component Layer (UI Components)              │   │
│  │  - Layout Components (Sidebar, Header, Footer)      │   │
│  │  - Page Components (Dashboard, Cases, etc.)         │   │
│  │  - Feature Components (Forms, Tables, Cards)        │   │
│  │  - Shared Components (Buttons, Inputs, Badges)      │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Services Layer (Business Logic)              │   │
│  │  - API Service (HTTP requests)                       │   │
│  │  - Storage Service (Local storage, session)          │   │
│  │  - Validation Service (Form validation)              │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Data Layer (Storage & Persistence)           │   │
│  │  - Local Storage (User preferences, cache)           │   │
│  │  - Mock API (Development data)                       │   │
│  │  - Backend API (Production data)                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS with custom configuration for glassmorphism
- **Icons**: Lucide-React
- **Animation**: Framer Motion for complex animations, Tailwind Animate for simple transitions
- **State Management**: React Context API with useReducer for complex state
- **Routing**: React Router v6
- **Form Handling**: React Hook Form with Zod validation
- **Rich Text Editor**: TipTap or similar for Additional Details field
- **Date/Time**: date-fns for date manipulation
- **HTTP Client**: Axios or Fetch API

## Components and Interfaces

### Layout Components

#### MainLayout
- Sidebar navigation with collapsible menu
- Top header with user profile and theme toggle
- Main content area with page-specific content
- Footer with copyright information

#### Sidebar
- Navigation menu items with icons
- Active route highlighting
- Collapsible sections for grouped navigation
- User profile section at bottom

#### Header
- Application logo/title
- Search bar (optional)
- User profile dropdown
- Theme toggle button
- Notification bell (optional)

### Page Components

#### LoginPage
- Full-screen cinematic background (Golden Gate Bridge)
- Dark overlay (rgba(0,0,0,0.6))
- Centered glassmorphism card
- Email and password input fields
- Gradient blue "Log in" button
- Error message display
- "Remember me" checkbox (optional)

#### DashboardPage
- Welcome section with gradient text
- Statistics grid with 6 animated cards
- Statistics table widget
- Interactive calendar widget
- Recent activity or quick actions section

#### CasesPage
- Tab navigation: "My Cases", "All Cases", "Office Cases"
- "Create Office Case" button
- Cases table with hover highlighting
- Pagination controls
- Search/filter functionality

#### CaseDetailsPage
- Case header with title and edit button
- Animated tab navigation
- Tab content sections:
  - Basic Details
  - Files
  - Interim Relief
  - Circulation
  - Payments
  - Tasks
  - Timeline

#### CounselPage
- Counsel table with columns: Name, Mobile, Total Cases, Created By, Details
- "Create Counsel" button
- Counsel form modal/page

#### AppointmentsPage
- Appointment form with Date, Time, User, Client, Details fields
- "Upcoming Appointments" card displaying scheduled appointments
- Appointment list with edit/delete actions

#### FinancePage
- Hero banner with gradient styling
- Date range picker
- "Get Report" button
- Transaction table
- Summary statistics

#### SettingsPage
- Theme switcher with animated toggle
- Court Management section
- Case Type Management section
- User preferences section

### Feature Components

#### StatCard
- Icon, title, count, and color coding
- Hover lift effect (scale-105)
- Glow effect on hover
- Stagger animation on mount

#### CaseTable
- Columns: SR, Client Name, File No, Next Date, Stamp No, Reg No, Status, Case Type, Parties, Actions
- Row hover highlighting
- Status badges with color coding
- Action dropdown menu
- Pagination

#### CreateCaseForm
- Multi-row grid layout
- Sections: Client Info, Case Info, Legal Details, Opposition, Extras
- Rich text editor for Additional Details
- Form validation
- Submit and cancel buttons

#### CounselForm
- Fields: Counsel Name, Email, Mobile, Address, Rich Text Details
- Form validation
- Submit and cancel buttons

#### AppointmentForm
- Fields: Date, Time, User, Client, Details
- Date and time pickers
- Form validation
- Submit button

#### TransactionTable
- Columns: Amount, Status, Received By, Confirmed By, View Case
- Status badges (Green for received, Red for pending)
- "View Case" link navigation

### Shared Components

#### Button
- Primary (Gradient Magenta-Purple)
- Secondary (Outlined)
- Tertiary (Ghost)
- Sizes: sm, md, lg
- States: default, hover, active, disabled
- Ripple effect on click

#### Input
- Text, email, password, number, date, time types
- Placeholder text
- Error state with error message
- Focus state with glow effect
- Glassmorphic styling

#### Badge
- Status badges (Active, Pending, Closed, On Hold)
- Color coding based on status
- Compact and readable design

#### Card
- Glassmorphic styling with semi-transparent background
- Backdrop blur effect
- Subtle white/10 border
- Hover lift and glow effects
- Padding and spacing

#### Modal
- Centered overlay
- Glassmorphic card styling
- Close button
- Header, body, footer sections
- Fade-in animation

#### Tabs
- Tab buttons with underline indicator
- Animated underline transition
- Tab content display
- Active state styling

#### Calendar
- Month view with day grid
- Current date highlighted in Amber
- Navigation to previous/next months
- Day selection capability

#### RichTextEditor
- Toolbar with formatting options (bold, italic, underline, lists, etc.)
- Content area for text input
- Glassmorphic styling
- Character count (optional)

## Data Models

### User
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  avatar?: string;
  createdAt: Date;
}
```

### Case
```typescript
interface Case {
  id: string;
  clientName: string;
  clientEmail: string;
  clientMobile: string;
  clientAlternateNo?: string;
  fileNo: string;
  stampNo: string;
  regNo: string;
  partiesName: string;
  district: string;
  caseType: string;
  court: string;
  onBehalfOf: string;
  noResp: string;
  opponentLawyer: string;
  additionalDetails: string;
  feesQuoted: number;
  status: 'pending' | 'active' | 'closed' | 'on-hold';
  nextDate: Date;
  filingDate: Date;
  circulationStatus: 'circulated' | 'non-circulated';
  interimRelief: 'favor' | 'against' | 'none';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Counsel
```typescript
interface Counsel {
  id: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  details: string;
  totalCases: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Appointment
```typescript
interface Appointment {
  id: string;
  date: Date;
  time: string;
  user: string;
  client: string;
  details: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Transaction
```typescript
interface Transaction {
  id: string;
  amount: number;
  status: 'received' | 'pending';
  receivedBy: string;
  confirmedBy: string;
  caseId: string;
  createdAt: Date;
}
```

### Court
```typescript
interface Court {
  id: string;
  name: string;
  createdAt: Date;
}
```

### CaseType
```typescript
interface CaseType {
  id: string;
  name: string;
  createdAt: Date;
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Case Creation Persistence
*For any* valid case data submitted through the create case form, the case should be persisted to storage and retrievable with identical information.
**Validates: Requirements 5.7, 12.1, 12.3**

### Property 2: Case Status Badge Accuracy
*For any* case with a status value, the displayed status badge should match the case's status field and use the correct color coding (Active, Pending, Closed, On Hold).
**Validates: Requirements 3.3, 11.2**

### Property 3: Authentication State Consistency
*For any* user session, after successful login with valid credentials, the user should remain authenticated across page navigation until explicitly logged out.
**Validates: Requirements 1.3, 1.5**

### Property 4: Tab Content Isolation
*For any* case details view, switching between tabs should display only the content for the selected tab without mixing content from other tabs.
**Validates: Requirements 6.2, 6.3**

### Property 5: Statistics Grid Animation Sequence
*For any* dashboard load, all six statistics cards should animate in sequence with stagger effect, with each card appearing after the previous one completes.
**Validates: Requirements 2.3**

### Property 6: Glassmorphism Styling Consistency
*For any* card or surface component, the component should have semi-transparent background, backdrop blur effect, and subtle white/10 border applied.
**Validates: Requirements 11.3**

### Property 7: Hover Effect Application
*For any* interactive card element, hovering should apply both scale-105 lift effect and glow effect simultaneously.
**Validates: Requirements 11.4**

### Property 8: Theme Persistence
*For any* theme toggle action, the selected theme should persist across browser sessions and be applied on subsequent visits.
**Validates: Requirements 10.2**

### Property 9: Form Validation Completeness
*For any* form submission with missing required fields, the system should display validation errors for all missing fields and prevent submission.
**Validates: Requirements 5.8**

### Property 10: Case Table Data Accuracy
*For any* cases table view, all displayed case information should match the source data exactly, including names, numbers, and status values.
**Validates: Requirements 3.5, 12.3**

### Property 11: Appointment List Ordering
*For any* upcoming appointments list, appointments should be ordered chronologically by date and time, with earliest appointments appearing first.
**Validates: Requirements 8.2, 8.4**

### Property 12: Transaction Status Consistency
*For any* transaction displayed in the finance table, the status badge color should match the transaction status (Green for received, Red for pending).
**Validates: Requirements 9.3, 9.4**

### Property 13: Case Table Column Consistency
*For any* cases table view (My Cases, All Cases, Office Cases), all tables should display identical column structure and ordering: SR, Client Name, File No, Next Date, Stamp No, Reg No, Status, Case Type, Parties, Actions.
**Validates: Requirements 3.1, 4.1, 4.4**

### Property 14: Form Field Presence
*For any* create case form, all required sections and fields should be present: Client Info (Name, Email, Mobile, Alternate No), Case Info (Parties, District, Case Type, Court, On Behalf Of, No Resp), Legal Details (File No, Stamp No, Reg No, Fees), Opposition (Opponent Lawyer), and Additional Details (Rich Text Editor).
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

### Property 15: Invalid Credentials Rejection
*For any* login attempt with invalid credentials, the system should display an error message and maintain the login form state without clearing the email field.
**Validates: Requirements 1.4**

### Property 16: Protected Route Access Control
*For any* unauthenticated user attempting to access a protected route, the system should redirect to the login page.
**Validates: Requirements 1.5**

### Property 17: Welcome Message Format
*For any* authenticated user viewing the dashboard, the welcome message should display in the format "Welcome, [User]" with the user's actual name.
**Validates: Requirements 2.1**

### Property 18: Statistics Grid Card Presence
*For any* dashboard load, all six statistics cards should be present with correct labels and colors: My Cases (Purple), Pending Tasks (Blue), IR Favor (Green), IR Against (Red), Non-Circulated (Cyan), Circulated (Pink).
**Validates: Requirements 2.2**

### Property 19: Calendar Current Date Highlighting
*For any* calendar widget displayed on the dashboard, the current date should be highlighted in Amber color.
**Validates: Requirements 2.5**

### Property 20: Row Hover Highlighting
*For any* cases table, hovering over a row should highlight the entire row without using striped row styling.
**Validates: Requirements 3.2**

### Property 21: Counsel Table Structure
*For any* counsel management view, the table should display columns: Counsel Name, Mobile, Total Cases, Created By, Details Button.
**Validates: Requirements 7.1**

### Property 22: Counsel Form Fields
*For any* counsel creation form, all required fields should be present: Counsel Name, Email, Mobile, Address, Rich Text Details.
**Validates: Requirements 7.2**

### Property 23: Appointment Form Fields
*For any* appointment creation form, all required fields should be present: Date, Time, User, Client, Details.
**Validates: Requirements 8.1**

### Property 24: Finance Hero Banner Display
*For any* finance section view, a hero banner should display with gradient styling showing "Receivable client fees from juniors : ₹ [Amount]".
**Validates: Requirements 9.1**

### Property 25: Transaction Table Structure
*For any* transaction table displayed after clicking "Get Report", the table should have columns: Amount, Status (Green/Red Badge), Received By, Confirmed By, View Case.
**Validates: Requirements 9.3**

### Property 26: Theme Switcher Presence
*For any* settings page view, a theme switcher with animated toggle for Light/Dark mode should be present.
**Validates: Requirements 10.1**

### Property 27: Court Management Section
*For any* settings page view, a Court Management section should be present with "Add Court" input and a list of existing courts.
**Validates: Requirements 10.3**

### Property 28: Case Type Management Section
*For any* settings page view, a Case Type Management section should be present with "Add Case Type" input and a list of existing case types.
**Validates: Requirements 10.5**

### Property 29: Background Color Consistency
*For any* page in the application, the background should use deep charcoal (#121212) or dark slate (#1a1a1a) color.
**Validates: Requirements 11.1**

### Property 30: Primary Action Color Consistency
*For any* primary action button or element, the color should be electric magenta (#E040FB) with gradient effects (Magenta-to-Purple).
**Validates: Requirements 11.2**

### Property 31: Button Click Effects
*For any* button click, the system should display a ripple effect and transform animation.
**Validates: Requirements 11.5**

### Property 32: Page Transition Animation
*For any* page navigation, the system should animate the transition with smooth fade-in and slide-up effects.
**Validates: Requirements 11.6**

### Property 33: Font Consistency
*For any* text displayed in the application, the font should be 'Inter' or 'Manrope' for a clean, premium appearance.
**Validates: Requirements 11.7**

### Property 34: Responsive Layout Adaptation
*For any* viewport size (mobile, tablet, desktop), the application layout and styling should adapt appropriately.
**Validates: Requirements 11.8**

### Property 35: Data Consistency Across Views
*For any* action performed on a case (create, update, delete), the data should be consistent across all views and tabs.
**Validates: Requirements 12.4**

## Error Handling

### Authentication Errors
- Invalid credentials: Display "Invalid email or password" message
- Network error: Display "Unable to connect. Please check your connection" message
- Session expired: Redirect to login with "Your session has expired" message

### Form Validation Errors
- Required field missing: Display "This field is required" message
- Invalid email format: Display "Please enter a valid email address" message
- Invalid phone number: Display "Please enter a valid phone number" message
- Duplicate entry: Display "This entry already exists" message

### Data Operation Errors
- Create operation failed: Display "Failed to create record. Please try again" message
- Update operation failed: Display "Failed to update record. Please try again" message
- Delete operation failed: Display "Failed to delete record. Please try again" message
- Data fetch failed: Display "Failed to load data. Please try again" message

### UI/UX Error Handling
- Graceful degradation for missing images
- Fallback UI for failed component loads
- Loading states for async operations
- Empty state messages for no data scenarios

## Testing Strategy

### Unit Testing Approach
- Test individual components in isolation
- Test utility functions and services
- Test form validation logic
- Test data transformation functions
- Use React Testing Library for component testing
- Aim for 80%+ code coverage on critical paths

### Property-Based Testing Approach
- Use **fast-check** library for JavaScript/TypeScript property-based testing
- Configure each property test to run minimum 100 iterations
- Test universal properties that should hold across all inputs
- Generate random but valid test data using fast-check arbitraries
- Tag each property test with requirement references

### Test Organization
- Unit tests co-located with source files using `.test.ts` or `.test.tsx` suffix
- Property tests in dedicated `__tests__/properties` directory
- Test utilities and fixtures in `__tests__/utils` directory
- Mock data generators in `__tests__/mocks` directory

### Property-Based Testing Implementation
Each correctness property will be implemented as a single property-based test:
- Property 1: Case Creation Persistence - Test that created cases are retrievable with identical data
- Property 2: Case Status Badge Accuracy - Test that status badges display correct values and colors
- Property 3: Authentication State Consistency - Test that auth state persists across navigation
- Property 4: Tab Content Isolation - Test that tab switching displays correct content
- Property 5: Statistics Grid Animation Sequence - Test animation order and timing
- Property 6: Glassmorphism Styling Consistency - Test that all cards have required styling
- Property 7: Hover Effect Application - Test that hover effects apply correctly
- Property 8: Theme Persistence - Test that theme preference persists
- Property 9: Form Validation Completeness - Test that all validation rules are enforced
- Property 10: Case Table Data Accuracy - Test that table data matches source
- Property 11: Appointment List Ordering - Test that appointments are ordered correctly
- Property 12: Transaction Status Consistency - Test that status badges match transaction status

### Testing Best Practices
- Write tests before or alongside implementation (TDD approach)
- Test behavior, not implementation details
- Use descriptive test names that explain what is being tested
- Keep tests focused and independent
- Mock external dependencies (API calls, storage)
- Test both happy paths and error scenarios
- Ensure tests are deterministic and repeatable
