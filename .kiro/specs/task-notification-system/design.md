# Design Document

## Overview

The task notification system provides real-time notifications to users when admins assign them tasks. The system consists of a database layer with automatic triggers, a notification management library, React context for state management, UI components for displaying notifications, and real-time subscriptions for instant updates.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              NotificationProvider (Context)             │ │
│  │  - Manages notification state                          │ │
│  │  - Handles real-time subscriptions                     │ │
│  │  - Provides notification operations                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                 │
│  ┌─────────────────┬──────┴──────┬────────────────────────┐ │
│  │                 │             │                        │ │
│  │  NotificationBell  NotificationPopup  NotificationsPage│ │
│  │  (Header)          (Overlay)          (Full Page)      │ │
│  └─────────────────┴─────────────┴────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Notification Management Library                 │
│  - getUserNotifications()                                    │
│  - getUnreadNotificationCount()                             │
│  - markNotificationRead()                                   │
│  - getPopupNotifications()                                  │
│  - subscribeToNotifications()                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  notifications table                                    │ │
│  │  - id, user_id, type, title, message                   │ │
│  │  - task_id, case_id, priority                          │ │
│  │  - is_read, is_popup_shown                             │ │
│  │  - created_at, read_at, expires_at                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                 │
│  ┌────────────────────────▼──────────────────────────────┐ │
│  │  Database Trigger: create_task_notification()         │ │
│  │  - Fires on task INSERT                               │ │
│  │  - Automatically creates notification                 │ │
│  │  - Calculates priority based on deadline             │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                 │
│  ┌────────────────────────▼──────────────────────────────┐ │
│  │  Real-time Subscription Channel                       │ │
│  │  - Broadcasts new notifications to connected clients  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Database Layer

#### Notifications Table Schema

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  task_id UUID,
  case_id UUID,
  assigned_by UUID,
  assigned_by_name VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  is_popup_shown BOOLEAN DEFAULT FALSE,
  priority VARCHAR(20) DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);
```

#### Database Functions

1. **create_notification()** - Creates a new notification record
2. **get_user_notifications()** - Retrieves notifications for a user with filtering
3. **get_unread_notification_count()** - Returns count of unread notifications
4. **mark_notification_read()** - Marks a notification as read
5. **mark_all_notifications_read()** - Marks all user notifications as read
6. **get_popup_notifications()** - Gets unread notifications not yet shown as popups
7. **mark_popup_shown()** - Marks a notification as shown in popup
8. **cleanup_old_notifications()** - Deletes expired notifications

#### Database Trigger

```sql
CREATE TRIGGER trigger_create_task_notification
  AFTER INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION create_task_notification();
```

This trigger automatically creates a notification when a task is inserted.

### 2. Notification Management Library (`src/lib/notifications.ts`)

#### Notification Interface

```typescript
interface Notification {
  id: string;
  type: 'task_assigned' | 'task_completed' | 'task_overdue' | 'general';
  title: string;
  message: string;
  taskId?: string;
  caseId?: string;
  assignedBy?: string;
  assignedByName?: string;
  isRead: boolean;
  isPopupShown: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: Date;
  readAt?: Date;
}
```

#### Key Functions

- **getUserNotifications()** - Fetches user notifications with optional filtering
- **getUnreadNotificationCount()** - Gets count of unread notifications
- **markNotificationRead()** - Marks single notification as read
- **markAllNotificationsRead()** - Marks all notifications as read
- **getPopupNotifications()** - Gets notifications for popup display
- **markPopupShown()** - Marks notification popup as shown
- **subscribeToNotifications()** - Sets up real-time subscription
- **getPriorityColor()** - Returns color class for priority
- **formatNotificationTime()** - Formats time as "5m ago", "2h ago", etc.

### 3. Notification Context (`src/contexts/NotificationContext.tsx`)

#### Context Interface

```typescript
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  showPopupNotifications: () => Promise<Notification[]>;
  markPopupAsShown: (notificationId: string) => Promise<void>;
}
```

#### Responsibilities

- Manages global notification state
- Handles real-time subscription lifecycle
- Provides notification operations to all components
- Updates state when notifications are read/created
- Fetches initial notifications on user login

### 4. UI Components

#### NotificationBell (`src/components/NotificationBell.tsx`)

**Purpose:** Displays bell icon in header with unread count and dropdown

**Features:**
- Bell icon with red badge showing unread count
- Dropdown panel with recent notifications
- "Mark all as read" button
- Click notification to navigate and mark as read
- Auto-close on outside click
- Empty state when no notifications

#### NotificationPopup (`src/components/NotificationPopup.tsx`)

**Purpose:** Shows popup notifications when user opens app

**Features:**
- Appears in top-right corner
- Shows notification details with priority badge
- Auto-dismisses after 8 seconds
- Progress bar showing auto-dismiss countdown
- Click to navigate to relevant page
- Stacks multiple popups with offset
- Slide-in animation

#### NotificationPopupContainer

**Purpose:** Manages multiple popup notifications

**Features:**
- Displays multiple popups sequentially
- Handles popup lifecycle
- Manages popup state

#### NotificationsPage (`src/pages/NotificationsPage.tsx`)

**Purpose:** Full page view of all notifications

**Features:**
- List of all notifications
- Filter by read status (all, unread, read)
- Filter by type (task assigned, completed, overdue, general)
- Search by title, message, or assigned by name
- Click notification to navigate
- Mark all as read button
- Empty state

## Data Models

### Notification Data Flow

```
1. Admin creates task with assigned_to user
   ↓
2. Database trigger fires on task INSERT
   ↓
3. create_task_notification() function executes
   ↓
4. Notification record created in database
   ↓
5. Real-time subscription broadcasts to user
   ↓
6. NotificationContext receives notification
   ↓
7. UI updates (bell count, popup appears)
   ↓
8. User interacts with notification
   ↓
9. Notification marked as read
   ↓
10. UI updates (count decrements, visual changes)
```

### Priority Calculation Logic

```typescript
if (task.deadline <= today) {
  priority = 'urgent';
} else if (task.deadline <= today + 3 days) {
  priority = 'high';
} else {
  priority = 'normal';
}
```

### Notification Message Format

For task assignments:
```
Title: "New Task Assigned" or "New Case Task Assigned"
Message: "You have been assigned a new task '[Task Title]' [for case: Case Name]. Deadline: DD Mon YYYY"
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Notification creation on task assignment

*For any* task created with an assigned user, a notification record should be automatically created in the notifications table with the correct user_id, task_id, and notification details.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Popup notifications are shown only once

*For any* notification that has been displayed as a popup, the is_popup_shown flag should be set to true, and that notification should not appear in subsequent popup queries.

**Validates: Requirements 2.4, 2.7**

### Property 3: Unread count accuracy

*For any* user, the unread notification count should always equal the number of notifications where is_read = false and the notification has not expired.

**Validates: Requirements 3.2, 3.4, 3.5**

### Property 4: Real-time notification delivery

*For any* new notification inserted into the database for a logged-in user, that notification should be received via the real-time subscription and added to the UI within 2 seconds.

**Validates: Requirements 7.2, 7.3, 7.4**

### Property 5: Notification read state consistency

*For any* notification that is marked as read, the is_read flag should be set to true, read_at timestamp should be recorded, and the unread count should be decremented by exactly 1.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

### Property 6: Priority level correctness

*For any* task notification, if the deadline is today or earlier, priority must be 'urgent'; if within 3 days, priority must be 'high'; otherwise priority must be 'normal'.

**Validates: Requirements 10.1, 10.2, 10.3**

### Property 7: Notification expiration

*For any* notification older than 30 days or with expires_at in the past, it should not be returned in user notification queries.

**Validates: Requirements 9.1, 9.5**

### Property 8: User isolation

*For any* user, they should only be able to view, update, or delete notifications where user_id matches their own user ID.

**Validates: Requirements 1.1, 4.1, 5.1**

### Property 9: Navigation consistency

*For any* notification with a task_id, clicking the notification should navigate to the tasks page; for any notification with a case_id, it should navigate to that case's details page.

**Validates: Requirements 2.6, 4.6, 5.6**

### Property 10: Mark all as read completeness

*For any* user with N unread notifications, calling mark_all_notifications_read should result in all N notifications having is_read = true and unread_count = 0.

**Validates: Requirements 4.5**

## Error Handling

### Database Errors

- **Notification creation failure:** Log error but don't prevent task creation
- **RLS policy violations:** Return empty results, log security event
- **Connection errors:** Retry with exponential backoff

### Real-time Subscription Errors

- **Connection lost:** Automatically reconnect when connection restored
- **Subscription failure:** Log error, fall back to polling every 30 seconds
- **Message parsing errors:** Log error, skip malformed message

### UI Errors

- **Failed to load notifications:** Show error message with retry button
- **Failed to mark as read:** Retry silently, show toast on repeated failure
- **Navigation errors:** Log error, show toast notification

### Edge Cases

- **User logs out during popup display:** Clear all popups immediately
- **Multiple tabs open:** Each tab maintains its own subscription
- **Notification deleted while viewing:** Handle gracefully, remove from UI
- **Very long notification messages:** Truncate with "..." and show full text on hover

## Testing Strategy

### Unit Tests

1. **Notification library functions**
   - Test getUserNotifications with various filters
   - Test markNotificationRead updates state correctly
   - Test formatNotificationTime for various time differences
   - Test getPriorityColor returns correct classes

2. **Context operations**
   - Test refreshNotifications fetches and updates state
   - Test markAsRead updates local state correctly
   - Test real-time subscription adds new notifications

3. **Component rendering**
   - Test NotificationBell displays correct unread count
   - Test NotificationPopup shows correct notification details
   - Test NotificationsPage filters work correctly

### Property-Based Tests

Property-based tests will use **fast-check** library for TypeScript/JavaScript. Each test will run a minimum of 100 iterations.

1. **Property 1: Notification creation on task assignment**
   - Generate random tasks with assigned users
   - Verify notification is created with correct data
   - **Feature: task-notification-system, Property 1**

2. **Property 2: Popup notifications are shown only once**
   - Generate random notifications
   - Mark as popup shown
   - Verify they don't appear in popup queries
   - **Feature: task-notification-system, Property 2**

3. **Property 3: Unread count accuracy**
   - Generate random sets of read/unread notifications
   - Calculate expected count
   - Verify getUnreadNotificationCount returns correct value
   - **Feature: task-notification-system, Property 3**

4. **Property 5: Notification read state consistency**
   - Generate random notifications
   - Mark as read
   - Verify is_read = true, read_at is set, count decremented
   - **Feature: task-notification-system, Property 5**

5. **Property 6: Priority level correctness**
   - Generate random task deadlines
   - Verify priority matches deadline rules
   - **Feature: task-notification-system, Property 6**

6. **Property 8: User isolation**
   - Generate notifications for different users
   - Verify user can only access their own notifications
   - **Feature: task-notification-system, Property 8**

### Integration Tests

1. **End-to-end notification flow**
   - Create task as admin
   - Verify notification appears for assigned user
   - Verify popup shows on login
   - Verify bell count updates
   - Mark as read and verify updates

2. **Real-time subscription**
   - Establish subscription
   - Create notification in database
   - Verify notification received in UI

3. **Multi-component interaction**
   - Create notification
   - Verify appears in bell dropdown
   - Verify appears in notifications page
   - Mark as read in one location
   - Verify updated in all locations

### Manual Testing Checklist

- [ ] Admin assigns task, user receives notification
- [ ] Popup appears on user login
- [ ] Bell shows correct unread count
- [ ] Clicking notification navigates correctly
- [ ] Mark as read updates UI immediately
- [ ] Mark all as read works correctly
- [ ] Filters on notifications page work
- [ ] Search on notifications page works
- [ ] Real-time updates work without refresh
- [ ] Priority colors display correctly
- [ ] Expired notifications don't appear
- [ ] Multiple popups stack correctly
- [ ] Auto-dismiss works after 8 seconds

## Implementation Notes

### Database Setup

1. Run the SQL migration file to create notifications table
2. Create all database functions
3. Create the trigger on tasks table
4. Enable RLS policies
5. Enable real-time for notifications table

### React Integration

1. Add NotificationProvider to App.tsx wrapping all routes
2. Add NotificationBell to Header component
3. Add NotificationPopupContainer to App.tsx (outside routes)
4. Add route for NotificationsPage
5. Ensure AuthContext is available to NotificationProvider

### Real-time Configuration

Ensure Supabase real-time is enabled:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

### Performance Considerations

- Limit notification queries to 50 most recent
- Use indexes on user_id, is_read, created_at
- Clean up old notifications regularly (cron job or manual)
- Debounce real-time updates if many arrive simultaneously
- Use React.memo for notification list items

### Security Considerations

- RLS policies ensure users only see their own notifications
- Validate user_id matches auth.uid() in all operations
- Sanitize notification messages to prevent XSS
- Rate limit notification creation to prevent spam
- Audit log for notification access patterns
