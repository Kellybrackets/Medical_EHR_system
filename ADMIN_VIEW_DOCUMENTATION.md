# Admin View Documentation

## Overview
A comprehensive admin portal for managing the MedCare EHR system. This standalone HTML page provides super-users with complete control over practices, users, and system settings.

---

## Access

**URL:** `http://localhost:5173/admin.html`

**Purpose:** Super-user administration and system management

---

## Features

### 1. 📊 Dashboard Module

**What It Shows:**
- **Total Practices**: Count of active medical practices in the system
- **Total Users**: Count of all active users (doctors and receptionists)
- **Active Today**: Number of users who logged in today
- **New This Week**: New registrations in the past 7 days

**Visual Elements:**
- Four gradient stat cards with real-time counts
- Bar chart showing "Registrations This Week" (Mon-Sun)
- Clean, modern design with medical theme colors

**Auto-Updates:**
- Stats automatically update when practices/users are added or removed
- Dashboard reflects current system state

---

### 2. 🏥 Practices Module

**Purpose:** Manage all medical practices in the system

#### Features:

**Practice Table:**
- **Practice Name**: Full name of the medical facility
- **Practice Code**: Unique identifier (e.g., CGH001, FWC002)
- **User Count**: Number of staff members at this practice
- **Status**: Active or Inactive
- **Actions**: Edit and Deactivate/Activate buttons

**Pre-loaded Practices:**
1. **City General Hospital** (CGH001)
2. **Family Wellness Clinic** (FWC002)
3. **Downtown Medical Center** (DMC003)

#### Add New Practice:

**Button:** "Add New Practice" (top right)

**Form Fields:**
- **Practice Name** (required): Full name of the facility
- **Practice Code** (required): Unique uppercase code (e.g., "ABC123")
- **Address** (optional): Physical location

**Validation:**
- Practice code must be unique
- Uppercase letters and numbers only
- Cannot duplicate existing codes

**What Happens:**
1. Click "Add New Practice"
2. Fill out the form
3. Click "Save"
4. Practice added to table
5. Dashboard stats update
6. Practice appears in user filter dropdown

#### Edit Practice:

**How To:**
1. Click "Edit" button in Actions column
2. Modal opens with current values
3. Modify fields (except practice code)
4. Click "Save"

**Note:** Changing practice code updates all associated users

#### Deactivate/Activate Practice:

**Deactivate:**
- Click "Deactivate" button
- Confirmation prompt shows affected user count
- Status changes to "Inactive"
- Practice hidden from new user registration dropdowns

**Activate:**
- Click "Activate" button
- Status changes to "Active"
- Practice available for new registrations

---

### 3. 👥 Users Module

**Purpose:** Manage all system users (doctors and receptionists)

#### Features:

**Search & Filter:**
- **Search Bar**: Filter by name or email (real-time)
- **Practice Dropdown**: Filter by specific practice
- Filters work together (AND logic)

**User Table:**
- **User Name**: Full name
- **Email**: Contact email address
- **Role**: Doctor or Receptionist (color-coded badges)
- **Practice**: Associated medical facility
- **Status**: Active or Suspended
- **Actions**: Reset Password and Suspend/Activate buttons

**Pre-loaded Users (8 total):**

**City General Hospital (CGH001):**
- Dr. Sarah Johnson (Doctor, Active)
- Dr. Michael Chen (Doctor, Active)
- Emily Davis (Receptionist, Active)
- Dr. Patricia Taylor (Doctor, Active)

**Family Wellness Clinic (FWC002):**
- Dr. Amanda Wilson (Doctor, Active)
- Robert Brown (Receptionist, Active)

**Downtown Medical Center (DMC003):**
- Dr. James Martinez (Doctor, Active)
- Lisa Anderson (Receptionist, Suspended)

#### Reset Password:

**How To:**
1. Click "Reset Password" button
2. Alert confirms email sent
3. Simulates sending password reset email

**In Production:**
Would trigger actual email via Supabase Auth or email service

#### Suspend/Activate User:

**Suspend:**
- Click "Suspend" button
- Confirmation prompt appears
- User status changes to "Suspended"
- User cannot log in (in production)

**Activate:**
- Click "Activate" button
- Confirmation prompt appears
- User status changes to "Active"
- User can log in normally

---

### 4. ⚙️ System Settings Module

**Purpose:** Configure global system settings

#### Available Settings:

**System Name:**
- Default: "MedCare EHR"
- Type: Text input
- Shown in headers and branding

**Require Strong Passwords:**
- Default: ✅ Checked
- Type: Checkbox
- Enforces password complexity rules

**Session Timeout:**
- Default: 30 minutes
- Type: Number input
- Range: 5-120 minutes
- Controls auto-logout timing

**Maximum Login Attempts:**
- Default: 5 attempts
- Type: Number input
- Range: 3-10 attempts
- Prevents brute force attacks

**Enable Audit Logging:**
- Default: ✅ Checked
- Type: Checkbox
- Tracks all admin actions

#### Save Settings:

**How To:**
1. Modify any settings
2. Click "Save Settings" button
3. Alert confirms successful save
4. Settings applied system-wide

**Data Storage:**
Currently stored in JavaScript (demonstration mode)
In production: Would save to database

---

## Technical Implementation

### Data Structure

**Practices Array:**
```javascript
window.practices = [
    {
        name: 'City General Hospital',
        code: 'CGH001',
        address: '123 Main Street, City Center',
        status: 'active'
    },
    // ... more practices
];
```

**Users Array:**
```javascript
window.users = [
    {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@cgh.com',
        role: 'Doctor',
        practiceCode: 'CGH001',
        status: 'Active'
    },
    // ... more users
];
```

### Key Functions

**Navigation:**
- `showModule(moduleId)` - Switches between modules
- Updates active sidebar item
- Renders data for selected module

**Practices:**
- `renderPractices()` - Populates practices table
- `showAddPracticeModal()` - Opens add/edit form
- `savePractice(event)` - Adds or updates practice
- `togglePracticeStatus(index)` - Activates/deactivates

**Users:**
- `renderUsers(filteredUsers)` - Populates users table
- `filterUsers()` - Applies search and practice filters
- `resetPassword(email)` - Simulates password reset
- `toggleUserStatus(index)` - Suspends/activates user

**Settings:**
- `saveSettings(event)` - Saves system configuration

**Dashboard:**
- `updateDashboardStats()` - Refreshes stat counts

---

## Design System

### Colors

**Primary Gradient:**
- Blue to Teal: `#2563eb → #14b8a6`

**Stat Cards:**
- Purple: `#667eea → #764ba2`
- Green: `#10b981 → #059669`
- Blue: `#2563eb → #1d4ed8`
- Teal: `#14b8a6 → #0d9488`

**Status Badges:**
- Success (Green): `#d1fae5` background, `#065f46` text
- Danger (Red): `#fee2e2` background, `#991b1b` text
- Warning (Yellow): `#fef3c7` background, `#92400e` text

### Layout

**Top Bar:**
- Fixed position at top
- Gradient background (blue to teal)
- "Admin Portal" title on left
- "Sign Out" button on right

**Sidebar:**
- Fixed position on left (250px width)
- White background with subtle shadow
- Menu items with hover effects
- Active item highlighted in blue

**Main Content:**
- Margin-left: 250px (accounts for sidebar)
- Padding: 2rem
- Background: Light gray (`#f7fafc`)

**Cards:**
- White background
- Rounded corners (12px)
- Subtle shadow
- Padding: 1.5rem

---

## User Flows

### Adding a New Practice

1. Navigate to "Practices" module
2. Click "Add New Practice" button
3. Fill out form:
   - Practice Name: "Riverside Health Center"
   - Practice Code: "RHC004"
   - Address: "321 River Road, Riverside"
4. Click "Save"
5. Practice appears in table
6. Dashboard shows updated practice count
7. Practice available in user filter dropdown

### Suspending a User

1. Navigate to "Users" module
2. Find user in table (use search if needed)
3. Click "Suspend" button in Actions column
4. Confirm action in dialog
5. User status changes to "Suspended"
6. Badge turns red
7. Button changes to "Activate"
8. Dashboard shows updated active user count

### Editing Practice Details

1. Navigate to "Practices" module
2. Find practice in table
3. Click "Edit" button
4. Modal opens with current values
5. Modify name or address
6. Click "Save"
7. Table updates immediately
8. All associated users remain linked

---

## Security Considerations

### Current Implementation (Demo Mode)

**Data Storage:**
- JavaScript arrays in browser memory
- Data lost on page refresh
- No authentication required

**Actions:**
- All changes are local only
- No database persistence
- Simulated email notifications

### Production Requirements

**Authentication:**
- Require admin login before access
- Verify super-user role
- Check permissions for each action

**Database Integration:**
- Connect to Supabase database
- Real-time data synchronization
- Proper error handling

**Audit Trail:**
- Log all admin actions
- Track who made changes and when
- Store in audit_logs table

**Email Integration:**
- Real password reset emails
- User notification emails
- Admin alert emails

---

## Integration with Main App

### How It Connects

**Practice Registration:**
- Practices added here appear in user registration dropdown
- Only "Active" practices are selectable
- Practice codes link users to facilities

**User Management:**
- Users created here can log into main app
- Suspended users cannot access system
- Role determines dashboard access (Doctor vs Receptionist)

**Settings Application:**
- System name shows in main app headers
- Password requirements enforced at registration
- Session timeout applies to all users
- Audit logs track main app actions

---

## Testing Checklist

### Dashboard
- [ ] Stats display correct counts
- [ ] Chart renders with bars for each day
- [ ] Stats update when practices/users change

### Practices
- [ ] Table shows all 3 default practices
- [ ] Click "Add New Practice" opens modal
- [ ] Can add practice with unique code
- [ ] Cannot add duplicate practice code
- [ ] Edit changes practice details
- [ ] Deactivate changes status to inactive
- [ ] User count is accurate

### Users
- [ ] Table shows all 8 default users
- [ ] Search filters by name/email
- [ ] Practice dropdown filters correctly
- [ ] Both filters work together
- [ ] Reset Password shows confirmation
- [ ] Suspend changes status and button text
- [ ] Activate re-enables user

### Settings
- [ ] All fields have default values
- [ ] Can modify each setting
- [ ] Save Settings shows confirmation
- [ ] Settings persist during session

### Navigation
- [ ] Sidebar highlights active module
- [ ] Clicking menu items switches modules
- [ ] Only one module visible at a time
- [ ] Sign Out shows confirmation

---

## Browser Compatibility

**Tested On:**
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

**Requirements:**
- Modern browser with ES6 support
- JavaScript enabled
- LocalStorage available

---

## File Structure

**Location:** `/public/admin.html`

**Size:** ~25KB (single file)

**Dependencies:** None (pure HTML/CSS/JS)

**Assets Required:** None (uses emoji icons)

---

## Future Enhancements

### Phase 1: Database Integration
- Connect to Supabase
- Real-time data sync
- Persistent storage

### Phase 2: Authentication
- Admin login requirement
- Role-based access control
- Multi-factor authentication

### Phase 3: Advanced Features
- User activity dashboard
- Export data to CSV/PDF
- Email templates management
- Advanced analytics
- Bulk user operations

### Phase 4: Audit & Compliance
- Detailed audit logs
- HIPAA compliance tools
- Data encryption settings
- Backup & restore

---

## Quick Reference

### Keyboard Shortcuts
- **Esc**: Close modal
- **Enter**: Submit form (when focused)

### Default Credentials (for testing)
- No authentication required (demo mode)
- Direct URL access

### Data Reset
- Refresh page to reset to default data
- All changes are session-only

---

## Troubleshooting

### Issue: Practice won't save
**Solution:** Check practice code is unique and uppercase/numbers only

### Issue: User filter not working
**Solution:** Ensure practice exists and user is assigned to valid practice code

### Issue: Modal won't close
**Solution:** Click "Cancel" button or click outside modal

### Issue: Stats not updating
**Solution:** Stats update automatically - refresh page if needed

---

## Support

**Documentation:** This file
**Code Location:** `/public/admin.html`
**Access URL:** `http://localhost:5173/admin.html`

---

**Status**: ✅ Complete and functional
**Version**: 1.0
**Last Updated**: 2025-01-23
**File Size**: ~25KB
**Dependencies**: None
