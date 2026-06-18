# Requirements Document

## Introduction

This document outlines the requirements for a comprehensive task notification system that alerts users when they are assigned tasks by administrators. The system will provide both popup notifications when users open the application and persistent notification indicators in the application header.

## Glossary

- **System**: The legal case management application
- **Admin**: A user with administrative privileges who can assign tasks to other users
- **User**: Any authenticated user in the system who can receive task assignments
- **Notification**: A message informing a user about a task assignment or update
- **Popup Notification**: A temporary overlay notification that appears when the user opens the application
- **Notification Bell**: A bell icon in the header that displays the count of unread notifications
- **Task Assignment**: The action of an admin assigning a task to a specific user
- **Notification Database**: The database table storing all notification records
- **Real-time Updates**: Immediate notification delivery using Supabase real-time subscriptions

## Requirements

### Requirement 1

**User Story:** As a user, I want to receive notifications when an admin assigns me a task, so that I am immediately aware of my new responsibilities.

#### Acceptance Criteria

1. WHEN an admin creates a task and assigns it to a user THEN the System SHALL automatically create a notification record in the Notification Database
2. WHEN a notification is created THEN the System SHALL include the task title, deadline, case information (if applicable), and the admin's name who assigned the task
3. WHEN a notification is created THEN the System SHALL set the priority level based on the task deadline (urgent if due today, high if due within 3 days, normal otherwise)
4. WHEN a notification is created THEN the System SHALL mark it as unread and not shown as popup
5. WHEN a notification is created THEN the System SHALL broadcast the notification via real-time subscription to the assigned user

### Requirement 2

**User Story:** As a user, I want to see a popup notification when I open the application, so that I immediately notice new task assignments without having to check manually.

#### Acceptance Criteria

1. WHEN a user logs into the application THEN the System SHALL query for all unread notifications that have not been shown as popups
2. WHEN popup notifications are found THEN the System SHALL display them one at a time in the top-right corner of the screen
3. WHEN a popup notification is displayed THEN the System SHALL show the task title, message, assigned by name, priority badge, and creation time
4. WHEN a popup notification is displayed THEN the System SHALL automatically mark it as "popup shown" in the Notification Database
5. WHEN a popup notification is displayed THEN the System SHALL auto-dismiss after 8 seconds or when the user clicks the close button
6. WHEN a user clicks on a popup notification THEN the System SHALL navigate to the relevant page (tasks page or case details) and mark the notification as read
7. WHEN multiple popup notifications exist THEN the System SHALL display them sequentially with a slight vertical offset

### Requirement 3

**User Story:** As a user, I want to see a notification bell icon with an unread count in the header, so that I can quickly see how many unread notifications I have at any time.

#### Acceptance Criteria

1. WHEN a user is logged in THEN the System SHALL display a bell icon in the application header
2. WHEN the user has unread notifications THEN the System SHALL display a red badge with the count of unread notifications on the bell icon
3. WHEN the unread count exceeds 99 THEN the System SHALL display "99+" in the badge
4. WHEN a new notification is created via real-time subscription THEN the System SHALL immediately update the unread count without requiring a page refresh
5. WHEN a notification is marked as read THEN the System SHALL immediately decrement the unread count

### Requirement 4

**User Story:** As a user, I want to click the notification bell to see a dropdown list of my notifications, so that I can review all my notifications in one place.

#### Acceptance Criteria

1. WHEN a user clicks the notification bell THEN the System SHALL display a dropdown panel showing up to 50 recent notifications
2. WHEN the notification dropdown is displayed THEN the System SHALL show each notification with its icon, title, message, priority, assigned by name, and time ago
3. WHEN the notification dropdown is displayed THEN the System SHALL visually distinguish unread notifications with a blue dot and highlighted background
4. WHEN the notification dropdown contains unread notifications THEN the System SHALL display a "Mark all as read" button in the header
5. WHEN a user clicks "Mark all as read" THEN the System SHALL mark all notifications as read and update the unread count to zero
6. WHEN a user clicks on a notification in the dropdown THEN the System SHALL mark it as read, navigate to the relevant page, and close the dropdown
7. WHEN the notification dropdown is empty THEN the System SHALL display a friendly empty state message
8. WHEN a user clicks outside the dropdown THEN the System SHALL close the dropdown panel

### Requirement 5

**User Story:** As a user, I want to access a dedicated notifications page, so that I can view, filter, and manage all my notifications in detail.

#### Acceptance Criteria

1. WHEN a user navigates to the notifications page THEN the System SHALL display all notifications for that user
2. WHEN the notifications page is displayed THEN the System SHALL provide filters for read status (all, unread, read)
3. WHEN the notifications page is displayed THEN the System SHALL provide filters for notification type (all, task assigned, task completed, task overdue, general)
4. WHEN the notifications page is displayed THEN the System SHALL provide a search box to filter notifications by title, message, or assigned by name
5. WHEN a user applies filters or search THEN the System SHALL update the notification list in real-time without page refresh
6. WHEN a user clicks on a notification THEN the System SHALL mark it as read and navigate to the relevant page
7. WHEN the notifications page displays notifications THEN the System SHALL show priority badges, notification icons, and formatted timestamps

### Requirement 6

**User Story:** As a user, I want notifications to be marked as read automatically when I interact with them, so that I don't have to manually manage my notification status.

#### Acceptance Criteria

1. WHEN a user clicks on a notification in the dropdown THEN the System SHALL mark that notification as read
2. WHEN a user clicks on a notification in the notifications page THEN the System SHALL mark that notification as read
3. WHEN a user clicks on a popup notification THEN the System SHALL mark that notification as read
4. WHEN a notification is marked as read THEN the System SHALL record the read timestamp
5. WHEN a notification is marked as read THEN the System SHALL update the local state immediately without requiring a page refresh

### Requirement 7

**User Story:** As a user, I want to receive real-time notifications without refreshing the page, so that I am always up-to-date with new task assignments.

#### Acceptance Criteria

1. WHEN a user is logged into the application THEN the System SHALL establish a real-time subscription to the notifications table filtered by the user's ID
2. WHEN a new notification is inserted into the Notification Database for the user THEN the System SHALL receive the notification via the real-time subscription
3. WHEN a real-time notification is received THEN the System SHALL add it to the notifications list in the UI
4. WHEN a real-time notification is received THEN the System SHALL increment the unread count
5. WHEN a real-time notification is received and the user is on the notifications page THEN the System SHALL display it immediately in the list
6. WHEN a user logs out THEN the System SHALL unsubscribe from the real-time notifications channel

### Requirement 8

**User Story:** As an admin, I want the notification system to work automatically when I assign tasks, so that I don't have to manually notify users.

#### Acceptance Criteria

1. WHEN an admin creates a task with an assigned user THEN the System SHALL automatically trigger the notification creation function via database trigger
2. WHEN the notification trigger executes THEN the System SHALL extract the task details, case information, and admin information
3. WHEN the notification trigger executes THEN the System SHALL call the create_notification database function with all required parameters
4. WHEN the notification is created THEN the System SHALL not require any manual intervention from the admin
5. WHEN the notification creation fails THEN the System SHALL log the error but not prevent the task from being created

### Requirement 9

**User Story:** As a system administrator, I want old notifications to be automatically cleaned up, so that the database doesn't grow indefinitely.

#### Acceptance Criteria

1. WHEN a notification is created THEN the System SHALL set an expiration date of 30 days from creation
2. WHEN the cleanup function is executed THEN the System SHALL delete all notifications that have expired
3. WHEN the cleanup function is executed THEN the System SHALL delete all notifications older than 90 days regardless of expiration date
4. WHEN notifications are deleted THEN the System SHALL return the count of deleted notifications
5. WHEN notifications are deleted THEN the System SHALL not affect active or recent notifications

### Requirement 10

**User Story:** As a user, I want notifications to have appropriate priority levels and visual indicators, so that I can quickly identify urgent tasks.

#### Acceptance Criteria

1. WHEN a task has a deadline of today or earlier THEN the System SHALL set the notification priority to "urgent"
2. WHEN a task has a deadline within 3 days THEN the System SHALL set the notification priority to "high"
3. WHEN a task has a deadline beyond 3 days THEN the System SHALL set the notification priority to "normal"
4. WHEN a notification has "urgent" priority THEN the System SHALL display it with a red color scheme and alert triangle icon
5. WHEN a notification has "high" priority THEN the System SHALL display it with an orange color scheme and clock icon
6. WHEN a notification has "normal" priority THEN the System SHALL display it with a blue color scheme
7. WHEN a notification has "low" priority THEN the System SHALL display it with a gray color scheme

### Requirement 11

**User Story:** As a developer, I want the notification system to be properly integrated with the existing application architecture, so that it works seamlessly with authentication, routing, and state management.

#### Acceptance Criteria

1. WHEN the application initializes THEN the System SHALL wrap the app with the NotificationProvider context
2. WHEN a user logs in THEN the System SHALL initialize the notification context with the user's ID
3. WHEN a user logs out THEN the System SHALL clear all notification state and unsubscribe from real-time updates
4. WHEN the Header component renders THEN the System SHALL include the NotificationBell component
5. WHEN the App component renders THEN the System SHALL include the NotificationPopupContainer component
6. WHEN the routing is configured THEN the System SHALL include a route to the NotificationsPage component
7. WHEN any component needs notification functionality THEN the System SHALL access it via the useNotifications hook
