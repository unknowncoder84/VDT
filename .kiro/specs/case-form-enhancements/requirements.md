# Requirements Document

## Introduction

This feature enhances the case management system with improved form fields, automatic case status updates based on filing dates, dynamic fee tracking, and streamlined circulation management. The changes include adding "On Behalf Of" dropdown options, NOC button in case status, renaming circulation fields to "Grant Date", automatic case status transitions, and dynamic fee tracking that reflects across all pages.

## Glossary

- **Case Management System**: The application module for managing legal cases
- **On Behalf Of**: Field indicating which party the lawyer represents (Petitioner, Applicant, Appellant, Respondent, Intervenor)
- **NOC**: No Objection Certificate - a case status indicating no objection has been filed
- **Grant Date**: The date when circulation is granted (renamed from Circulation Date)
- **Filing Date**: The date when a case is officially filed with the court
- **Non-Circulated**: Status indicating a case has not yet been circulated
- **Fees Quoted**: The total fee amount quoted for a case
- **Fees Paid**: The total amount received from the client
- **Dynamic Fee Tracking**: Real-time synchronization of fee data across all pages

## Requirements

### Requirement 1

**User Story:** As a legal professional, I want to select the party I represent from a dropdown, so that I can quickly specify my client's role in the case.

#### Acceptance Criteria

1. WHEN a user creates a new case THEN the Case Management System SHALL display an "On Behalf Of" dropdown with options: Petitioner, Applicant, Appellant, Respondent, and Intervenor
2. WHEN a user selects an option from the "On Behalf Of" dropdown THEN the Case Management System SHALL store the selected value with the case record
3. WHEN a user views case details THEN the Case Management System SHALL display the selected "On Behalf Of" value

### Requirement 2

**User Story:** As a legal professional, I want to set a case status to NOC, so that I can track cases where no objection has been filed.

#### Acceptance Criteria

1. WHEN a user views the case status dropdown in case details THEN the Case Management System SHALL include "NOC" as an available status option
2. WHEN a user selects "NOC" as the case status THEN the Case Management System SHALL update and persist the case status to NOC
3. WHEN a case has NOC status THEN the Case Management System SHALL display the NOC status consistently across all case views

### Requirement 3

**User Story:** As a legal professional, I want the circulation section to show Grant Date instead of Circulation Date, so that the terminology matches legal workflow.

#### Acceptance Criteria

1. WHEN a user views the circulation tab THEN the Case Management System SHALL display "Grant Date" label instead of "Circulation Date"
2. WHEN a user enters a grant date THEN the Case Management System SHALL store and persist the grant date value
3. WHEN a grant date is set THEN the Case Management System SHALL retain the grant date until manually changed by the user

### Requirement 4

**User Story:** As a legal professional, I want cases to automatically move to non-circulated status when the filing date passes, so that case status stays current without manual updates.

#### Acceptance Criteria

1. WHEN the current date exceeds a case's filing date THEN the Case Management System SHALL automatically set the circulation status to "non-circulated"
2. WHEN a case is loaded and the filing date has passed THEN the Case Management System SHALL check and update the circulation status accordingly
3. WHEN the circulation status is automatically updated THEN the Case Management System SHALL persist the change to the database

### Requirement 5

**User Story:** As a legal professional, I want to create cases without specifying payment mode, so that I can focus on case details first and handle payments separately.

#### Acceptance Criteria

1. WHEN a user creates a new case THEN the Case Management System SHALL NOT display the payment mode field in the create case form
2. WHEN a case is created without payment mode THEN the Case Management System SHALL successfully save the case record

### Requirement 6

**User Story:** As a legal professional, I want fees quoted to be displayed and reflected everywhere when entered, so that I can track financial information consistently.

#### Acceptance Criteria

1. WHEN a user enters fees quoted during case creation THEN the Case Management System SHALL display the amount in the case details
2. WHEN fees quoted is updated THEN the Case Management System SHALL reflect the updated amount on the Finance page
3. WHEN fees quoted exists for a case THEN the Case Management System SHALL include the amount in total fees calculations across all relevant pages

### Requirement 7

**User Story:** As a legal professional, I want payments received to be tracked dynamically and reflected everywhere, so that I can see accurate financial status at all times.

#### Acceptance Criteria

1. WHEN a payment is received for a case THEN the Case Management System SHALL update the fees paid amount immediately
2. WHEN a payment is recorded THEN the Case Management System SHALL reflect the payment on the Finance page in real-time
3. WHEN payments are updated THEN the Case Management System SHALL recalculate and display the pending amount (fees quoted minus fees paid)
4. WHEN a payment is accepted by admin THEN the Case Management System SHALL persist the payment and update all related financial displays
