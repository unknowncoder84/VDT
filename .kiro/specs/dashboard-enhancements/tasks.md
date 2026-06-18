# Implementation Plan

- [ ] 1. Extend type definitions and add case stage field
  - Add CaseStage type with all allowed stage values
  - Add stage field to Case interface
  - Add Notification type with all required fields
  - Add NotificationAction type for action categorization
  - _Requirements: 5.1, 5.4_

- [ ] 2. Create PaymentModeBadge component
  - Implement component with icon mapping for all payment modes
  - Add color coding for each payment mode type
  - Add size variants (sm, md, lg)
  - Add responsive styling with proper icons from lucide-react
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [ ] 2.1 Write property test for payment mode rendering
  - **Property 1: Payment mode rendering completeness**
  - **Validates: Requirements 1.1**

- [ ] 2.2 Write property test for payment mode color uniqueness
  - **Property 2: Payment mode color uniqueness**
  - **Validates: Requirements 1.8**

- [ ] 3. Update DashboardPage with accurate case statistics
  - Replace hardcoded statistics with dynamic calculations based on case.stage field
  - Implement counting logic for each stage (consultation, drafting, filing, etc.)
  - Update statistics table to use real case counts
  - Handle cases with missing or invalid stage values
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12_

- [ ] 3.1 Write property test for case stage counting
  - **Property 3: Case stage counting accuracy**
  - **Validates: Requirements 2.1-2.10**

- [ ] 3.2 Write property test for total case count
  - **Property 4: Total case count accuracy**
  - **Validates: Requirements 2.11**

- [ ] 4. Implement case navigation from cases list
  - Add onClick handlers to case table rows
  - Add onClick handlers to mobile case cards
  - Implement navigation to case details page with case ID
  - Ensure URL preserves case ID parameter
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 4.1 Write property test for case ID URL preservation
  - **Property 5: Case ID URL preservation**
  - **Validates: Requirements 3.3**

- [ ] 5. Update CaseDetailsPage to display all case information
  - Ensure all required fields are displayed (client details, dates, parties, status)
  - Add PaymentModeBadge component for transaction display
  - Improve layout and styling for better information hierarchy
  - _Requirements: 3.4_

- [ ] 5.1 Write property test for case details completeness
  - **Property 6: Case details completeness**
  - **Validates: Requirements 3.4**

- [ ] 6. Add notification management to DataContext
  - Add notifications state array
  - Implement addNotification function
  - Implement markNotificationAsRead function
  - Implement getUnreadNotificationsCount function
  - Add notification generation to addCase, updateCase, addAppointment, updateAppointment, addTransaction
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ] 6.1 Write property test for case creation notifications
  - **Property 7: Case creation notification generation**
  - **Validates: Requirements 4.1**

- [ ] 6.2 Write property test for case update notifications
  - **Property 8: Case update notification generation**
  - **Validates: Requirements 4.2**

- [ ] 6.3 Write property test for admin case update notifications
  - **Property 9: Admin case update notification**
  - **Validates: Requirements 4.3**

- [ ] 6.4 Write property test for appointment creation notifications
  - **Property 10: Appointment creation notification generation**
  - **Validates: Requirements 4.4**

- [ ] 6.5 Write property test for appointment update notifications
  - **Property 11: Appointment update notification generation**
  - **Validates: Requirements 4.5**

- [ ] 6.6 Write property test for transaction notifications
  - **Property 12: Transaction notification generation**
  - **Validates: Requirements 4.6**

- [ ] 6.7 Write property test for notification structure
  - **Property 13: Notification structure completeness**
  - **Validates: Requirements 4.7**

- [ ] 7. Create NotificationPanel component
  - Implement dropdown panel with notification list
  - Add unread indicator badges
  - Implement mark as read on click
  - Add navigation to entity on notification click
  - Implement sort by timestamp (most recent first)
  - Add empty state for no notifications
  - _Requirements: 4.8, 4.9, 4.10_

- [ ] 7.1 Write property test for unread notification display
  - **Property 14: Unread notification display**
  - **Validates: Requirements 4.8**

- [ ] 7.2 Write property test for notification read state update
  - **Property 15: Notification read state update**
  - **Validates: Requirements 4.9**

- [ ] 7.3 Write property test for notification sort order
  - **Property 16: Notification sort order**
  - **Validates: Requirements 4.10**

- [ ] 8. Update Header component with notification bell
  - Add notification bell icon with badge count
  - Implement toggle for NotificationPanel
  - Add unread count badge display
  - Hide badge when no unread notifications
  - _Requirements: 4.11, 4.12_

- [ ] 8.1 Write property test for notification badge count
  - **Property 17: Notification badge count accuracy**
  - **Validates: Requirements 4.11**

- [ ] 9. Add case stage validation
  - Implement validation in addCase to require stage field
  - Implement validation in updateCase to check stage value against allowed values
  - Add error handling for invalid stage values
  - _Requirements: 5.2, 5.3_

- [ ] 9.1 Write property test for case stage validation on creation
  - **Property 18: Case stage validation on creation**
  - **Validates: Requirements 5.2**

- [ ] 9.2 Write property test for case stage validation on update
  - **Property 19: Case stage validation on update**
  - **Validates: Requirements 5.3**

- [ ] 10. Update FinancePage to use PaymentModeBadge
  - Replace text-based payment mode display with PaymentModeBadge component
  - Ensure proper styling and layout
  - _Requirements: 1.1, 1.8_

- [ ] 11. Update dummy data with case stages
  - Add stage field to all dummy cases in DataContext
  - Ensure variety of stages for testing
  - Add sample notifications for testing
  - _Requirements: 2.1-2.12_

- [ ] 12. Update CreateCaseForm to include stage field
  - Add stage dropdown with all allowed values
  - Make stage field required
  - Add proper validation
  - _Requirements: 5.2_

- [ ] 13. Update EditCasePage to include stage field
  - Add stage dropdown with all allowed values
  - Ensure stage validation on update
  - _Requirements: 5.3_

- [ ] 14. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
