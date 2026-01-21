# ISKA Leads CRM - Product Requirements Document (PRD)

**Version:** 2.0  
**Last Updated:** 2025-01-16  
**Status:** Active Development - Major Features Complete

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Architecture & Technology Stack](#architecture--technology-stack)
4. [Core Modules & Features](#core-modules--features)
5. [Database Schema](#database-schema)
6. [User Roles & Permissions](#user-roles--permissions)
7. [API & Integrations](#api--integrations)
8. [UI/UX Guidelines](#uiux-guidelines)
9. [Known Issues & Fixes](#known-issues--fixes)
10. [Future Enhancements](#future-enhancements)

---

## Executive Summary

**ISKA Leads CRM** is a comprehensive Customer Relationship Management system designed specifically for managing student accommodation leads. The system enables sales teams to track leads from initial inquiry through conversion, manage bulk data imports, generate analytics reports, and maintain a complete audit trail of all activities.

### Key Objectives
- Streamline lead management and tracking
- Enforce mandatory 3-follow-up qualification process
- Provide real-time analytics and reporting
- Enable bulk data import/export capabilities
- Support multi-user collaboration with role-based access
- Maintain data integrity through audit trails
- Automated follow-up reminders and notifications
- Offer mobile-responsive PWA experience

### Recent Major Updates (January 2025)
- ✅ **Follow-Up Tracking System** - Mandatory 3-follow-up process implemented
- ✅ **Automated Reminders** - Follow-up reminder automation with notifications
- ✅ **Exception Workflow** - Admin approval system for early lead closure
- ✅ **Notification System** - In-app notification center with user preferences
- ✅ **Follow-Up Analytics** - Comprehensive analytics and compliance tracking
- ✅ **Enhanced Audit Trail** - Automatic logging of all lead activities
- ✅ **Mobile UI Improvements** - Bottom-anchored dialogs, icon-only buttons
- ✅ **Dynamic Lead Sources** - Manageable lead source categories
- ✅ **UI/UX Enhancements** - AlertDialogs replacing browser confirms
- ✅ **WordPress Integration** - Webhook support for Elementor Forms and WP Forms
- ✅ **Team Performance Analytics** - User metrics and leaderboards
- ✅ **Email Templates & Automation** - Template management and email sending

---

## System Overview

### Technology Stack

**Frontend:**
- React 18.3.1 with TypeScript
- Vite 5.4.19 (Build tool)
- React Router DOM 6.30.1 (Routing)
- TanStack React Query 5.83.0 (Data fetching & caching)
- Tailwind CSS 3.4.17 (Styling)
- shadcn/ui components (UI library based on Radix UI)
- Recharts 2.15.4 (Data visualization)
- React Hook Form 7.61.1 + Zod 3.25.76 (Form validation)
- date-fns 3.6.0 (Date formatting)

**Backend:**
- Supabase (PostgreSQL database + Auth + Edge Functions)
- Row Level Security (RLS) for data access control
- Edge Functions for serverless processing
- pg_cron for scheduled tasks (follow-up reminders)

**Development Tools:**
- TypeScript 5.8.3
- ESLint 9.32.0
- PostCSS + Autoprefixer
- Vite PWA Plugin (Progressive Web App support)

### Project Structure

```
iskaleadscrm-main/
├── src/
│   ├── components/          # React components
│   │   ├── analytics/       # Analytics components (FollowUpAnalytics)
│   │   ├── dashboard/       # Dashboard-specific components
│   │   ├── leads/           # Lead management components
│   │   │   ├── AuditTrailDisplay.tsx
│   │   │   ├── CreateLeadForm.tsx
│   │   │   ├── ExceptionRequestDialog.tsx
│   │   │   ├── FollowUpBadge.tsx
│   │   │   ├── FollowUpForm.tsx
│   │   │   ├── FollowUpHistory.tsx
│   │   │   ├── LeadDetailDialog.tsx
│   │   │   └── LeadTable.tsx
│   │   ├── layout/          # Layout components (Sidebar, AppLayout)
│   │   ├── notifications/   # Notification components (NotificationCenter)
│   │   ├── settings/        # Settings components
│   │   └── ui/              # Reusable UI components (shadcn/ui)
│   ├── contexts/           # React contexts (SystemSettingsContext)
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuditTrail.ts
│   │   ├── useExceptionRequests.ts
│   │   ├── useFollowUpAnalytics.ts
│   │   ├── useFollowUps.ts
│   │   ├── useNotifications.ts
│   │   └── ... (other hooks)
│   ├── integrations/       # External service integrations
│   │   └── supabase/       # Supabase client & types
│   ├── lib/                # Utility functions
│   ├── pages/              # Page components
│   └── types/              # TypeScript type definitions
├── supabase/
│   ├── functions/          # Edge Functions
│   │   ├── process-csv-import/      # Bulk upload processing
│   │   ├── process-followup-reminders/  # Automated reminder processing
│   │   ├── send-notification/      # Notification service
│   │   └── wpforms-webhook/        # Webhook handler
│   └── migrations/         # Database migrations
│       ├── 20250116000000_migrate_lead_sources_to_dynamic.sql
│       ├── 20250116000001_add_followup_tracking.sql
│       ├── 20250116000002_fix_followup_notes_rls.sql
│       ├── 20250116000003_add_notifications_and_reminders.sql
│       ├── 20250116000004_enhance_audit_trail.sql
│       ├── 20250116000005_enhance_profiles_and_security.sql
│       ├── 20250116000006_setup_followup_reminder_cron.sql
│       └── 20250116000007_fix_audit_trail_updated_by.sql
├── public/                 # Static assets
└── package.json           # Dependencies & scripts
```

---

## Core Modules & Features

### 1. Authentication & Authorization

**Location:** `src/pages/Auth.tsx`, `src/hooks/useAuth.tsx`

**Features:**
- Email/password authentication via Supabase Auth
- Automatic profile creation on signup
- Role-based access control (RBAC)
- Protected routes requiring authentication
- Session management

**User Roles:**
- `super_admin`: Full system access
- `admin`: Administrative access
- `manager`: Management access
- `salesperson`: Can view/manage assigned leads
- `viewer`: Read-only access

**Implementation:**
- Uses Supabase Auth for authentication
- RLS policies enforce role-based data access
- `ProtectedRoute` component wraps authenticated pages

---

### 2. Dashboard Module

**Location:** `src/pages/Dashboard.tsx`

**Features:**
- **Key Metrics Cards:**
  - Total Leads count
  - Conversion Rate percentage
  - Total Revenue (from converted leads)
  - Forecast Revenue (expected revenue)

- **Lead Pipeline Status Cards:**
  - New leads
  - Awaiting outreach
  - Low engagement
  - High interest
  - Converted
  - Closed

- **Charts:**
  - Revenue Chart (monthly revenue trends)
  - Channel Performance Chart (lead sources performance)

- **Academic Year Filtering:**
  - Filter all metrics by academic year
  - Default to current academic year

- **Action Buttons:**
  - Import (icon-only on mobile, text on desktop)
  - Export (icon-only on mobile, text on desktop)
  - Add Lead (icon-only on mobile, text on desktop)

**Data Sources:**
- `useDashboardStats()` hook
- `useChannelPerformance()` hook
- `useLeads()` hook

---

### 3. Leads Management Module

**Location:** `src/pages/Leads.tsx`, `src/components/leads/`

**Features:**

#### Lead List View
- **Filtering:**
  - All leads
  - Hot leads (is_hot flag)
  - By status (new, awaiting_outreach, low_engagement, high_interest, converted, **closed**)
  - By academic year
  - Search by name, email, or phone

- **Lead Table:**
  - Lead name & email
  - Source (channel) - now dynamic from `lead_sources` table
  - Status badge
  - Potential revenue
  - Created date
  - Follow-up count badge (X/3)
  - Actions menu (view, delete)
  - Bulk selection and actions

- **Bulk Actions:**
  - Bulk status update
  - Bulk assignment
  - Bulk delete (with confirmation dialog)

#### Lead Creation
- **CreateLeadForm Component:**
  - Full name (required)
  - Email (required, validated)
  - Phone (required)
  - Source selection (from dynamic `lead_sources` table)
  - Room choice selection
  - Stay duration selection
  - Academic year selection
  - DialogDescription for accessibility
  - Proper form validation and error handling

#### Lead Details Dialog
- **LeadDetailDialog Component:**
  - **Tabbed Interface:**
    - **Details Tab:**
      - View/edit lead information
      - Update lead status (with 3-follow-up validation)
      - Assign lead to team member
      - Toggle hot lead status
      - Follow-up count badge (X/3)
      - Next follow-up date display
    - **Follow-Ups Tab:**
      - Follow-up history timeline
      - Record new follow-up button
      - Follow-up form dialog
      - Delete follow-up (with confirmation)
    - **Notes Tab:**
      - View all notes
      - Add new notes
      - Real-time updates
    - **History Tab:**
      - Complete audit trail
      - Activity feed with timestamps
      - User attribution
      - Action details

  - **Mobile Optimizations:**
    - Bottom-anchored dialog on mobile
    - Drag handle for mobile interaction
    - Centered on desktop
    - Proper padding and scrolling

  - **Status Change Validation:**
    - Blocks closing lead with < 3 follow-ups
    - Shows AlertDialog warning
    - Option to record more follow-ups
    - Option to request exception
    - Early conversion allowed (waives requirement)

**Data Management:**
- `useLeads(academicYear?)` - Fetch leads with optional year filter
- `useCreateLead()` - Create new lead
- `useUpdateLead()` - Update lead details
- `useUpdateLeadStatus()` - Update status (auto-calculates revenue if converted)
- `useAssignLead()` - Assign lead to user
- `useDeleteLead()` - Delete lead (admin only, with AlertDialog confirmation)
- `useToggleHotLead()` - Mark/unmark as hot lead

**Lead Statuses:**
- `new`: Newly created lead
- `awaiting_outreach`: Waiting for initial contact
- `low_engagement`: Low engagement level
- `high_interest`: High interest, warm lead
- `converted`: Successfully converted to booking
- `closed`: Closed/lost lead (requires 3 follow-ups or exception)

**Lead Sources (Dynamic):**
- Managed through Settings → Lead Sources
- Default sources: Google Ads, Meta Ads, Website, Referral, WhatsApp, Email, TikTok
- WordPress form sources: Website - Contact Form, Website - Book Viewing, Website - Schedule Callback, Website - Deposit Payment ⭐ NEW
- Each source has: name, slug, icon, color, display_order, is_active
- Can be added, edited, deactivated by super_admin
- Validation ensures source exists before lead creation

**Room Choices:**
- `platinum`: Platinum studio (£8,500 base)
- `gold`: Gold studio (£7,000 base)
- `silver`: Silver studio (£5,500 base)
- `bronze`: Bronze studio (£4,500 base)
- `standard`: Standard room (£3,500 base)

**Stay Durations:**
- `51_weeks`: Full academic year (1x multiplier)
- `45_weeks`: 45 weeks (0.88x multiplier)
- `short_stay`: Short stay (0.4x multiplier)

**Revenue Calculation:**
- Revenue is calculated when status changes to "converted"
- Formula: `basePrice × durationMultiplier`
- Example: Platinum 51 weeks = £8,500 × 1 = £8,500

---

### 4. Follow-Up Tracking System ⭐ NEW

**Location:** `src/components/leads/FollowUpForm.tsx`, `src/components/leads/FollowUpHistory.tsx`, `src/components/leads/FollowUpBadge.tsx`, `src/hooks/useFollowUps.ts`

**Status:** ✅ Fully Implemented

**Features:**

#### Mandatory 3-Follow-Up Process
- **Business Rule:** All leads must have 3 follow-ups before being closed
- **Exception:** Early conversion is allowed (waives requirement)
- **Exception Workflow:** Admin approval required for early closure

#### Follow-Up Recording
- **Follow-Up Form:**
  - Follow-up number (auto-incremented, 1-10)
  - Follow-up type: Call, Email, WhatsApp, In-Person, Other
  - Follow-up date (defaults to now)
  - Outcome: Contacted, No Answer, Voicemail, Not Interested, Interested, Callback Requested, Wrong Contact Info
  - Notes (optional)
  - Next action date (optional)

- **Follow-Up History:**
  - Timeline view of all follow-ups
  - Shows follow-up number, type, date, outcome
  - Displays notes and next action date
  - Shows creator name
  - Delete option (elevated users only, with AlertDialog confirmation)

- **Follow-Up Badge:**
  - Displays current count (e.g., "2/3")
  - Color-coded: Green (3/3), Yellow (1-2/3), Red (0/3)
  - Visible in lead table and detail dialog

#### Status Change Enforcement
- **Validation Rules:**
  - Cannot close lead with < 3 follow-ups
  - AlertDialog warning when attempting to close early
  - Options: Record more follow-ups, Request exception, Cancel
  - Early conversion always allowed

#### Follow-Up Tracking Fields
- `followup_count`: Current number of follow-ups (0-10)
- `last_followup_date`: Date of most recent follow-up
- `next_followup_date`: Suggested next follow-up date

**Database:**
- `lead_followups` table with full history
- Automatic count updates via trigger
- Unique constraint on (lead_id, followup_number)

**Hooks:**
- `useFollowUps(leadId)` - Fetch all follow-ups for a lead
- `useCreateFollowUp()` - Record new follow-up
- `useDeleteFollowUp()` - Delete follow-up
- `useCanCloseLead(leadId)` - Check if lead can be closed

---

### 5. Follow-Up Reminders Automation ⭐ NEW

**Location:** `supabase/functions/process-followup-reminders/index.ts`

**Status:** ✅ Fully Implemented

**Features:**

#### Automated Reminder Processing
- **Edge Function:** `process-followup-reminders`
- **Schedule:** Runs every hour (via pg_cron or external scheduler)
- **Reminder Types:**
  1. **First Follow-Up Reminder:**
     - Trigger: 24-48 hours after lead creation
     - Condition: `followup_count = 0`
     - Notification: "New lead requires first follow-up"
  
  2. **Interval Reminders:**
     - Trigger: 3-5 days after last follow-up
     - Condition: `followup_count < 3`, status not converted/closed
     - Notification: "Lead ready for follow-up #X"
  
  3. **Overdue Follow-Up Alerts:**
     - Trigger: 5+ days since last follow-up
     - Condition: `followup_count < 3`, status not converted/closed
     - Notification: "Follow-up overdue for [Lead Name]"

#### Notification Delivery
- Creates in-app notifications
- Sends email notifications (if user preference enabled)
- Updates `last_notified_at` on leads table
- Respects user notification preferences

**Configuration:**
- Deployed as Supabase Edge Function
- Requires scheduled execution (pg_cron or external service)
- See `DEPLOY_INSTRUCTIONS.md` for setup

---

### 6. Exception Workflow System ⭐ NEW

**Location:** `src/components/leads/ExceptionRequestDialog.tsx`, `src/hooks/useExceptionRequests.ts`

**Status:** ✅ Fully Implemented

**Features:**

#### Exception Request Process
- **Trigger:** User attempts to close lead with < 3 follow-ups
- **Request Dialog:**
  - Reason selection: Duplicate, Invalid Contact Info, Spam/Fake, Other
  - Justification field (required)
  - Submit request

#### Admin Review
- **Admin Dashboard:** View pending exception requests
- **Actions:**
  - Approve: Lead can be closed immediately
  - Reject: Lead must complete 3 follow-ups
  - Review notes: Admin can add review notes

#### Notifications
- Request submitted → Admin notified
- Request approved → Requester notified
- Request rejected → Requester notified

**Database:**
- `exception_requests` table
- Status: pending, approved, rejected
- Tracks: requested_by, reviewed_by, reason, justification, review_notes

**Hooks:**
- `useExceptionRequests()` - Fetch all exception requests
- `useCreateExceptionRequest()` - Submit new request
- `useUpdateExceptionRequest()` - Approve/reject request

---

### 7. Notification System ⭐ NEW

**Location:** `src/components/notifications/NotificationCenter.tsx`, `src/components/settings/NotificationSettingsTab.tsx`, `src/hooks/useNotifications.ts`

**Status:** ✅ Fully Implemented

**Features:**

#### In-App Notification Center
- **Notification Bell:** In sidebar with unread badge
- **Notification Sheet:**
  - Unread notifications at top
  - Read notifications below
  - Mark as read / Mark all as read
  - Delete notification
  - Click to navigate to related lead
  - Real-time updates (30s polling)

#### Notification Types
- `new_lead_assigned`: New lead assigned to user
- `followup_reminder`: Follow-up reminder
- `overdue_followup`: Overdue follow-up alert
- `exception_approved`: Exception request approved
- `exception_rejected`: Exception request rejected

#### User Preferences
- **Settings Tab:** Notification preferences per type
- **Options:**
  - Enable/disable in-app notifications
  - Enable/disable email notifications
  - Enable/disable push notifications (future)

**Database:**
- `notifications` table
- `user_notification_settings` table
- Automatic notification creation via triggers

**Hooks:**
- `useNotifications()` - Fetch user notifications
- `useUnreadNotificationsCount()` - Get unread count
- `useMarkNotificationRead()` - Mark single as read
- `useMarkAllNotificationsRead()` - Mark all as read
- `useDeleteNotification()` - Delete notification
- `useNotificationPreferences()` - Get preferences
- `useUpdateNotificationPreferences()` - Update preferences

---

### 8. Follow-Up Analytics ⭐ NEW

**Location:** `src/components/analytics/FollowUpAnalytics.tsx`, `src/hooks/useFollowUpAnalytics.ts`

**Status:** ✅ Fully Implemented

**Features:**

#### Key Metrics
- **Compliance Rate:** % of closed leads with 3+ follow-ups
- **Average Follow-Ups to Conversion:** Efficiency metric
- **Time to First Follow-Up:** Average hours from creation to first follow-up
- **Average Follow-Up Interval:** Average hours between follow-ups
- **Follow-Up Response Rate:** % of successful contacts
- **Overdue Follow-Ups Count:** Leads needing immediate attention
- **Upcoming Follow-Ups Count:** Leads with scheduled follow-ups

#### Visualizations
- **Follow-Up Type Effectiveness:** Bar chart showing conversion by type
- **Overdue/Upcoming Alerts:** Highlighted cards for urgent items
- **Compliance Dashboard:** Visual compliance tracking

**Integration:**
- Integrated into Reports page
- Academic year filtering support
- Real-time data updates

**Hooks:**
- `useFollowUpAnalytics(academicYear?)` - Comprehensive analytics
- `useOverdueFollowups()` - List of overdue follow-ups

---

### 9. Enhanced Audit Trail ⭐ NEW

**Location:** `src/components/leads/AuditTrailDisplay.tsx`, `src/hooks/useAuditTrail.ts`

**Status:** ✅ Fully Implemented

**Features:**

#### Automatic Logging
- **Triggers:** Automatic logging via database triggers
- **Action Types:**
  - `lead_created`, `lead_updated`, `lead_status_changed`
  - `lead_assigned`, `lead_unassigned`, `lead_deleted`
  - `lead_hot_toggled`
  - `note_created`, `note_deleted`
  - `followup_created`, `followup_updated`, `followup_deleted`
  - `exception_requested`, `exception_approved`, `exception_rejected`

#### Audit Trail Display
- **History Tab:** In LeadDetailDialog
- **Activity Feed:**
  - Chronological list of all actions
  - User attribution
  - Timestamp
  - Action details
  - Old/new values for updates
  - Metadata for context

**Database:**
- Enhanced `audit_trail` table
- `audit_action_type` enum
- `old_value` and `new_value` JSONB columns
- `metadata` JSONB column
- Automatic triggers on all relevant tables

**Hooks:**
- `useAuditTrail(leadId)` - Fetch audit trail for a lead

---

### 10. Bulk Upload Module

**Location:** `src/pages/BulkUpload.tsx`, `supabase/functions/process-csv-import/`

**Features:**
- **CSV File Upload:**
  - Drag & drop interface
  - File input selection
  - CSV parsing with validation
  - Preview before upload

- **Data Validation:**
  - Email format validation
  - Required field validation
  - Duplicate detection (optional)
  - Error reporting per row

- **Academic Year Selection:**
  - Select academic year for imported leads
  - Defaults to system default year

- **Import Processing:**
  - Edge function processes uploads asynchronously
  - Batch inserts (100 rows per batch)
  - Progress tracking
  - Success/failure reporting

- **Import Tracking:**
  - `lead_imports` table tracks all imports
  - Status: pending → processing → completed
  - Success/failure counts
  - Error logs for failed rows

**CSV Format:**
Required columns:
- `full_name` (required)
- `email` (required, validated)
- `phone` (required)

Optional columns:
- `source`
- `room_choice`
- `stay_duration`
- `lead_status`
- `notes` or `latest_comment`
- `date_of_inquiry`
- `estimated_revenue`

**Edge Function:**
- `process-csv-import/index.ts`
- Validates and maps CSV data
- Inserts leads in batches
- Creates lead notes if provided
- Updates import record with results

---

### 11. Reports & Analytics Module

**Location:** `src/pages/Reports.tsx`

**Features:**
- **Summary Statistics:**
  - Total leads count
  - Conversion rate
  - Revenue generated

- **Monthly Performance Chart:**
  - Bar chart showing leads vs converted by month
  - Uses Recharts library

- **Room Distribution:**
  - Pie chart showing distribution of room choices
  - Percentage breakdown

- **Lead Status Breakdown:**
  - Horizontal bar chart
  - Shows count per status

- **Follow-Up Analytics:** ⭐ NEW
  - Compliance rate
  - Average follow-ups to conversion
  - Follow-up type effectiveness
  - Overdue/upcoming alerts

- **Academic Year Filtering:** ⭐ NEW
  - Filter all reports by academic year
  - Consistent with Dashboard filtering

- **Export Options:**
  - CSV export (planned)
  - PDF export (planned)

**Data Hooks:**
- `useDashboardStats()` - Overall statistics
- `useMonthlyLeadData()` - Monthly trends
- `useRoomDistribution()` - Room choice distribution
- `useStatusDistribution()` - Status distribution
- `useFollowUpAnalytics()` - Follow-up metrics

---

### 12. Settings Module

**Location:** `src/pages/Settings.tsx`, `src/components/settings/`

**Tabs:**
1. **System Settings:**
   - Academic years management
   - Default academic year
   - Currency settings
   - System configuration

2. **Lead Sources Management:** ⭐ NEW
   - Add/edit/delete lead sources
   - Set icons, colors, display order
   - Activate/deactivate sources
   - Validation prevents deletion of sources in use

3. **Users:**
   - User management (admin only)
   - Role assignment
   - User activation/deactivation

4. **Data Management:**
   - Delete all leads (super_admin only)
   - Data export options

5. **Profile:**
   - User profile information
   - Avatar management (planned)
   - Personal details

6. **Notifications:** ⭐ NEW
   - Notification preferences per type
   - Enable/disable in-app notifications
   - Enable/disable email notifications
   - Per-type toggles

7. **Security:**
   - Password change (UI ready, functionality planned)
   - Two-factor authentication (planned)
   - Active sessions management (planned)

8. **PWA:**
   - Install app information
   - Offline settings
   - Cache configuration

**System Settings Context:**
- `SystemSettingsContext` provides global access to:
  - Academic years list
  - Default academic year
  - Currency settings
  - Format currency helper function
  - Room configuration
  - Lead sources (dynamic)

---

## Database Schema

### Core Tables

#### `profiles`
User profile information linked to Supabase Auth users.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users, UNIQUE)
- `full_name` (TEXT)
- `email` (TEXT)
- `avatar_url` (TEXT, nullable)
- `phone` (TEXT, nullable) ⭐ NEW
- `last_login_at` (TIMESTAMPTZ, nullable) ⭐ NEW
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

#### `user_roles`
User role assignments (separate table for security).

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `role` (app_role ENUM)
- `created_at` (TIMESTAMPTZ)

**Roles:** super_admin, admin, manager, salesperson, viewer

#### `leads`
Main leads table storing all lead information.

**Columns:**
- `id` (UUID, PK)
- `full_name` (TEXT, required)
- `email` (TEXT, required)
- `phone` (TEXT, required)
- `source` (TEXT, required, default: 'website') ⭐ CHANGED from enum to TEXT
- `room_choice` (room_choice ENUM, default: 'silver')
- `stay_duration` (stay_duration ENUM, default: '51_weeks')
- `lead_status` (lead_status ENUM, default: 'new')
- `potential_revenue` (NUMERIC, default: 0)
- `academic_year` (TEXT, required, default: '2024/2025')
- `assigned_to` (UUID, FK → auth.users, nullable)
- `created_by` (UUID, FK → auth.users, nullable)
- `is_hot` (BOOLEAN, default: false)
- `followup_count` (INTEGER, default: 0) ⭐ NEW
- `last_followup_date` (TIMESTAMPTZ, nullable) ⭐ NEW
- `next_followup_date` (TIMESTAMPTZ, nullable) ⭐ NEW
- `last_notified_at` (TIMESTAMPTZ, nullable) ⭐ NEW
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_leads_status` on `lead_status`
- `idx_leads_source` on `source`
- `idx_leads_assigned_to` on `assigned_to`
- `idx_leads_created_at` on `created_at DESC`
- `idx_leads_academic_year` on `academic_year`
- `idx_leads_followup_count` on `followup_count` ⭐ NEW
- `idx_leads_next_followup` on `next_followup_date` ⭐ NEW

#### `lead_sources` ⭐ NEW
Dynamic lead source categories (replaces enum).

**Columns:**
- `id` (UUID, PK)
- `name` (TEXT, UNIQUE, required)
- `slug` (TEXT, UNIQUE, required)
- `icon` (TEXT, default: '📋')
- `color` (TEXT, default: '#6366f1')
- `is_active` (BOOLEAN, default: true)
- `display_order` (INTEGER, default: 0)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_lead_sources_slug` on `slug`
- `idx_lead_sources_is_active` on `is_active`

**Validation:**
- Trigger validates source exists before lead insert/update
- Cannot delete source if leads are using it (deactivate instead)

#### `lead_followups` ⭐ NEW
Follow-up history for leads.

**Columns:**
- `id` (UUID, PK)
- `lead_id` (UUID, FK → leads, CASCADE DELETE)
- `followup_number` (INTEGER, 1-10, required)
- `followup_type` (followup_type ENUM, required)
- `followup_date` (TIMESTAMPTZ, default: now())
- `outcome` (followup_outcome ENUM, required)
- `notes` (TEXT, nullable)
- `next_action_date` (TIMESTAMPTZ, nullable)
- `created_by` (UUID, FK → auth.users, nullable)
- `created_at` (TIMESTAMPTZ)

**Constraints:**
- `UNIQUE (lead_id, followup_number)` - One follow-up per number per lead

**Indexes:**
- `idx_lead_followups_lead_id` on `lead_id`
- `idx_lead_followups_created_at` on `created_at DESC`
- `idx_lead_followups_next_action` on `next_action_date`

**Triggers:**
- Auto-updates `followup_count`, `last_followup_date`, `next_followup_date` on leads table

#### `lead_notes`
Notes associated with leads.

**Columns:**
- `id` (UUID, PK)
- `lead_id` (UUID, FK → leads, CASCADE DELETE)
- `note` (TEXT, required)
- `created_by` (UUID, FK → auth.users, nullable)
- `created_at` (TIMESTAMPTZ)

**Index:** `idx_lead_notes_lead_id` on `lead_id`

#### `notifications` ⭐ NEW
In-app notifications for users.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users, required)
- `type` (notification_type ENUM, required)
- `title` (TEXT, required)
- `message` (TEXT, required)
- `lead_id` (UUID, FK → leads, nullable)
- `read` (BOOLEAN, default: false)
- `created_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_notifications_user_id` on `user_id`
- `idx_notifications_read` on `read`
- `idx_notifications_created_at` on `created_at DESC`

#### `user_notification_settings` ⭐ NEW
User notification preferences.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users, UNIQUE, required)
- `new_lead_assigned_in_app` (BOOLEAN, default: true)
- `new_lead_assigned_email` (BOOLEAN, default: true)
- `followup_reminder_in_app` (BOOLEAN, default: true)
- `followup_reminder_email` (BOOLEAN, default: true)
- `overdue_followup_in_app` (BOOLEAN, default: true)
- `overdue_followup_email` (BOOLEAN, default: true)
- `exception_approved_in_app` (BOOLEAN, default: true)
- `exception_approved_email` (BOOLEAN, default: true)
- `exception_rejected_in_app` (BOOLEAN, default: true)
- `exception_rejected_email` (BOOLEAN, default: true)
- `updated_at` (TIMESTAMPTZ)

#### `exception_requests` ⭐ NEW
Exception requests for early lead closure.

**Columns:**
- `id` (UUID, PK)
- `lead_id` (UUID, FK → leads, required)
- `requested_by` (UUID, FK → auth.users, required)
- `reason` (TEXT, required)
- `justification` (TEXT, required)
- `status` (TEXT: pending/approved/rejected, default: 'pending')
- `reviewed_by` (UUID, FK → auth.users, nullable)
- `review_notes` (TEXT, nullable)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_exception_requests_lead_id` on `lead_id`
- `idx_exception_requests_status` on `status`

#### `audit_trail`
Audit log for all lead actions. ⭐ ENHANCED

**Columns:**
- `id` (UUID, PK)
- `lead_id` (UUID, FK → leads, CASCADE DELETE)
- `action` (TEXT, required) - Legacy field
- `action_type` (audit_action_type ENUM, nullable) ⭐ NEW
- `user_id` (UUID, FK → auth.users, nullable)
- `old_value` (JSONB, nullable) ⭐ ENHANCED
- `new_value` (JSONB, nullable) ⭐ ENHANCED
- `metadata` (JSONB, nullable) ⭐ NEW
- `timestamp` (TIMESTAMPTZ)

**Indexes:**
- `idx_audit_trail_lead_id` on `lead_id`
- `idx_audit_trail_lead_id_action` on `(lead_id, action_type)` ⭐ NEW
- `idx_audit_trail_user_id` on `user_id` ⭐ NEW
- `idx_audit_trail_timestamp` on `timestamp DESC` ⭐ NEW

**Action Types:**
- `lead_created`, `lead_updated`, `lead_status_changed`
- `lead_assigned`, `lead_unassigned`, `lead_deleted`
- `lead_hot_toggled`
- `note_created`, `note_deleted`
- `followup_created`, `followup_updated`, `followup_deleted`
- `exception_requested`, `exception_approved`, `exception_rejected`

**Triggers:**
- `audit_lead_changes_trigger` - Logs all lead changes
- `audit_followup_changes_trigger` - Logs follow-up changes
- `audit_note_changes_trigger` - Logs note changes
- `audit_exception_changes_trigger` - Logs exception requests

#### `lead_imports`
Tracks bulk import operations.

**Columns:**
- `id` (UUID, PK)
- `file_name` (TEXT, required)
- `total_rows` (INTEGER, default: 0)
- `successful_rows` (INTEGER, default: 0)
- `failed_rows` (INTEGER, default: 0)
- `status` (TEXT, default: 'pending')
- `error_log` (JSONB, nullable)
- `created_by` (UUID, FK → auth.users, nullable)
- `created_at` (TIMESTAMPTZ)
- `completed_at` (TIMESTAMPTZ, nullable)

#### `system_settings`
System-wide configuration settings.

**Columns:**
- `setting_key` (TEXT, PK)
- `setting_value` (JSONB, required)

**Current Settings:**
- `academic_years`: Array of available academic years
- `default_academic_year`: Default year for new leads
- `currency`: Currency configuration

### Enums

**lead_status:**
- new
- awaiting_outreach
- low_engagement
- high_interest
- converted
- closed

**followup_type:** ⭐ NEW
- call
- email
- whatsapp
- in_person
- other

**followup_outcome:** ⭐ NEW
- contacted
- no_answer
- voicemail
- not_interested
- interested
- callback_requested
- wrong_contact_info

**notification_type:** ⭐ NEW
- new_lead_assigned
- followup_reminder
- overdue_followup
- exception_approved
- exception_rejected

**audit_action_type:** ⭐ NEW
- lead_created, lead_updated, lead_status_changed
- lead_assigned, lead_unassigned, lead_deleted
- lead_hot_toggled
- note_created, note_deleted
- followup_created, followup_updated, followup_deleted
- exception_requested, exception_approved, exception_rejected

**room_choice:**
- platinum
- gold
- silver
- bronze
- standard

**stay_duration:**
- 51_weeks
- 45_weeks
- short_stay

**app_role:**
- super_admin
- admin
- manager
- salesperson
- viewer

---

## User Roles & Permissions

### Row Level Security (RLS) Policies

#### Leads Table

**SELECT Policies:**
- **All authenticated users:** Can view all leads ⭐ UPDATED

**INSERT Policies:**
- All authenticated users can create leads

**UPDATE Policies:**
- **All authenticated users:** Can update all leads ⭐ UPDATED

**DELETE Policies:**
- **All authenticated users:** Can delete leads ⭐ UPDATED

#### Lead Follow-Ups ⭐ NEW

**SELECT Policies:**
- All authenticated users can view all follow-ups

**INSERT Policies:**
- All authenticated users can create follow-ups (must be creator)

**UPDATE Policies:**
- Users can update accessible follow-ups

**DELETE Policies:**
- Users can delete accessible follow-ups

#### Lead Notes

**SELECT Policies:**
- All authenticated users can view all lead notes ⭐ UPDATED

**INSERT Policies:**
- Authenticated users can create notes (must be creator)

#### Notifications ⭐ NEW

**SELECT Policies:**
- Users can view only their own notifications

**INSERT Policies:**
- System can create notifications (via triggers/functions)

**UPDATE Policies:**
- Users can update only their own notifications

**DELETE Policies:**
- Users can delete only their own notifications

#### Exception Requests ⭐ NEW

**SELECT Policies:**
- Users can view their own requests
- Admins/managers can view all requests

**INSERT Policies:**
- Authenticated users can create requests

**UPDATE Policies:**
- Admins/managers can update (approve/reject) requests

#### Audit Trail

**SELECT Policies:**
- Only elevated users can view audit trail

**INSERT Policies:**
- System can insert audit records (via triggers)

#### Lead Sources ⭐ NEW

**SELECT Policies:**
- All authenticated users can view active sources
- Admins can view all sources (including inactive)

**INSERT/UPDATE/DELETE Policies:**
- Only super_admin can manage sources

#### Lead Imports

**SELECT Policies:**
- Users can view own imports
- Elevated users can view all imports

**INSERT Policies:**
- Authenticated users can create imports (must be creator)

---

## API & Integrations

### Supabase Integration

**Client Setup:** `src/integrations/supabase/client.ts`
- Supabase client initialization
- Environment variables for URL and anon key

**Type Generation:** `src/integrations/supabase/types.ts`
- Auto-generated TypeScript types from database schema
- Used throughout application for type safety

### Edge Functions

#### `process-csv-import`
**Purpose:** Process bulk CSV imports asynchronously

**Input:**
```typescript
{
  rows: CSVRow[];
  importId: string;
  userId: string;
  academicYear?: string;
}
```

**Process:**
1. Validates all rows
2. Maps CSV data to lead format
3. Batch inserts leads (100 per batch)
4. Creates lead notes if provided
5. Updates import record with results

**Output:**
```typescript
{
  success: boolean;
  successCount: number;
  failCount: number;
  errors: Array<{row: number; error: string}>;
}
```

#### `process-followup-reminders` ⭐ NEW
**Purpose:** Automated follow-up reminder processing

**Schedule:** Runs every hour (via pg_cron or external scheduler)

**Process:**
1. Finds leads needing first follow-up (24-48h after creation, followup_count = 0)
2. Finds leads with overdue follow-ups (5+ days since last, followup_count < 3)
3. Finds leads ready for next follow-up (3-5 days since last, followup_count < 3)
4. Creates in-app notifications
5. Sends email notifications (if user preference enabled)
6. Updates `last_notified_at` on leads

**Configuration:**
- See `DEPLOY_INSTRUCTIONS.md` for deployment and scheduling

#### `send-notification`
**Purpose:** Send notifications for lead events

**Events:**
- Status change
- Lead assignment
- Hot lead updates
- Exception request status changes ⭐ NEW

#### `wordpress-webhook` ⭐ NEW
**Purpose:** Handle webhook submissions from WordPress forms (Elementor Forms and WP Forms)

**Location:** `supabase/functions/wordpress-webhook/index.ts`

**Supported Form Types:**
1. **Contact Forms** (`web_contact`) - General contact/inquiry forms
2. **Book Viewing Forms** (`web_booking`) - Forms for scheduling property viewings
3. **Schedule Callback Forms** (`web_callback`) - Forms for requesting callbacks
4. **Deposit Payment Forms** (`web_deposit`) - Paid deposit forms (automatically marked as converted)

**Input Format:**
```typescript
{
  full_name?: string;
  name?: string; // Alternative to full_name
  email: string; // Required
  phone?: string;
  form_type?: "contact" | "booking" | "callback" | "deposit";
  form_name?: string;
  room_choice?: string;
  stay_duration?: string;
  academic_year?: string;
  message?: string;
  preferred_date?: string;
  preferred_time?: string;
  deposit_amount?: number;
  payment_status?: string;
}
```

**Process:**
1. Validates required fields (email)
2. Detects form type from `form_type` or `form_name`
3. Maps form type to lead source (e.g., `web_contact`, `web_booking`)
4. Validates lead source exists in `lead_sources` table
5. Creates lead with appropriate status:
   - Deposit forms → `lead_status: "converted"`, `is_hot: true`
   - Other forms → `lead_status: "new"`
6. Creates lead note with additional form data (message, preferred dates, etc.)
7. Triggers email notification for new leads (not deposits)

**Special Behavior:**
- **Deposit Forms:** Automatically marked as converted leads with `is_hot: true`
- **Form Type Detection:** If `form_type` not provided, detects from `form_name` keywords
- **Academic Year:** Auto-detects current academic year if not provided
- **Revenue:** Set from `deposit_amount` for deposit forms, otherwise 0

**Webhook URL:**
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/wordpress-webhook
```

**Documentation:** See `WORDPRESS_INTEGRATION.md` for complete setup instructions

**Lead Sources Added:**
- `web_contact` - Web - Contact Form
- `web_booking` - Web - Book Viewing
- `web_callback` - Web - Schedule Callback
- `web_deposit` - Web - Deposit Payment

**Migration:** `20250116000010_add_wordpress_form_sources.sql`

---

## UI/UX Guidelines

### Design System

**Color Palette:**
- Primary: `#51A6FF` (Blue)
- Success: Green
- Warning: Yellow
- Destructive: Red
- Muted: Gray

**Typography:**
- Display Font: "Big Shoulders Display"
- Body Font: "Inter Tight"

**Components:**
- All UI components from shadcn/ui library
- Consistent spacing and sizing
- Card-based layouts with shadows
- Responsive grid systems

### Mobile Responsiveness ⭐ ENHANCED

**Guidelines:**
- Columns in desktop → rows on mobile
- Flex layout for form fields
- **Dialog forms enter from bottom on mobile** ⭐ NEW
- **Bottom-anchored dialogs with drag handle** ⭐ NEW
- **Icon-only buttons on mobile, text on desktop** ⭐ NEW
- Margin bottom zero for mobile dialogs
- Touch-friendly button sizes (min 44px)
- **Hamburger icon yellow background on scroll** ⭐ NEW

**Mobile-Specific Features:**
- Lead detail dialog: Bottom-anchored on mobile, centered on desktop
- Action buttons: Icons only on mobile (Import, Export, Add Lead)
- Sidebar hamburger: Yellow background when scrolled (distinguishable from page)
- Scrollbar styling: Thin, subtle scrollbars

### User Experience ⭐ ENHANCED

**Loading States:**
- Skeleton loaders for data fetching
- Progress indicators for uploads
- Toast notifications for actions
- **Progress bars for long content** ⭐ NEW

**Error Handling:**
- User-friendly error messages
- Validation feedback on forms
- Graceful degradation
- **AlertDialogs for confirmations (replaces browser dialogs)** ⭐ NEW

**Accessibility:**
- Semantic HTML
- ARIA labels where needed
- **DialogDescription for all dialogs** ⭐ NEW
- Keyboard navigation support
- Screen reader friendly

**Confirmation Dialogs:**
- **All browser `confirm()` replaced with AlertDialog** ⭐ NEW
- Single lead delete confirmation
- Bulk delete confirmation
- Follow-up delete confirmation
- Consistent styling and messaging

---

## Known Issues & Fixes

### ✅ Fixed Issues

#### 1. Leads Not Loading After Bulk Upload
**Status:** FIXED  
**Date:** 2025-01-15  
**Issue:** After successful bulk upload, leads were not appearing in the leads list  
**Root Cause:** Query invalidation was not properly refreshing the leads query with academic year filter  
**Solution:** 
- Updated `BulkUpload.tsx` to explicitly invalidate all leads queries
- Added explicit refetch for current academic year's leads
- Code location: `src/pages/BulkUpload.tsx` lines 284-287

#### 2. Follow-Ups and Notes Not Appearing Immediately ⭐ NEW
**Status:** FIXED  
**Date:** 2025-01-16  
**Issue:** Follow-ups and notes not showing immediately after creation  
**Root Cause:** RLS policies and query caching issues  
**Solution:**
- Fixed RLS policies to allow all authenticated users to view all follow-ups and notes
- Added `staleTime: 0` and `refetchOnWindowFocus: true` to queries
- Implemented proper query invalidation on create
- Fixed `created_by` foreign key relationship by fetching profiles separately

#### 3. Invalid Lead Source Error ⭐ NEW
**Status:** FIXED  
**Date:** 2025-01-16  
**Issue:** 400 error when creating leads - "Invalid lead source"  
**Root Cause:** Source field not properly controlled in form, validation trigger checking non-existent source  
**Solution:**
- Made source field properly controlled with react-hook-form
- Added validation to ensure source exists before submission
- Improved error handling with specific error messages
- Added fallback to default source

#### 4. Audit Trail Function Error ⭐ NEW
**Status:** FIXED  
**Date:** 2025-01-16  
**Issue:** Error: "record 'new' has no field 'updated_by'"  
**Root Cause:** Audit trail function referenced `updated_by` field that doesn't exist in leads table  
**Solution:**
- Created migration `20250116000007_fix_audit_trail_updated_by.sql`
- Removed `updated_by` references from `audit_lead_changes()` function
- Uses `created_by` instead for user attribution

#### 5. Manifest.webmanifest Syntax Error
**Status:** FIXED  
**Date:** 2025-01-15  
**Issue:** Missing manifest file causing browser error  
**Solution:** Created `public/manifest.webmanifest` with proper JSON structure

#### 6. Deprecated Meta Tag Warning
**Status:** FIXED  
**Date:** 2025-01-15  
**Issue:** `apple-mobile-web-app-capable` deprecated  
**Solution:** Added `mobile-web-app-capable` meta tag alongside existing tag

#### 7. React Router Future Flag Warnings
**Status:** FIXED  
**Date:** 2025-01-15  
**Issue:** React Router v7 migration warnings  
**Solution:** Added future flags to BrowserRouter:
- `v7_startTransition: true`
- `v7_relativeSplatPath: true`

### 🔄 Active Issues

None currently.

### 📋 Planned Fixes

None currently.

---

## Future Enhancements

### Short-term (Next Sprint)

1. **Export Functionality**
   - CSV export for leads
   - PDF report generation
   - Custom date range exports

2. **Advanced Filtering**
   - Multi-criteria filtering
   - Saved filter presets
   - Filter by follow-up count
   - Filter by overdue follow-ups
   - Filter by next follow-up date
   - Date range filtering

3. **Profile Management**
   - Avatar upload functionality
   - Profile picture management
   - Phone number editing

4. **Security Features**
   - Password change functionality
   - Two-factor authentication UI
   - Active sessions management UI

### Medium-term (Next Quarter)

1. **Email Integration**
   - Email templates system
   - Email history per lead
   - Email tracking (opens, clicks)
   - Automated follow-up emails
   - Bulk email campaigns

2. **Calendar Integration**
   - Calendar view component
   - Appointment scheduling
   - Calendar sync (Google Calendar, Outlook)
   - Follow-up scheduling with calendar availability

3. **Team Performance Analytics**
   - User performance metrics
   - Team comparison charts
   - Individual user dashboards
   - Leaderboards
   - Activity tracking per user

4. **Advanced Analytics**
   - Conversion funnel analysis
   - Lead source ROI
   - Follow-up effectiveness by type
   - Time-to-conversion analysis

### Long-term (Future)

1. **Mobile App**
   - Native iOS/Android apps
   - Offline-first architecture
   - Push notifications

2. **AI Features**
   - Lead scoring
   - Predictive analytics
   - Automated responses
   - Follow-up recommendations

3. **Integrations**
   - CRM integrations (Salesforce, HubSpot)
   - Marketing automation
   - Payment processing

4. **Multi-tenant Support**
   - Organization management
   - White-label options
   - Custom branding

---

## Development Guidelines

### Code Standards

1. **TypeScript:** Strict typing, no `any` types
2. **React Hooks:** Use custom hooks for data fetching
3. **Error Handling:** Try-catch blocks, user-friendly messages
4. **Code Organization:** Feature-based structure
5. **Naming:** Descriptive, camelCase for variables, PascalCase for components

### Git Workflow

1. Feature branches from `main`
2. Descriptive commit messages
3. PR reviews before merge
4. Update PRD when adding features

### Testing

1. Manual testing for all features
2. Test on multiple browsers
3. Mobile device testing
4. Performance testing for bulk operations

### Deployment

1. Build: `npm run build`
2. Preview: `npm run preview`
3. Production: Deploy to hosting platform
4. Environment variables: Set Supabase credentials
5. **Edge Functions:** Deploy via Supabase CLI or Dashboard
6. **Scheduled Jobs:** Set up pg_cron or external scheduler for reminders

---

## Changelog

### 2025-01-16 (Version 2.0)
- ✅ **Follow-Up Tracking System** - Complete implementation
  - Mandatory 3-follow-up process
  - Follow-up recording and history
  - Status change enforcement
  - Follow-up badge display
- ✅ **Follow-Up Reminders Automation** - Edge function deployed
  - Automated first follow-up reminders (24-48h)
  - Interval reminders (3-5 days)
  - Overdue follow-up alerts
- ✅ **Exception Workflow** - Admin approval system
  - Exception request dialog
  - Admin review and approval/rejection
  - Notifications for status changes
- ✅ **Notification System** - Complete implementation
  - In-app notification center
  - User notification preferences
  - Real-time updates (30s polling)
  - Email notification support
- ✅ **Follow-Up Analytics** - Comprehensive metrics
  - Compliance rate tracking
  - Average follow-ups to conversion
  - Follow-up type effectiveness
  - Overdue/upcoming alerts
- ✅ **Enhanced Audit Trail** - Automatic logging
  - All lead actions logged automatically
  - Activity feed in lead detail dialog
  - User attribution and timestamps
- ✅ **Dynamic Lead Sources** - Manageable categories
  - Lead sources table (replaces enum)
  - Add/edit/delete sources in settings
  - Validation and deactivation support
- ✅ **Mobile UI Improvements**
  - Bottom-anchored dialogs on mobile
  - Icon-only buttons on mobile
  - Hamburger icon scroll behavior
  - Improved mobile responsiveness
- ✅ **UI/UX Enhancements**
  - AlertDialogs replacing browser confirms
  - DialogDescription for accessibility
  - Improved error handling
  - Better loading states
- ✅ **Database Fixes**
  - Fixed audit trail `updated_by` error
  - Fixed follow-up/notes RLS policies
  - Fixed source validation
- ✅ **Closed Status Tab** - Added to leads pages

### 2025-01-15 (Version 1.0)
- Fixed leads not loading after bulk upload
- Created manifest.webmanifest file
- Fixed deprecated meta tag warning
- Added React Router future flags
- Created comprehensive PRD document

---

## Contact & Support

**Project:** ISKA Leads CRM  
**Repository:** iskaleadscrm-main  
**Framework:** React + TypeScript + Supabase  
**Last Major Update:** January 16, 2025

---

**End of PRD**
