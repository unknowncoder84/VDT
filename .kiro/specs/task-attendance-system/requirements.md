# Requirements Document

## Introduction

This document outlines the requirements for a Task Management and Attendance System for the Katneshwarkar Legal Case Management application. The system will allow administrators to assign tasks to users, track task completion, and manage user attendance with calendar visualization.

## Glossary

- **System**: The Katneshwarkar Legal Case Management Application
- **Admin**: User with administrative privileges who can assign tasks and mark attendance
- **User**: Regular user who can view and complete assigned tasks and view attendance
- **Task**: A work item assigned to a user with a deadline and status
- **Attendance**: Daily presence record for users (Present/Absent)

## Requirements

### Requirement 1

**User Story:** As an admin, I want to create and assign tasks to users with two types (Case and Custom), so that I can manage both case-related and general work.

#### Acceptance Criteria

1. WHEN an admin accesses the task management page THEN the system SHALL display a "Create Task" button
2. WHEN an admin creates a task THEN the system SHALL require task type selection (Case or Custom)
3. WHEN an admin selects "Case" type THEN the system SHALL require case selection, task title, description, assignee, and deadline
4. WHEN an admin selects "Custom" type THEN the system SHALL require task title, description, assignee, and deadline
5. WHEN an admin assigns a task THEN the system SHALL allow assignment to any user including themselves
6. WHEN a task is created THEN the system SHALL set the initial status to "pending"
7. WHEN a task is assigned THEN the system SHALL immediately display it in the task list

### Requirement 2

**User Story:** As a user, I want to view my assigned tasks, so that I know what work I need to complete.

#### Acceptance Criteria

1. WHEN a user accesses the task page THEN the system SHALL display all tasks assigned to them
2. WHEN displaying tasks THEN the system SHALL show task title, description, deadline, and status
3. WHEN a user views tasks THEN the system SHALL filter to show "My Tasks", "Pending Tasks", "Completed Tasks", and "All Tasks"
4. WHEN a user opens the app THEN the system SHALL display a notification badge showing pending task count
5. WHEN a user has no tasks THEN the system SHALL display a message indicating no tasks are assigned

### Requirement 3

**User Story:** As a user, I want to mark tasks as complete, so that I can track my progress and notify the admin.

#### Acceptance Criteria

1. WHEN a user completes a task THEN the system SHALL provide a "Mark Complete" button
2. WHEN a user marks a task complete THEN the system SHALL update the task status to "completed"
3. WHEN a task is marked complete THEN the system SHALL record the completion date and time
4. WHEN a task status changes THEN the system SHALL update the UI immediately
5. WHEN a user marks a task complete THEN the system SHALL notify the admin

### Requirement 4

**User Story:** As an admin, I want to mark daily attendance for users, so that I can track presence and absence.

#### Acceptance Criteria

1. WHEN an admin accesses the attendance page THEN the system SHALL display a list of all users
2. WHEN an admin selects a date THEN the system SHALL allow marking each user as Present or Absent
3. WHEN an admin marks attendance THEN the system SHALL save the record with the selected date
4. WHEN attendance is marked THEN the system SHALL update the UI immediately
5. WHEN an admin views attendance THEN the system SHALL display the current date by default

### Requirement 5

**User Story:** As a user, I want to view attendance records in a calendar format, so that I can see my attendance history.

#### Acceptance Criteria

1. WHEN a user clicks on a username in attendance THEN the system SHALL display a calendar view
2. WHEN displaying the calendar THEN the system SHALL color Present days as green
3. WHEN displaying the calendar THEN the system SHALL color Absent days as red
4. WHEN displaying the calendar THEN the system SHALL show unmarked days as default color
5. WHEN a user views the calendar THEN the system SHALL display the current month by default

### Requirement 6

**User Story:** As a user, I want to view task details for any user, so that I can see team workload and progress.

#### Acceptance Criteria

1. WHEN a user clicks on a username in tasks THEN the system SHALL display all tasks assigned to that user
2. WHEN displaying user tasks THEN the system SHALL show task title, status, and deadline
3. WHEN viewing other users' tasks THEN the system SHALL not allow modification
4. WHEN displaying tasks THEN the system SHALL group by status (pending, completed)
5. WHEN a user has no tasks THEN the system SHALL display an appropriate message

### Requirement 7

**User Story:** As a user, I want to access tasks through a dedicated Tasks page in the navigation, so that I can easily manage my work.

#### Acceptance Criteria

1. WHEN a user views the sidebar navigation THEN the system SHALL display a "Tasks" menu item
2. WHEN a user clicks the Tasks menu item THEN the system SHALL navigate to the tasks page
3. WHEN the tasks page loads THEN the system SHALL display all relevant tasks based on user role
4. WHEN displaying the tasks page THEN the system SHALL show task statistics at the top
5. WHEN a user is on the tasks page THEN the system SHALL highlight the Tasks menu item as active

### Requirement 8

**User Story:** As a user, I want to receive notifications for new tasks, so that I am immediately aware of new assignments.

#### Acceptance Criteria

1. WHEN a task is assigned to a user THEN the system SHALL display a notification badge
2. WHEN a user opens the app THEN the system SHALL show the count of unread task notifications
3. WHEN a user views their tasks THEN the system SHALL mark notifications as read
4. WHEN displaying notifications THEN the system SHALL show the most recent tasks first
5. WHEN a user has no new tasks THEN the system SHALL not display a notification badge

### Requirement 9

**User Story:** As an admin, I want to edit and delete tasks, so that I can manage task assignments effectively.

#### Acceptance Criteria

1. WHEN an admin views a task THEN the system SHALL display Edit and Delete buttons
2. WHEN an admin edits a task THEN the system SHALL allow modification of all task fields
3. WHEN an admin deletes a task THEN the system SHALL show a confirmation dialog
4. WHEN a task is deleted THEN the system SHALL remove it from all views immediately
5. WHEN a task is edited THEN the system SHALL update the modified date

### Requirement 10

**User Story:** As a user, I want to filter tasks by type (Case or Custom), so that I can focus on specific work categories.

#### Acceptance Criteria

1. WHEN a user views the tasks page THEN the system SHALL display filter options for task type
2. WHEN a user selects "Case Tasks" filter THEN the system SHALL display only case-related tasks
3. WHEN a user selects "Custom Tasks" filter THEN the system SHALL display only custom tasks
4. WHEN a user selects "All Tasks" filter THEN the system SHALL display both task types
5. WHEN displaying case tasks THEN the system SHALL show the associated case information

### Requirement 11

**User Story:** As a user, I want to view attendance statistics, so that I can track my presence record.

#### Acceptance Criteria

1. WHEN a user views attendance THEN the system SHALL display total present days count
2. WHEN a user views attendance THEN the system SHALL display total absent days count
3. WHEN a user views attendance THEN the system SHALL display attendance percentage
4. WHEN displaying statistics THEN the system SHALL calculate for the current month by default
5. WHEN a user selects a date range THEN the system SHALL recalculate statistics for that period
