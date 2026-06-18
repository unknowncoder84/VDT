# Design Document

## Overview

This design document outlines the implementation approach for enhancing the legal case management dashboard with payment mode visualization, accurate case statistics based on real case stages, improved iconography, case navigation, and a comprehensive notification system.

## Architecture

The enhancements will be implemented across multiple layers:

1. **Data Layer**: Extend the Case type to include a `stage` field and create a new Notification type
2. **Context Layer**: Add notification management to DataContext
3. **UI Layer**: Create payment mode badge components, update dashboard statistics logic, add notification panel component
4. **Navigation Layer**: Implement click handlers for case navigation

### Component Structure

```
src/
├── types/
│   └── index.ts (extend Case type, add Notification type)
├── contexts/
│   └── DataContext.tsx (add notification management)
├── components/
│   ├── PaymentModeBadge.tsx (new component)
│   ├── NotificationPanel.tsx (new component)
│   └── Header.tsx (add notification bell icon)
├── pages/
│   ├── DashboardPage.tsx (update statistics logic)
│   ├── CasesPage.tsx (add click navigation)
│   ├── FinancePage.tsx (use PaymentModeBadge)
│   └── CaseDetailsPage.tsx (use PaymentModeBadge)
└── utils/
    └── notifications.ts (notification helper functions)
```

## Components and Interfaces

### Type Definitions

```typescript
// Extended Case type with stage field
export type CaseStage = 
  | 'consultation'
  | 'drafting'
  | 'filing'
  | 'circulation'
  | 'notice'
  | 'pre-admission'
  | 'admitted'
  | 'final-hearing'
  | 'reserved'
  | 'disposed';

export interface Case {
  // ... existing fields
  stage: CaseStage;
}

// Notification type
export type NotificationAction = 
  | 'case-created'
  | 'case-updated'
  | 'appointment-created'
  | 'appointment-updated'
  | 'transaction-added';

export interface Notification {
  id: string;
  action: NotificationAction;
  entityId: string;
  entityName: string;
  performedBy: string;
  performedByName: string;
  timestamp: Date;
  isRead: boolean;
  message: string;
}
```

### PaymentModeBadge Component

A reusable component that displays payment modes with appropriate icons and colors.

```typescript
interface PaymentModeBadgeProps {
  mode: PaymentMode;
  size?: 'sm' | 'md' | 'lg';
}
```

**Features:**
- Icon mapping for each payment mode
- Color coding for visual distinction
- Responsive sizing
- Tooltip support

### NotificationPanel Component

A dropdown panel that displays recent notifications with filtering and marking as read functionality.

```typescript
interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Features:**
- List of notifications sorted by timestamp
- Unread indicator badges
- Click to navigate to entity
- Mark as read functionality
- Empty state when no notifications

## Data Models

### Case Stage Field

The Case model will be extended with a `stage` field that tracks the current legal process stage:

```typescript
stage: CaseStage; // Required field with strict type checking
```

### Notification Model

```typescript
{
  id: string;                    // Unique identifier
  action: NotificationAction;    // Type of action performed
  entityId: string;              // ID of the affected entity
  entityName: string;            // Display name of the entity
  performedBy: string;           // User ID who performed the action
  performedByName: string;       // User name for display
  timestamp: Date;               // When the action occurred
  isRead: boolean;               // Read status
  message: string;               // Human-readable message
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Payment mode rendering completeness
*For any* transaction, the rendered payment mode badge should contain both a visual indicator (color/style) and an icon element.
**Validates: Requirements 1.1**

### Property 2: Payment mode color uniqueness
*For any* two different payment modes, their assigned colors should be distinct from each other.
**Validates: Requirements 1.8**

### Property 3: Case stage counting accuracy
*For any* case stage value and any collection of cases, the count of cases with that stage should equal the number of cases where the stage field matches that value.
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10**

### Property 4: Total case count accuracy
*For any* collection of cases, the total case count should equal the length of the cases array.
**Validates: Requirements 2.11**

### Property 5: Case ID URL preservation
*For any* case ID, when navigating to the case details page, the URL should contain that case ID as a parameter.
**Validates: Requirements 3.3**

### Property 6: Case details completeness
*For any* case, the rendered case details page should include all required fields: client name, client email, client mobile, file number, registration number, parties name, next date, filing date, and status.
**Validates: Requirements 3.4**

### Property 7: Case creation notification generation
*For any* case creation action, the system should generate notifications for all users with admin role.
**Validates: Requirements 4.1**

### Property 8: Case update notification generation
*For any* case update action, the system should generate notifications for all admin users and the user who created the case.
**Validates: Requirements 4.2**

### Property 9: Admin case update notification
*For any* case update action performed by an admin, the system should generate a notification for the user who created the case.
**Validates: Requirements 4.3**

### Property 10: Appointment creation notification generation
*For any* appointment creation action, the system should generate notifications for all users with admin role.
**Validates: Requirements 4.4**

### Property 11: Appointment update notification generation
*For any* appointment update action, the system should generate notifications for all admin users and the user who created the appointment.
**Validates: Requirements 4.5**

### Property 12: Transaction notification generation
*For any* transaction addition action, the system should generate notifications for all users with admin role.
**Validates: Requirements 4.6**

### Property 13: Notification structure completeness
*For any* generated notification, it should contain all required fields: action type, entity ID, entity name, performed by user ID, performed by user name, timestamp, and message.
**Validates: Requirements 4.7**

### Property 14: Unread notification display
*For any* user viewing the notification panel, all notifications where isRead equals false should be displayed in the panel.
**Validates: Requirements 4.8**

### Property 15: Notification read state update
*For any* notification that is clicked, its isRead field should be updated to true.
**Validates: Requirements 4.9**

### Property 16: Notification sort order
*For any* list of notifications displayed to a user, they should be sorted by timestamp in descending order (most recent first).
**Validates: Requirements 4.10**

### Property 17: Notification badge count accuracy
*For any* user, the notification badge count should equal the number of notifications where isRead equals false.
**Validates: Requirements 4.11**

### Property 18: Case stage validation on creation
*For any* case creation attempt where the stage field is missing or undefined, the creation should fail with a validation error.
**Validates: Requirements 5.2**

### Property 19: Case stage validation on update
*For any* case update attempt with a stage value not in the allowed values list, the update should fail with a validation error.
**Validates: Requirements 5.3**

## Error Handling

### Payment Mode Badge Errors
- **Invalid payment mode**: Display a default "Other" badge with generic icon
- **Missing payment mode**: Display "Unknown" badge with question mark icon

### Case Statistics Errors
- **Missing stage field**: Treat as uncategorized and exclude from stage-specific counts
- **Invalid stage value**: Log warning and exclude from stage-specific counts
- **Empty cases array**: Display zero for all statistics

### Navigation Errors
- **Invalid case ID**: Redirect to cases list page with error message
- **Case not found**: Display 404 page with option to return to cases list
- **Navigation failure**: Show error toast and remain on current page

### Notification Errors
- **Notification generation failure**: Log error but don't block the primary action
- **Notification fetch failure**: Display empty state with retry option
- **Mark as read failure**: Retry automatically up to 3 times
- **Navigation from notification failure**: Show error toast with manual navigation option

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

1. **PaymentModeBadge Component**
   - Test rendering with each payment mode type
   - Test icon mapping for each mode
   - Test color application for each mode
   - Test size variants (sm, md, lg)

2. **Case Statistics Calculation**
   - Test with empty cases array
   - Test with cases all in one stage
   - Test with cases distributed across multiple stages
   - Test with cases having invalid stage values

3. **Notification Generation**
   - Test notification creation for case actions
   - Test notification creation for appointment actions
   - Test notification creation for transaction actions
   - Test notification targeting (admins vs creators)

4. **Notification Panel**
   - Test rendering with no notifications
   - Test rendering with unread notifications
   - Test rendering with mixed read/unread notifications
   - Test mark as read functionality
   - Test navigation from notification

### Property-Based Testing

Property-based tests will verify universal properties using fast-check library:

1. **Payment Mode Properties**
   - Property 1: Payment mode rendering completeness
   - Property 2: Payment mode color uniqueness

2. **Case Statistics Properties**
   - Property 3: Case stage counting accuracy
   - Property 4: Total case count accuracy

3. **Navigation Properties**
   - Property 5: Case ID URL preservation
   - Property 6: Case details completeness

4. **Notification Properties**
   - Property 7-12: Notification generation for various actions
   - Property 13: Notification structure completeness
   - Property 14-17: Notification display and interaction properties

5. **Validation Properties**
   - Property 18: Case stage validation on creation
   - Property 19: Case stage validation on update

Each property test will run a minimum of 100 iterations with randomly generated test data to ensure the properties hold across all valid inputs.

### Integration Testing

Integration tests will verify the complete workflows:

1. **Payment Mode Display Flow**
   - Create transaction → View in finance page → Verify badge display
   - Create transaction → View in case details → Verify badge display

2. **Case Statistics Flow**
   - Create cases with various stages → View dashboard → Verify counts
   - Update case stages → Verify dashboard updates
   - Delete cases → Verify dashboard updates

3. **Case Navigation Flow**
   - Click case in table → Verify navigation → Verify details display
   - Click case in mobile card → Verify navigation → Verify details display

4. **Notification Flow**
   - User creates case → Verify admin receives notification
   - Admin updates case → Verify creator receives notification
   - Click notification → Verify navigation → Verify mark as read

## Implementation Notes

### Payment Mode Icons

Using lucide-react icons:
- UPI: `Smartphone`
- Cash: `Banknote`
- Check: `Receipt`
- Bank Transfer: `Building2`
- Card: `CreditCard`
- Other: `Wallet`

### Case Stage Mapping

The dashboard statistics table will map to case stages as follows:
- Consultation → stage: 'consultation'
- Drafting → stage: 'drafting'
- Filing → stage: 'filing'
- Circulation → stage: 'circulation'
- Notice → stage: 'notice'
- Pre Admission → stage: 'pre-admission'
- Admitted → stage: 'admitted'
- Final Hearing → stage: 'final-hearing'
- Reserved For Judgement → stage: 'reserved'
- Disposed → stage: 'disposed'

### Notification Storage

Notifications will be stored in the DataContext state and persisted to localStorage for offline access. When the application reconnects to the database, notifications will be synced.

### Real-time Updates

Notifications will be checked every 30 seconds when the user is active. A visual indicator will show when new notifications arrive.
