# Requirements Document

## Introduction

This document outlines the requirements for enhancing the legal case management dashboard with improved payment mode visualization, accurate case statistics, proper iconography, case navigation, and a real-time notification system for tracking user and admin activities.

## Glossary

- **Dashboard**: The main landing page displaying case statistics and overview information
- **Payment Mode**: The method used for financial transactions (UPI, Cash, Check, Bank Transfer, Card, Other)
- **Case Statistics**: Numerical counts of cases grouped by their current stage in the legal process
- **Case Stage**: The current status of a case in the legal workflow (Consultation, Drafting, Filing, Circulation, Notice, Pre Admission, Admitted, Final Hearing, Reserved For Judgement, Disposed)
- **Notification System**: A real-time alert mechanism that informs users and admins of changes made to cases, appointments, and other entities
- **Activity Log**: A record of all changes made by users and admins with timestamps and user information

## Requirements

### Requirement 1

**User Story:** As a user, I want to see payment modes displayed with clear visual buttons and icons, so that I can quickly identify the payment method used for each transaction.

#### Acceptance Criteria

1. WHEN displaying a transaction THEN the system SHALL show the payment mode as a styled button with an appropriate icon
2. WHEN a payment mode is UPI THEN the system SHALL display a smartphone icon with the button
3. WHEN a payment mode is Cash THEN the system SHALL display a banknote icon with the button
4. WHEN a payment mode is Check THEN the system SHALL display a check/receipt icon with the button
5. WHEN a payment mode is Bank Transfer THEN the system SHALL display a building/bank icon with the button
6. WHEN a payment mode is Card THEN the system SHALL display a credit card icon with the button
7. WHEN a payment mode is Other THEN the system SHALL display a generic payment icon with the button
8. WHEN displaying payment mode buttons THEN the system SHALL use distinct colors for each payment type

### Requirement 2

**User Story:** As a user, I want the dashboard case statistics to reflect actual case counts based on real case stages, so that I can see accurate information about my caseload.

#### Acceptance Criteria

1. WHEN displaying the Consultation statistic THEN the system SHALL count all cases where the stage field equals "consultation"
2. WHEN displaying the Drafting statistic THEN the system SHALL count all cases where the stage field equals "drafting"
3. WHEN displaying the Filing statistic THEN the system SHALL count all cases where the stage field equals "filing"
4. WHEN displaying the Circulation statistic THEN the system SHALL count all cases where the stage field equals "circulation"
5. WHEN displaying the Notice statistic THEN the system SHALL count all cases where the stage field equals "notice"
6. WHEN displaying the Pre Admission statistic THEN the system SHALL count all cases where the stage field equals "pre-admission"
7. WHEN displaying the Admitted statistic THEN the system SHALL count all cases where the stage field equals "admitted"
8. WHEN displaying the Final Hearing statistic THEN the system SHALL count all cases where the stage field equals "final-hearing"
9. WHEN displaying the Reserved For Judgement statistic THEN the system SHALL count all cases where the stage field equals "reserved"
10. WHEN displaying the Disposed statistic THEN the system SHALL count all cases where the stage field equals "disposed"
11. WHEN calculating Total Cases THEN the system SHALL sum all cases regardless of stage
12. WHEN no cases exist for a stage THEN the system SHALL display zero as the count

### Requirement 3

**User Story:** As a user, I want to click on a case in the cases list and be taken to its detailed view, so that I can quickly access full case information.

#### Acceptance Criteria

1. WHEN a user clicks on a case row in the cases table THEN the system SHALL navigate to the case details page
2. WHEN a user clicks on a case card in mobile view THEN the system SHALL navigate to the case details page
3. WHEN navigating to case details THEN the system SHALL preserve the case ID in the URL
4. WHEN the case details page loads THEN the system SHALL display all case information including client details, dates, parties, and status

### Requirement 4

**User Story:** As a user or admin, I want to receive notifications when any user or admin makes changes to cases, appointments, or other entities, so that I stay informed about important updates.

#### Acceptance Criteria

1. WHEN a user creates a new case THEN the system SHALL generate a notification for all admins
2. WHEN a user updates a case THEN the system SHALL generate a notification for all admins and the case creator
3. WHEN an admin updates a case THEN the system SHALL generate a notification for the case creator
4. WHEN a user creates an appointment THEN the system SHALL generate a notification for all admins
5. WHEN a user updates an appointment THEN the system SHALL generate a notification for all admins and the appointment creator
6. WHEN a user adds a transaction THEN the system SHALL generate a notification for all admins
7. WHEN a notification is generated THEN the system SHALL include the action type, entity name, user who performed the action, and timestamp
8. WHEN a user views the notification panel THEN the system SHALL display all unread notifications with visual indicators
9. WHEN a user clicks on a notification THEN the system SHALL mark it as read and navigate to the relevant entity
10. WHEN displaying notifications THEN the system SHALL show the most recent notifications first
11. WHEN a notification is unread THEN the system SHALL display a badge count in the header
12. WHEN a user has no unread notifications THEN the system SHALL hide the notification badge

### Requirement 5

**User Story:** As a developer, I want the Case type to include a stage field, so that cases can be properly categorized by their current legal process stage.

#### Acceptance Criteria

1. WHEN defining the Case type THEN the system SHALL include a stage field with allowed values
2. WHEN a case is created THEN the system SHALL require a stage value to be set
3. WHEN a case stage is updated THEN the system SHALL validate the new stage value against allowed values
4. THE allowed stage values SHALL include: consultation, drafting, filing, circulation, notice, pre-admission, admitted, final-hearing, reserved, disposed
