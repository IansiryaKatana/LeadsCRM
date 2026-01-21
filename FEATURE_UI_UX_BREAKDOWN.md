# Feature UI/UX Breakdown

## 1. 🔍 Advanced Search & Filters

### Current State
- Basic search bar (name, email, phone)
- Filter button exists but not functional
- Status tabs (All, Hot, New, High Interest, Converted, Closed)
- Academic year selector

### Enhanced Implementation

#### **A. Filter Panel (Slide-out from Filter Button)**

**Location:** Next to search bar in `LeadTable.tsx` (line 298-300)

**UI Component:**
```
┌─────────────────────────────────────────────────┐
│  [Search Bar]  [Filter Button 🔽]              │
└─────────────────────────────────────────────────┘
```

**When Filter Button Clicked:**
```
┌─────────────────────────────────────────────────┐
│  Filters                              [×]      │
├─────────────────────────────────────────────────┤
│  ┌─ Status ─────────────────────────────────┐  │
│  │ ☐ New                                    │  │
│  │ ☐ High Interest                          │  │
│  │ ☐ Converted                              │  │
│  │ ☐ Closed                                 │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌─ Source ─────────────────────────────────┐  │
│  │ [Select Source ▼]                        │  │
│  │ • Google Ads                              │  │
│  │ • Meta Ads                                │  │
│  │ • Web - Contact Form                     │  │
│  │ • Web - Book Viewing                     │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌─ Room Choice ────────────────────────────┐  │
│  │ [Select Room Type ▼]                     │  │
│  │ • Platinum Studio                        │  │
│  │ • Gold Studio                            │  │
│  │ • Silver Studio                          │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌─ Date Range ─────────────────────────────┐  │
│  │ From: [Date Picker]                      │  │
│  │ To:   [Date Picker]                      │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌─ Assigned To ────────────────────────────┐  │
│  │ [Select User ▼]                          │  │
│  │ • John Doe                               │  │
│  │ • Jane Smith                             │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌─ Additional Filters ─────────────────────┐  │
│  │ ☑ Hot Leads Only                         │  │
│  │ ☐ Has Overdue Follow-ups                 │  │
│  │ ☐ Has Notes                              │  │
│  │ ☐ Has Revenue > [Input: £0]             │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  [Clear All]              [Apply Filters]      │
└─────────────────────────────────────────────────┘
```

**Design Pattern:**
- Use existing `Dialog` component (like `LeadDetailDialog`)
- Use existing `Select` components (like in `Leads.tsx`)
- Use existing `Checkbox` components (like in `LeadTable.tsx`)
- Use existing `Button` variants
- Slide-out panel on desktop, full-screen on mobile

**Active Filters Display:**
```
┌─────────────────────────────────────────────────┐
│  Active Filters:                                │
│  [Status: New ×] [Source: Google Ads ×]        │
│  [Date: Jan 1-31 ×] [Clear All]                │
└─────────────────────────────────────────────────┘
```

**Saved Filter Presets:**
```
┌─────────────────────────────────────────────────┐
│  Saved Filters:                                 │
│  • My Hot Leads                                 │
│  • This Week's New Leads                        │
│  • Overdue Follow-ups                           │
│  [+ Save Current Filters]                       │
└─────────────────────────────────────────────────┘
```

#### **B. Enhanced Search Bar**

**Current:** Basic text search
**Enhanced:** Full-text search with suggestions

```
┌─────────────────────────────────────────────────┐
│  🔍 Search leads, emails, phones, notes...     │
│                                                 │
│  Suggestions:                                   │
│  • john@example.com                            │
│  • +447700123456                               │
│  • "Platinum Studio"                          │
└─────────────────────────────────────────────────┘
```

**Search Operators:**
- `status:new` - Filter by status
- `source:google` - Filter by source
- `hot:true` - Hot leads only
- `revenue:>5000` - Revenue greater than
- `date:2025-01` - Date range

---

## 2. 📅 Calendar Integration

### Current State
- Calendar icon used for academic year selector
- Follow-up dates tracked but no calendar view
- No scheduling interface

### Enhanced Implementation

#### **A. Calendar View Page**

**New Route:** `/calendar` (add to sidebar navigation)

**UI Layout:**
```
┌─────────────────────────────────────────────────┐
│  Calendar                          [+ New]     │
├─────────────────────────────────────────────────┤
│  [Month View] [Week View] [Day View] [List]    │
│                                                 │
│  ┌──────────────────────────────────────────┐ │
│  │  January 2025                             │ │
│  │  [<] [Today] [>]                          │ │
│  ├───┬───┬───┬───┬───┬───┬───┐              │ │
│  │ S │ M │ T │ W │ T │ F │ S │              │ │
│  ├───┼───┼───┼───┼───┼───┼───┤              │ │
│  │   │   │   │ 1 │ 2 │ 3 │ 4 │              │ │
│  │   │   │   │ 📞 │ 📞 │ 📞 │              │ │
│  │   │   │   │ 2  │ 1  │ 3  │              │ │
│  ├───┼───┼───┼───┼───┼───┼───┤              │ │
│  │ 5 │ 6 │ 7 │ 8 │ 9 │10 │11 │              │ │
│  │ 📅│   │ 📞│   │ 📅│   │   │              │ │
│  │ 1 │   │ 2 │   │ 1 │   │   │              │ │
│  └───┴───┴───┴───┴───┴───┴───┘              │ │
│                                                 │
│  Legend:                                        │
│  📞 Follow-up    📅 Viewing    📋 Task         │
└─────────────────────────────────────────────────┘
```

**Design Pattern:**
- Use existing `Card` component for calendar grid
- Use existing `Badge` components for event counts
- Use existing `Button` components for navigation
- Use existing date picker from `react-day-picker` (already in dependencies)

#### **B. Calendar Event Types**

**1. Follow-ups (Existing)**
- Display as phone icon (📞)
- Color: Primary blue
- Click → Opens lead detail dialog

**2. Viewings (New)**
- Display as calendar icon (📅)
- Color: Success green
- Click → Opens viewing details

**3. Callbacks (New)**
- Display as clock icon (🕐)
- Color: Warning orange
- Click → Opens callback details

**4. Tasks (New)**
- Display as checkmark icon (✓)
- Color: Muted gray
- Click → Opens task details

#### **C. Create Event Dialog**

**Trigger:** Click "+ New" button or click empty calendar slot

**UI Component:**
```
┌─────────────────────────────────────────────────┐
│  Schedule Event                         [×]    │
├─────────────────────────────────────────────────┤
│  Event Type:                                    │
│  ○ Follow-up    ○ Viewing    ○ Callback        │
│  ○ Task                                          │
│                                                 │
│  ┌─ Viewing Details ────────────────────────┐  │
│  │ Lead: [Select Lead ▼]                    │  │
│  │ Date: [Date Picker]                      │  │
│  │ Time: [Time Picker]                      │  │
│  │ Duration: [30 min ▼]                    │  │
│  │ Location: [Input]                        │  │
│  │ Notes: [Textarea]                        │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌─ Calendar Sync ──────────────────────────┐  │
│  │ ☑ Add to Google Calendar                 │  │
│  │ ☑ Add to Outlook Calendar                │  │
│  │ ☑ Send reminder email                    │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  [Cancel]                    [Create Event]    │
└─────────────────────────────────────────────────┘
```

**Design Pattern:**
- Use existing `Dialog` component (like `LeadDetailDialog`)
- Use existing `Select` components
- Use existing `Input` and `Textarea` components
- Use existing `RadioGroup` for event type selection
- Use existing date picker

#### **D. Calendar Integration in Lead Detail Dialog**

**Add to Lead Detail Dialog Tabs:**
```
┌─────────────────────────────────────────────────┐
│  [Details] [Follow-ups] [Calendar] [Notes]     │
├─────────────────────────────────────────────────┤
│  Calendar Events                                │
│                                                 │
│  ┌─ Upcoming Events ────────────────────────┐  │
│  │ 📅 Viewing - Jan 15, 2025 2:00 PM       │  │
│  │    Location: Property A                 │  │
│  │    [Edit] [Cancel]                      │  │
│  │                                          │  │
│  │ 📞 Follow-up - Jan 16, 2025 10:00 AM    │  │
│  │    [Reschedule]                         │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  [+ Schedule Viewing]  [+ Schedule Callback]   │
└─────────────────────────────────────────────────┘
```

**Design Pattern:**
- Use existing `Tabs` component
- Use existing `Card` components for event items
- Use existing `Button` components

#### **E. Calendar Widget in Dashboard**

**Add to Dashboard:**
```
┌─────────────────────────────────────────────────┐
│  Today's Schedule                               │
├─────────────────────────────────────────────────┤
│  📞 10:00 AM - Follow-up: John Smith           │
│  📅 2:00 PM  - Viewing: Sarah Johnson          │
│  📋 4:00 PM  - Task: Review leads              │
│                                                 │
│  [View Full Calendar →]                        │
└─────────────────────────────────────────────────┘
```

---

## 3. ✅ Task Management

### Current State
- Notes exist (text-based)
- Follow-ups exist (structured)
- No dedicated task system

### Enhanced Implementation

#### **A. Tasks Tab in Lead Detail Dialog**

**Add to Lead Detail Dialog:**
```
┌─────────────────────────────────────────────────┐
│  [Details] [Follow-ups] [Tasks] [Notes]        │
├─────────────────────────────────────────────────┤
│  Tasks                                          │
│                                                 │
│  ┌─ Active Tasks ───────────────────────────┐ │
│  │ ☐ Send property brochure                  │ │
│  │    Due: Jan 15, 2025                     │ │
│  │    Assigned to: You                      │ │
│  │    [Complete] [Edit]                     │ │
│  │                                            │ │
│  │ ☐ Follow up on deposit payment            │ │
│  │    Due: Jan 16, 2025                     │ │
│  │    Assigned to: Jane Smith               │ │
│  │    [Complete] [Edit]                     │ │
│  └──────────────────────────────────────────┘ │
│                                                 │
│  ┌─ Completed Tasks ────────────────────────┐ │
│  │ ☑ Initial contact made                   │ │
│  │    Completed: Jan 10, 2025               │ │
│  │    [Reopen]                              │ │
│  └──────────────────────────────────────────┘ │
│                                                 │
│  [+ Create Task]                               │
└─────────────────────────────────────────────────┘
```

**Design Pattern:**
- Use existing `Tabs` component
- Use existing `Checkbox` components for task completion
- Use existing `Card` components for task items
- Use existing `Badge` components for due dates
- Use existing `Button` components

#### **B. Create Task Dialog**

**Trigger:** Click "+ Create Task" button

**UI Component:**
```
┌─────────────────────────────────────────────────┐
│  Create Task                            [×]    │
├─────────────────────────────────────────────────┤
│  Task Title:                                    │
│  [Input: "Send property brochure"]              │
│                                                 │
│  Description:                                    │
│  [Textarea: "Email brochure to lead..."]       │
│                                                 │
│  Due Date:                                       │
│  [Date Picker] [Time Picker (optional)]         │
│                                                 │
│  Priority:                                       │
│  ○ Low    ○ Medium    ● High                   │
│                                                 │
│  Assigned To:                                    │
│  [Select User ▼]                                │
│  • You                                           │
│  • John Doe                                      │
│  • Jane Smith                                    │
│                                                 │
│  Related Lead:                                   │
│  [Auto-filled from context]                     │
│                                                 │
│  ┌─ Reminders ───────────────────────────────┐  │
│  │ ☑ Email reminder 1 day before            │  │
│  │ ☑ Push notification on due date           │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  [Cancel]                    [Create Task]      │
└─────────────────────────────────────────────────┘
```

**Design Pattern:**
- Use existing `Dialog` component
- Use existing `Input` and `Textarea` components
- Use existing `Select` components
- Use existing `RadioGroup` for priority
- Use existing `Checkbox` components for reminders
- Use existing date picker

#### **C. Tasks Page (Global View)**

**New Route:** `/tasks` (add to sidebar navigation)

**UI Layout:**
```
┌─────────────────────────────────────────────────┐
│  Tasks                              [+ New]     │
├─────────────────────────────────────────────────┤
│  [All] [My Tasks] [Overdue] [Completed]         │
│                                                 │
│  ┌─ Today ───────────────────────────────────┐ │
│  │ ☐ Send property brochure                  │ │
│  │    Lead: John Smith                       │ │
│  │    Due: Today 2:00 PM                     │ │
│  │    Priority: High 🔴                      │ │
│  │    [Complete] [View Lead]                 │ │
│  └──────────────────────────────────────────┘ │
│                                                 │
│  ┌─ This Week ───────────────────────────────┐ │
│  │ ☐ Follow up on deposit                   │ │
│  │    Lead: Sarah Johnson                    │ │
│  │    Due: Jan 16, 2025                     │ │
│  │    Priority: Medium 🟡                   │ │
│  └──────────────────────────────────────────┘ │
│                                                 │
│  ┌─ Overdue ─────────────────────────────────┐ │
│  │ ☐ Review contract                         │ │
│  │    Lead: Michael Brown                    │ │
│  │    Due: Jan 10, 2025 (5 days ago)        │ │
│  │    Priority: High 🔴                      │ │
│  └──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Design Pattern:**
- Use existing `Tabs` component for filtering
- Use existing `Card` components for task groups
- Use existing `Badge` components for priority indicators
- Use existing `Button` components
- Use existing table/list patterns from `LeadTable`

#### **D. Task Templates**

**Quick Task Creation:**
```
┌─────────────────────────────────────────────────┐
│  Quick Tasks                                    │
├─────────────────────────────────────────────────┤
│  [Send Brochure]  [Schedule Viewing]           │
│  [Follow Up]      [Request Documents]          │
│  [Send Contract]  [Custom Task...]             │
└─────────────────────────────────────────────────┘
```

**Template Dialog:**
```
┌─────────────────────────────────────────────────┐
│  Create Task from Template              [×]    │
├─────────────────────────────────────────────────┤
│  Template: "Send Property Brochure"            │
│                                                 │
│  Pre-filled:                                    │
│  • Title: Send property brochure                │
│  • Description: Email brochure to lead...      │
│  • Due: 1 day from now                         │
│                                                 │
│  Customize:                                     │
│  [Edit fields...]                              │
│                                                 │
│  [Cancel]              [Create Task]            │
└─────────────────────────────────────────────────┘
```

#### **E. Task Widget in Dashboard**

**Add to Dashboard:**
```
┌─────────────────────────────────────────────────┐
│  My Tasks                                        │
├─────────────────────────────────────────────────┤
│  ☐ Send property brochure                       │
│     Due: Today 2:00 PM                          │
│                                                  │
│  ☐ Follow up on deposit                         │
│     Due: Tomorrow                               │
│                                                  │
│  [View All Tasks →]                             │
└─────────────────────────────────────────────────┘
```

---

## 🎨 Design Consistency

All features will use:

1. **Existing Components:**
   - `Dialog` - For modals
   - `Card` - For containers
   - `Button` - For actions
   - `Input`, `Textarea` - For forms
   - `Select` - For dropdowns
   - `Checkbox` - For selections
   - `Badge` - For status indicators
   - `Tabs` - For navigation
   - `Table` - For lists

2. **Existing Patterns:**
   - Same color scheme (primary blue, success green, warning orange)
   - Same spacing and padding
   - Same border radius (rounded-2xl, rounded-lg)
   - Same shadow styles (shadow-card)
   - Same typography (font-display for headings)

3. **Mobile Responsiveness:**
   - Dialogs slide from bottom on mobile
   - Filters become full-screen on mobile
   - Calendar becomes scrollable list on mobile
   - Tasks stack vertically on mobile

4. **Accessibility:**
   - Keyboard navigation
   - Screen reader support
   - Focus management
   - ARIA labels

---

## 📱 Mobile Adaptations

### Filters
- Full-screen dialog on mobile
- Bottom sheet pattern
- Swipe to dismiss

### Calendar
- List view by default on mobile
- Tap date to see events
- Swipe between months

### Tasks
- Stack vertically
- Swipe to complete
- Pull to refresh

---

## 🔄 Integration Points

### Filters → Calendar
- Filter leads, then schedule events from filtered results

### Calendar → Tasks
- Create task from calendar event
- Link tasks to calendar dates

### Tasks → Leads
- Tasks appear in lead detail dialog
- Complete task from lead context

---

## 📊 Database Schema Additions

### Tasks Table
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  assigned_to UUID REFERENCES auth.users(id),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Calendar Events Table
```sql
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  event_type TEXT CHECK (event_type IN ('viewing', 'callback', 'followup', 'task')),
  title TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  description TEXT,
  google_calendar_id TEXT,
  outlook_calendar_id TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

This breakdown shows exactly how each feature integrates with your existing UI/UX patterns!
