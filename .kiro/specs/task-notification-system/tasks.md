# Implementation Plan

- [ ] 1. Set up database infrastructure for notifications
  - Create notifications table with all required columns
  - Add indexes for performance (user_id, is_read, created_at, task_id)
  - Enable Row Level Security (RLS) policies
  - Grant necessary permissions to database roles
  - _Requirements: 1.1, 1.3, 1.4, 8.1_

- [ ] 2. Create database functions for notification operations
  - Implement create_notification() function
  - Implement get_user_notifications() function with filtering
  - Implement get_unread_notification_count() function
  - Implement mark_notification_read() function
  - Implement mark_all_notifications_read() function
  - Implement get_popup_notifications() function
  - Implement mark_popup_shown() function
  - Implement cleanup_old_notifications() function
  - _Requirements: 1.1, 2.1, 3.2, 4.1, 4.5, 6.1, 9.2_

- [ ] 3. Create database trigger for automatic notification creation
  - Implement create_task_notification() trigger function
  - Calculate priority based on task deadline (urgent, high, normal)
  - Extract case information if task is linked to a case
  - Format notification title and message appropriately
  - Create trigger on tasks table AFTER INSERT
  - _Requirements: 1.1, 1.2, 1.3, 8.1, 8.2, 8.3, 10.1, 10.2, 10.3_

- [ ] 4. Enable real-time subscriptions for notifications
  - Add notifications table to supabase_realtime publication
  - Configure real-time settings in Supabase dashboard
  - Test real-time broadcast functionality
  - _Requirements: 1.5, 7.1, 7.2_

- [ ] 5. Create notification management library
  - Define Notification TypeScript interface
  - Implement getUserNotifications() with filtering support
  - Implement getUnreadNotificationCount()
  - Implement markNotificationRead()
  - Implement markAllNotificationsRead()
  - Implement getPopupNotifications()
  - Implement markPopupShown()
  - Implement createNotification() for manual notifications
  - Implement deleteNotification()
  - Implement subscribeToNotifications() for real-time updates
  - _Requirements: 2.1, 3.1, 4.1, 4.5, 6.1, 6.2, 7.1, 7.2_

- [ ] 6. Add utility functions to notification library
  - Implement getPriorityColor() for color classes
  - Implement getPriorityBadgeColor() for badge styling
  - Implement formatNotificationTime() for relative time display
  - _Requirements: 10.4, 10.5, 10.6, 10.7_

- [ ] 6.1 Write property test for priority level correctness
  - **Property 6: Priority level correctness**
  - **Validates: Requirements 10.1, 10.2, 10.3**
  - Generate random task deadlines
  - Verify priority matches deadline rules (urgent if today, high if within 3 days, normal otherwise)

- [ ] 7. Create NotificationContext for global state management
  - Define NotificationContextType interface
  - Create NotificationProvider component
  - Implement refreshNotifications() to fetch user notifications
  - Implement markAsRead() to mark single notification as read
  - Implement markAllAsRead() to mark all notifications as read
  - Implement showPopupNotifications() to get popup notifications
  - Implement markPopupAsShown() to mark popup as shown
  - Set up real-time subscription in useEffect
  - Handle subscription cleanup on unmount
  - Update local state when real-time notifications arrive
  - _Requirements: 3.4, 4.1, 6.5, 7.1, 7.2, 7.3, 7.4, 7.6, 11.1, 11.2, 11.3_

- [ ] 7.1 Write property test for unread count accuracy
  - **Property 3: Unread count accuracy**
  - **Validates: Requirements 3.2, 3.4, 3.5**
  - Generate random sets of read/unread notifications
  - Calculate expected unread count
  - Verify getUnreadNotificationCount returns correct value

- [ ] 7.2 Write property test for notification read state consistency
  - **Property 5: Notification read state consistency**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**
  - Generate random notifications
  - Mark as read
  - Verify is_read = true, read_at is set, unread count decremented by 1

- [ ] 8. Create NotificationBell component for header
  - Create bell icon with unread count badge
  - Display "99+" when count exceeds 99
  - Implement dropdown panel with notification list
  - Show notification icon, title, message, priority, and time
  - Visually distinguish unread notifications with blue dot and background
  - Add "Mark all as read" button when unread notifications exist
  - Handle notification click to navigate and mark as read
  - Close dropdown on outside click
  - Display empty state when no notifications
  - Add "View all notifications" link in footer
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [ ] 8.1 Write unit tests for NotificationBell component
  - Test bell icon renders with correct unread count
  - Test dropdown opens and closes correctly
  - Test "Mark all as read" button functionality
  - Test notification click navigation
  - Test empty state display

- [ ] 9. Create NotificationPopup component
  - Create popup overlay in top-right corner
  - Display notification icon, title, message, priority badge
  - Show assigned by name and creation time
  - Add close button
  - Implement auto-dismiss after 8 seconds
  - Add progress bar showing auto-dismiss countdown
  - Handle click to navigate and mark as read
  - Implement slide-in animation
  - Apply priority-based border colors
  - _Requirements: 2.2, 2.3, 2.5, 2.6_

- [ ] 10. Create NotificationPopupContainer component
  - Manage multiple popup notifications
  - Display popups sequentially with vertical offset
  - Handle popup lifecycle (show, dismiss, remove)
  - Fetch popup notifications on mount
  - Mark popups as shown when displayed
  - _Requirements: 2.1, 2.4, 2.7_

- [ ] 10.1 Write property test for popup shown only once
  - **Property 2: Popup notifications are shown only once**
  - **Validates: Requirements 2.4, 2.7**
  - Generate random notifications
  - Mark as popup shown
  - Verify they don't appear in subsequent popup queries

- [ ] 11. Create NotificationsPage component
  - Display list of all user notifications
  - Add filter dropdown for read status (all, unread, read)
  - Add filter dropdown for notification type
  - Add search input for filtering by title, message, or assigned by name
  - Apply filters and search in real-time
  - Display notification cards with full details
  - Handle notification click to navigate and mark as read
  - Show "Mark all as read" button when unread notifications exist
  - Display empty state when no notifications match filters
  - Show loading state while fetching
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [ ] 11.1 Write unit tests for NotificationsPage component
  - Test filters update notification list correctly
  - Test search functionality
  - Test notification click navigation
  - Test "Mark all as read" functionality
  - Test empty state and loading state

- [ ] 12. Integrate NotificationProvider into App.tsx
  - Import NotificationProvider
  - Wrap application with NotificationProvider (inside AuthProvider, outside Router)
  - Ensure NotificationProvider has access to AuthContext
  - _Requirements: 11.1, 11.2, 11.3_

- [ ] 13. Add NotificationBell to Header component
  - Import NotificationBell component
  - Add NotificationBell to header navigation (near user profile)
  - Ensure proper spacing and alignment
  - Test bell appears for all authenticated users
  - _Requirements: 11.4_

- [ ] 14. Add NotificationPopupContainer to App.tsx
  - Import NotificationPopupContainer
  - Add component at root level (outside routes, inside NotificationProvider)
  - Implement logic to fetch and display popup notifications on app load
  - Handle popup dismissal and marking as shown
  - _Requirements: 11.5_

- [ ] 15. Add route for NotificationsPage
  - Import NotificationsPage component
  - Add protected route for /notifications path
  - Add navigation link in sidebar or user menu
  - Test navigation to notifications page
  - _Requirements: 11.6_

- [ ] 16. Create useNotifications custom hook export
  - Export useNotifications hook from NotificationContext
  - Document hook usage and available methods
  - Test hook can be used in any component
  - _Requirements: 11.7_

- [ ] 16.1 Write property test for notification creation on task assignment
  - **Property 1: Notification creation on task assignment**
  - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
  - Generate random tasks with assigned users
  - Create task in database
  - Verify notification is created with correct user_id, task_id, and details

- [ ] 16.2 Write property test for user isolation
  - **Property 8: User isolation**
  - **Validates: Requirements 1.1, 4.1, 5.1**
  - Generate notifications for different users
  - Attempt to access notifications as different user
  - Verify user can only access their own notifications

- [ ] 17. Test real-time notification delivery
  - Create test scenario with two users
  - Admin assigns task to user
  - Verify notification appears in user's UI without refresh
  - Verify unread count updates immediately
  - Verify popup appears if user just logged in
  - _Requirements: 7.2, 7.3, 7.4, 7.5_

- [ ] 17.1 Write integration test for real-time notification flow
  - **Property 4: Real-time notification delivery**
  - **Validates: Requirements 7.2, 7.3, 7.4**
  - Establish real-time subscription
  - Insert notification in database
  - Verify notification received in UI within 2 seconds

- [ ] 18. Implement notification cleanup mechanism
  - Create scheduled job or manual trigger for cleanup_old_notifications()
  - Test cleanup removes expired notifications
  - Test cleanup doesn't affect active notifications
  - Document cleanup schedule
  - _Requirements: 9.2, 9.3, 9.4, 9.5_

- [ ] 18.1 Write property test for notification expiration
  - **Property 7: Notification expiration**
  - **Validates: Requirements 9.1, 9.5**
  - Generate notifications with various expiration dates
  - Query for user notifications
  - Verify expired notifications are not returned

- [ ] 19. Add error handling and edge cases
  - Handle notification creation failure gracefully
  - Handle real-time subscription errors with retry logic
  - Handle navigation errors with toast notifications
  - Handle user logout during popup display
  - Handle very long notification messages with truncation
  - Add error boundaries around notification components
  - _Requirements: Error Handling section_

- [ ] 19.1 Write unit tests for error handling
  - Test notification creation failure doesn't break task creation
  - Test subscription reconnection on connection loss
  - Test graceful handling of malformed notifications
  - Test popup cleanup on user logout

- [ ] 20. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 21. Perform end-to-end testing
  - Test complete flow: admin assigns task → user receives notification → popup appears → bell updates
  - Test marking notifications as read from different locations
  - Test filters and search on notifications page
  - Test real-time updates across multiple tabs
  - Test notification priority colors and badges
  - Test auto-dismiss and manual dismiss of popups
  - Verify database trigger creates notifications correctly
  - _Requirements: All requirements_

- [ ] 22. Create documentation for notification system
  - Document how to use the notification system
  - Document database schema and functions
  - Document React components and hooks
  - Add troubleshooting guide
  - Create admin guide for managing notifications
  - _Requirements: All requirements_

- [ ] 23. Final checkpoint - Verify all requirements met
  - Ensure all tests pass, ask the user if questions arise.
  - Review all requirements and verify implementation
  - Test on different browsers and devices
  - Verify performance with many notifications
  - Check accessibility of notification components
