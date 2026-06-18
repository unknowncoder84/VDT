# Requirements Document: PRK's Office - Legal Case Management Dashboard

## Introduction

PRK's Office is a premium legal case management dashboard designed for law firms to manage cases, counsel, appointments, and finances. The system provides a "Classy yet Stylish" interface using modern UI trends including glassmorphism, smooth animations, and refined typography. The application must be functionally identical to provided screenshots while delivering a visually elevated SaaS-quality experience with a dark, sophisticated aesthetic.

## Glossary

- **Dashboard**: The main command center displaying welcome message, statistics grid, and key widgets
- **Case**: A legal matter with associated client information, parties, court details, and status tracking
- **Counsel**: A lawyer or legal professional managed within the system
- **Appointment**: A scheduled meeting with date, time, user, client, and details
- **Glassmorphism**: A UI design trend using semi-transparent surfaces with backdrop blur effects
- **Badge**: A small labeled component displaying status information with color coding
- **Stagger Animation**: Sequential animation of multiple elements with slight delays between each
- **Case Status**: The current state of a case (e.g., Pending, Active, Closed, On Hold)
- **Interim Relief (IR)**: Temporary court orders or relief granted during case proceedings
- **Circulation**: The process of sharing case documents among relevant parties
- **Transaction**: A financial record of fees received or payments made

## Requirements

### Requirement 1: Authentication and Access Control

**User Story:** As a user, I want to securely log into the system, so that I can access my legal case management dashboard.

#### Acceptance Criteria

1. WHEN a user navigates to the login page THEN the system SHALL display a full-screen cinematic background image (Golden Gate Bridge) with a dark overlay
2. WHEN the login page is displayed THEN the system SHALL show a centered glassmorphism card containing email/password input fields and a gradient blue "Log in" button
3. WHEN a user enters valid credentials and clicks the login button THEN the system SHALL authenticate the user and redirect to the dashboard
4. WHEN a user enters invalid credentials THEN the system SHALL display an error message and maintain the login form state
5. WHEN a user is not authenticated THEN the system SHALL prevent access to protected routes and redirect to the login page

### Requirement 2: Dashboard Welcome and Statistics

**User Story:** As a case manager, I want to see a personalized welcome message and key statistics at a glance, so that I can quickly understand the current state of my caseload.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the system SHALL display a welcome message with the format "Welcome, [User]" with a subtle gradient text effect
2. WHEN the dashboard loads THEN the system SHALL display a statistics grid with six animated cards showing: My Cases (Purple), Pending Tasks (Blue), IR Favor (Green), IR Against (Red), Non-Circulated (Cyan), Circulated (Pink)
3. WHEN the statistics grid is displayed THEN the system SHALL animate each card with a stagger effect, with each card appearing sequentially with a slight delay
4. WHEN a user views the dashboard THEN the system SHALL display a statistics table showing counts for Consultation, Drafting, Filing, and other case stages
5. WHEN a user views the dashboard THEN the system SHALL display an interactive calendar widget with the current date highlighted in Amber color

### Requirement 3: Case Management - My Cases View

**User Story:** As a case manager, I want to view and manage my assigned cases, so that I can track case progress and take necessary actions.

#### Acceptance Criteria

1. WHEN a user navigates to the "My Cases" tab THEN the system SHALL display a table with columns: SR, Client Name, File No, Next Date, Stamp No, Reg No, Status (Badge), Case Type, Parties, Actions
2. WHEN a user views the cases table THEN the system SHALL highlight the entire row on hover instead of using striped row styling
3. WHEN a user views case status THEN the system SHALL display status as a color-coded badge (e.g., Active, Pending, Closed, On Hold)
4. WHEN a user clicks the Actions button for a case THEN the system SHALL provide options to view details, edit, or delete the case
5. WHEN a user views the table THEN the system SHALL pre-populate with specific case data including names like "Sanjay durgadas gaware" and accurate case numbers

### Requirement 4: Case Management - All Cases and Office Cases Views

**User Story:** As a case manager, I want to view all cases and filter by office, so that I can access the complete case inventory and manage office-specific cases.

#### Acceptance Criteria

1. WHEN a user navigates to the "All Cases" tab THEN the system SHALL display all cases in the system with the same table structure as "My Cases"
2. WHEN a user navigates to the "Office Cases" tab THEN the system SHALL display only cases assigned to the current office
3. WHEN a user switches between case view tabs THEN the system SHALL animate the transition with a smooth fade-in and slide-up effect
4. WHEN a user views any cases table THEN the system SHALL maintain consistent column ordering and styling across all views

### Requirement 5: Create Case Form

**User Story:** As a case manager, I want to create new cases with comprehensive information, so that I can properly document and track legal matters.

#### Acceptance Criteria

1. WHEN a user clicks "Create Office Case" THEN the system SHALL display a multi-row grid form with all required fields organized by section
2. WHEN the create case form is displayed THEN the system SHALL include Client Info section with fields: Client Name, Email, Mobile, Alternate No
3. WHEN the create case form is displayed THEN the system SHALL include Case Info section with fields: Parties Name, District, Case Type, Court, On Behalf Of, No Resp
4. WHEN the create case form is displayed THEN the system SHALL include Legal Details section with fields: Office File No, Stamp No, Registration No, Fees Quoted
5. WHEN the create case form is displayed THEN the system SHALL include Opposition section with field: Opponent Lawyer
6. WHEN the create case form is displayed THEN the system SHALL include a rich text editor for "Additional Details" field
7. WHEN a user submits the create case form with all required fields THEN the system SHALL create a new case and display a success message
8. WHEN a user submits the form with missing required fields THEN the system SHALL display validation errors and prevent submission

### Requirement 6: Case Details View

**User Story:** As a case manager, I want to view detailed information about a specific case, so that I can access all relevant case information and manage case-related activities.

#### Acceptance Criteria

1. WHEN a user clicks on a case THEN the system SHALL display a case details view with a header showing the case title and an edit button
2. WHEN the case details view is displayed THEN the system SHALL show animated tabs with underline indicators for: Basic Details, Files, Interim Relief, Circulation, Payments, Tasks, Timeline
3. WHEN a user clicks a tab THEN the system SHALL animate the tab underline to the selected tab and display the corresponding content
4. WHEN the Basic Details tab is active THEN the system SHALL display a card with client info, status, and district information
5. WHEN the case details view is displayed THEN the system SHALL show an Important Details card displaying circulation status, next date, and filing date
6. WHEN a user clicks the edit button THEN the system SHALL allow modification of case information

### Requirement 7: Counsel Management

**User Story:** As a case manager, I want to manage counsel information, so that I can maintain an accurate directory of lawyers and legal professionals.

#### Acceptance Criteria

1. WHEN a user navigates to the Counsel Management section THEN the system SHALL display a table with columns: Counsel Name, Mobile, Total Cases, Created By, Details Button
2. WHEN a user clicks "Create Counsel" THEN the system SHALL display a form with fields: Counsel Name, Email, Mobile, Address, Rich Text Details
3. WHEN a user submits the counsel form with all required fields THEN the system SHALL create a new counsel record and display a success message
4. WHEN a user clicks the Details button for a counsel THEN the system SHALL display the counsel's full information and case history

### Requirement 8: Appointments Management

**User Story:** As a case manager, I want to schedule and view appointments, so that I can manage meetings with clients and other stakeholders.

#### Acceptance Criteria

1. WHEN a user navigates to the Appointments section THEN the system SHALL display an input section with fields: Date, Time, User, Client, Details
2. WHEN a user submits the appointment form with all required fields THEN the system SHALL create a new appointment and display it in the "Upcoming Appointments" list
3. WHEN a user views the appointments section THEN the system SHALL display an "Upcoming Appointments" card below the form showing scheduled appointments
4. WHEN a user views an appointment THEN the system SHALL display the appointment date, time, user, client, and details

### Requirement 9: Finance and Payments Management

**User Story:** As a finance manager, I want to track receivable fees and manage payments, so that I can monitor financial status and generate payment reports.

#### Acceptance Criteria

1. WHEN a user navigates to the Finance section THEN the system SHALL display a hero banner with gradient styling showing "Receivable client fees from juniors : ₹ [Amount]"
2. WHEN the Finance section is displayed THEN the system SHALL provide a date range picker and "Get Report" button for filtering transactions
3. WHEN a user clicks "Get Report" THEN the system SHALL display a transaction table with columns: Amount, Status (Green/Red Badge), Received By, Confirmed By, View Case
4. WHEN a user views a transaction THEN the system SHALL display the transaction amount, status, and associated case information
5. WHEN a user clicks "View Case" on a transaction THEN the system SHALL navigate to the associated case details view

### Requirement 10: Settings and Administration

**User Story:** As an administrator, I want to manage system settings and configurations, so that I can customize the application for my organization.

#### Acceptance Criteria

1. WHEN a user navigates to Settings THEN the system SHALL display a theme switcher with an animated toggle for Light/Dark mode
2. WHEN a user toggles the theme THEN the system SHALL immediately switch the application theme and persist the preference
3. WHEN a user navigates to Settings THEN the system SHALL display a Court Management section with "Add Court" input and a list of existing courts
4. WHEN a user enters a court name and submits THEN the system SHALL add the court to the list and display a success message
5. WHEN a user navigates to Settings THEN the system SHALL display a Case Type Management section with "Add Case Type" input and a list of existing case types
6. WHEN a user enters a case type and submits THEN the system SHALL add the case type to the list and display a success message

### Requirement 11: Visual Design and Animations

**User Story:** As a user, I want a visually premium and responsive interface, so that I can enjoy a modern, professional experience while managing cases.

#### Acceptance Criteria

1. WHEN the application loads THEN the system SHALL use a deep charcoal (#121212) or dark slate (#1a1a1a) background color throughout
2. WHEN interactive elements are displayed THEN the system SHALL use electric magenta (#E040FB) for primary actions with gradient effects (Magenta-to-Purple)
3. WHEN cards and sidebars are displayed THEN the system SHALL apply glassmorphism styling with semi-transparent dark gray, backdrop blur, and subtle white/10 borders
4. WHEN a user hovers over a card THEN the system SHALL apply a slight lift effect (scale-105) and glow effect
5. WHEN a user clicks a button THEN the system SHALL display a ripple effect and transform animation
6. WHEN a user navigates between pages THEN the system SHALL animate the transition with smooth fade-in and slide-up effects
7. WHEN the application is displayed THEN the system SHALL use 'Inter' or 'Manrope' font for a clean, premium appearance
8. WHEN the application is responsive THEN the system SHALL adapt layout and styling for mobile, tablet, and desktop viewports

### Requirement 12: Data Persistence and Accuracy

**User Story:** As a case manager, I want accurate and persistent data, so that I can rely on the system for critical case information.

#### Acceptance Criteria

1. WHEN a user creates or modifies a case THEN the system SHALL persist the data to storage immediately
2. WHEN a user navigates away and returns to a view THEN the system SHALL display the previously entered or created data
3. WHEN the application displays case data THEN the system SHALL show accurate information including specific names and case numbers from the source data
4. WHEN a user performs an action THEN the system SHALL maintain data consistency across all views and tabs
