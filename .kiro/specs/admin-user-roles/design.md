# Design Document: Admin/User Role Management System

## Overview

This feature implements a comprehensive role-based access control (RBAC) system for PRK's Office legal case management dashboard. The system distinguishes between admin and regular user roles, providing admins with exclusive access to user management features while ensuring regular users have a streamlined interface focused on case management.

## Architecture

The system follows a layered architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    UI Layer                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ AdminPage   │  │ AdminRoute  │  │ Sidebar (role)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────┤
│                  Context Layer                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │              AuthContext (enhanced)                  ││
│  │  - users[], currentUser, role management            ││
│  └─────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────┤
│                 Storage Layer                            │
│  ┌─────────────────────────────────────────────────────┐│
│  │              localStorage                            ││
│  │  - users, currentUser, authToken                    ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. AdminRoute Component
A higher-order component that wraps admin-only routes and redirects non-admin users.

```typescript
interface AdminRouteProps {
  children: React.ReactNode;
}
```

### 2. AdminPage Component
The main admin panel page with user management functionality.

```typescript
interface AdminPageState {
  users: User[];
  showCreateModal: boolean;
  showDeleteConfirm: boolean;
  selectedUser: User | null;
}
```

### 3. Enhanced AuthContext
Extended authentication context with user management capabilities.

```typescript
interface AuthContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  createUser: (userData: CreateUserData) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  toggleUserStatus: (userId: string) => void;
  deleteUser: (userId: string) => void;
  loading: boolean;
  error: string | null;
}
```

### 4. Enhanced User Type
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'user';
  isActive: boolean;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Data Models

### User Model
```typescript
interface User {
  id: string;           // Unique identifier
  name: string;         // Display name
  email: string;        // Login email (unique)
  password: string;     // Hashed password (mock)
  role: 'admin' | 'user';
  isActive: boolean;    // Account status
  avatar?: string;      // Optional avatar URL
  createdAt: Date;
  updatedAt: Date;
}
```

### CreateUserData
```typescript
interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Admin Route Protection
*For any* non-admin user attempting to access admin routes, the system should redirect them to the dashboard page.
**Validates: Requirements 1.2**

### Property 2: User List Completeness
*For any* set of users in the system, when an admin views the admin panel, all users should appear in the displayed list.
**Validates: Requirements 1.3**

### Property 3: User Creation Grows List
*For any* valid user data submitted by an admin, the user list length should increase by exactly one after creation.
**Validates: Requirements 2.1**

### Property 4: Email Uniqueness Enforcement
*For any* attempt to create a user with an email that already exists, the operation should fail and the user list should remain unchanged.
**Validates: Requirements 2.2**

### Property 5: Role Change Persistence
*For any* user whose role is changed by an admin, the user's role property should immediately reflect the new value.
**Validates: Requirements 3.1, 3.2**

### Property 6: Self-Demotion Prevention
*For any* admin attempting to demote themselves, the operation should be rejected and their role should remain 'admin'.
**Validates: Requirements 3.3**

### Property 7: Account Status Toggle
*For any* user whose status is toggled by an admin, the isActive property should flip to the opposite boolean value.
**Validates: Requirements 4.1, 4.2**

### Property 8: Self-Deactivation Prevention
*For any* admin attempting to deactivate their own account, the operation should be rejected and their isActive status should remain true.
**Validates: Requirements 4.3**

### Property 9: Conditional Menu Visibility
*For any* user with role 'user', the admin panel menu item should not be visible in the sidebar.
**Validates: Requirements 5.1**

### Property 10: User Data Round-Trip
*For any* valid user object, serializing to JSON and deserializing should produce an equivalent user object.
**Validates: Requirements 6.3, 6.4**

### Property 11: User Deletion Shrinks List
*For any* user deleted by an admin, the user list length should decrease by exactly one.
**Validates: Requirements 7.1**

### Property 12: Self-Deletion Prevention
*For any* admin attempting to delete their own account, the operation should be rejected and they should remain in the user list.
**Validates: Requirements 7.2**

## Error Handling

| Error Scenario | Handling Strategy |
|----------------|-------------------|
| Duplicate email on user creation | Display error toast, prevent creation |
| Self-demotion attempt | Display warning toast, prevent action |
| Self-deactivation attempt | Display warning toast, prevent action |
| Self-deletion attempt | Display warning toast, prevent action |
| Invalid login credentials | Display error message on login form |
| Inactive account login | Display "Account deactivated" message |
| localStorage unavailable | Fall back to in-memory storage |

## Testing Strategy

### Unit Testing
- Test individual user management functions (create, update, delete)
- Test role validation logic
- Test email uniqueness validation

### Property-Based Testing
Using fast-check library for property-based tests:

- **Property 1-2**: Route protection and user list display
- **Property 3-4**: User creation and email uniqueness
- **Property 5-6**: Role management and self-protection
- **Property 7-8**: Account status management
- **Property 9**: Conditional UI rendering
- **Property 10**: Data serialization round-trip
- **Property 11-12**: User deletion and self-protection

Each property test will run minimum 100 iterations with randomly generated user data.

Test files will be annotated with format: `**Feature: admin-user-roles, Property {number}: {property_text}**`
