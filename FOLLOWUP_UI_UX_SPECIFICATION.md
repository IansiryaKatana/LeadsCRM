# Follow-Up System UI/UX Specification

## My Recommendation: Phased Implementation

**Phase 1 (MVP - Start Here):**
1. Database schema for follow-up tracking
2. Follow-up counter badge in Lead Detail Dialog
3. Record Follow-Up button and form
4. Follow-up history timeline
5. Status change validation (block closing without 3 follow-ups)

**Phase 2 (Enhanced UX):**
6. Follow-up indicators in Lead Table
7. Overdue follow-up alerts
8. Smart reminders

**Phase 3 (Advanced):**
9. Analytics dashboard
10. Automated scheduling

---

## Visual Design Specifications

### 1. Lead Detail Dialog - Follow-Up Section

#### Location: Below Status & Source badges, above Contact Info

```
┌─────────────────────────────────────────────────────────┐
│ 🔥 John Doe                                    [X]      │
├─────────────────────────────────────────────────────────┤
│ [New Lead] [TikTok 🎵]                                  │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 📞 Follow-Up Progress                               │ │
│ │                                                     │ │
│ │ ┌───────────────────────────────────────────────┐  │ │
│ │ │ Follow-ups: 2/3  [🟡 In Progress]            │  │ │
│ │ │ Last: 2 days ago  •  Next: Due tomorrow      │  │ │
│ │ └───────────────────────────────────────────────┘  │ │
│ │                                                     │ │
│ │ [➕ Record Follow-Up]  [📅 Schedule Next]          │ │
│ │                                                     │ │
│ │ ─── Follow-Up History ───                          │ │
│ │                                                     │ │
│ │ ┌───────────────────────────────────────────────┐  │ │
│ │ │ #3  📞 Call  •  2 days ago                    │  │ │
│ │ │ ✅ Contacted - Interested, needs pricing      │  │ │
│ │ │ "Discussed room options, sent pricing sheet"  │  │ │
│ │ │ Next: Follow up in 2 days                     │  │ │
│ │ └───────────────────────────────────────────────┘  │ │
│ │                                                     │ │
│ │ ┌───────────────────────────────────────────────┐  │ │
│ │ │ #2  📧 Email  •  5 days ago                    │  │ │
│ │ │ ✅ Contacted - Considering options            │  │ │
│ │ │ "Sent brochure and virtual tour link"         │  │ │
│ │ └───────────────────────────────────────────────┘  │ │
│ │                                                     │ │
│ │ ┌───────────────────────────────────────────────┐  │ │
│ │ │ #1  📞 Call  •  7 days ago                    │  │ │
│ │ │ ⚠️ No Answer - Left voicemail                 │  │ │
│ │ │ "Initial contact attempt"                     │  │ │
│ │ └───────────────────────────────────────────────┘  │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ 📧 email@example.com                                    │
│ 📱 +44 123 456 7890                                     │
│ ...                                                     │
└─────────────────────────────────────────────────────────┘
```

#### Component Structure:

**Follow-Up Progress Card:**
- **Badge:** Shows "X/3" with color coding
  - 🔴 Red: 0/3 (urgent)
  - 🟡 Yellow: 1-2/3 (in progress)
  - 🟢 Green: 3/3 (complete)
- **Status Text:** "In Progress" / "Complete" / "Overdue"
- **Last Follow-Up:** Relative time ("2 days ago")
- **Next Follow-Up:** "Due tomorrow" or "Overdue by 2 days"

**Action Buttons:**
- **Record Follow-Up:** Primary button, opens follow-up form
- **Schedule Next:** Secondary button, opens date picker

**Follow-Up History Timeline:**
- Vertical timeline with newest at top
- Each entry shows:
  - Follow-up number (#1, #2, #3)
  - Type icon (📞 Call, 📧 Email, 💬 WhatsApp, 👤 In-person)
  - Date (relative: "2 days ago")
  - Outcome badge (✅ Contacted, ⚠️ No Answer, ❌ Not Interested)
  - Notes preview
  - Next action (if scheduled)

---

### 2. Record Follow-Up Dialog

#### Modal Form Design:

```
┌─────────────────────────────────────────────────────────┐
│ Record Follow-Up #3                          [X]        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Follow-Up Type *                                         │
│ ┌────────────────────────────────────────────────────┐  │
│ │ [📞 Call ▼]                                        │  │
│ └────────────────────────────────────────────────────┘  │
│   Options: Call, Email, WhatsApp, In-person, Other     │
│                                                          │
│ Date & Time *                                            │
│ ┌────────────────────────────────────────────────────┐  │
│ │ [📅 Today, 2:30 PM ▼]                             │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ Outcome *                                                │
│ ┌────────────────────────────────────────────────────┐  │
│ │ [✅ Contacted Successfully ▼]                     │  │
│ └────────────────────────────────────────────────────┘  │
│   Options:                                               │
│   • ✅ Contacted Successfully                           │
│   • ⚠️ No Answer                                        │
│   • 📞 Voicemail Left                                   │
│   • ❌ Not Interested                                   │
│   • 💡 Interested, Needs More Info                      │
│   • 📅 Callback Requested                               │
│   • ❌ Wrong Contact Info                               │
│                                                          │
│ Notes                                                     │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Discussed room options, sent pricing sheet.        │  │
│ │ Lead is interested in Platinum room, 51 weeks.     │  │
│ │ Budget is a concern - will follow up with          │  │
│ │ payment plan options.                               │  │
│ │                                                     │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ Schedule Next Follow-Up (Optional)                      │
│ ☑ Schedule next follow-up                               │
│ ┌────────────────────────────────────────────────────┐  │
│ │ [📅 In 2 days ▼]                                    │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ ┌────────────────────┐  ┌────────────────────┐          │
│ │     Cancel        │  │   Save Follow-Up   │          │
│ └────────────────────┘  └────────────────────┘          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### Form Features:
- **Auto-numbering:** Follow-up number auto-increments
- **Quick Date:** "Today", "Yesterday", or date picker
- **Smart Suggestions:** 
  - If outcome is "Interested" → suggest 2-3 days
  - If "No Answer" → suggest 1-2 days
  - If "Not Interested" → suggest closing
- **Validation:** All required fields must be filled
- **Success:** Shows toast notification, closes dialog, updates UI

---

### 3. Lead Table - Follow-Up Indicators

#### New Column: Follow-Up Status

```
┌─────────────────────────────────────────────────────────────────────┐
│ Name        │ Status      │ Follow-Ups │ Last FU │ Next FU │ ... │
├─────────────────────────────────────────────────────────────────────┤
│ John Doe    │ New Lead    │ [0/3 🔴]   │ -        │ ⚠️ Due  │ ... │
│ Jane Smith  │ High Int.   │ [2/3 🟡]   │ 2d ago   │ Tomorrow│ ... │
│ Bob Wilson  │ Low Eng.    │ [3/3 🟢]   │ 1d ago   │ -       │ ... │
│ Alice Brown │ Awaiting    │ [1/3 🟡]   │ 5d ago   │ ⚠️ Over │ ... │
└─────────────────────────────────────────────────────────────────────┘
```

#### Column Details:

**Follow-Ups Column:**
- Badge format: `[X/3]` with color
- Tooltip on hover: "2 of 3 follow-ups completed"
- Clickable: Opens lead detail dialog

**Last Follow-Up Column:**
- Relative time: "2 days ago", "1 week ago"
- Empty if no follow-ups: "-"
- Color coding:
  - Green: Recent (< 3 days)
  - Yellow: Moderate (3-7 days)
  - Red: Old (> 7 days)

**Next Follow-Up Column:**
- "Tomorrow", "In 2 days"
- "⚠️ Overdue by 2 days" (red, bold)
- "-" if not scheduled
- Clickable: Quick schedule action

#### Row Highlighting:
- **Overdue Follow-Ups:** Subtle red border or background tint
- **Ready for Follow-Up:** Subtle yellow highlight
- **Complete (3/3):** Subtle green border

---

### 4. Status Change Validation - Warning Dialog

#### When Trying to Close Without 3 Follow-Ups:

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ Cannot Close Lead                      [X]           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ This lead requires 3 follow-ups before it can be        │
│ closed.                                                  │
│                                                          │
│ Current follow-ups: 2/3                                 │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ ✓ Follow-up #1 - Call (7 days ago)               │  │
│ │ ✓ Follow-up #2 - Email (5 days ago)              │  │
│ │ ✗ Follow-up #3 - Not completed                   │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ Options:                                                 │
│                                                          │
│ [Record Follow-Up #3]  [Request Exception]  [Cancel]    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### Exception Request Dialog (Admin Only):

```
┌─────────────────────────────────────────────────────────┐
│ Request Exception to Close Lead            [X]           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Reason for Exception *                                   │
│ ┌────────────────────────────────────────────────────┐  │
│ │ [Select reason ▼]                                  │  │
│ └────────────────────────────────────────────────────┘  │
│   • Duplicate lead                                       │
│   • Invalid contact information                          │
│   • Spam/Fake lead                                       │
│   • Other (specify below)                               │
│                                                          │
│ Justification *                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Explain why this lead should be closed early...   │  │
│ │                                                     │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ [Cancel]  [Submit Request]                              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

### 5. Dashboard - Follow-Up Alerts Widget

#### New Widget on Dashboard:

```
┌─────────────────────────────────────────────────────────┐
│ 📞 Follow-Up Alerts                                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ⚠️ Overdue Follow-Ups: 5                                 │
│    Leads with no follow-up in 48+ hours                 │
│    [View All →]                                          │
│                                                          │
│ 📅 Due Today: 3                                          │
│    Follow-ups scheduled for today                       │
│    [View All →]                                          │
│                                                          │
│ 🔴 Missing First Follow-Up: 2                           │
│    New leads without initial contact                    │
│    [View All →]                                          │
│                                                          │
│ ─────────────────────────────────────────────────────── │
│                                                          │
│ Follow-Up Compliance: 94%                               │
│ ████████████████████░░  (Progress bar)                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

### 6. Status Change UI - Enhanced

#### Status Dropdown with Follow-Up Indicator:

```
┌─────────────────────────────────────────────────────────┐
│ Update Status                                            │
│ ┌────────────────────────────────────────────────────┐  │
│ │ [New Lead ▼]                                        │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ Options:                                                 │
│ • New Lead                                              │
│ • Awaiting Outreach                                     │
│ • Low Engagement                                         │
│ • High Interest                                          │
│ • ✅ Converted (Available anytime)                      │
│ • ❌ Closed (Requires 3 follow-ups) [2/3]             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### Convert Button (Always Enabled):
- Shows tooltip: "Convert now (2 follow-ups completed)"
- Green checkmark icon
- No restrictions

#### Close Button (Conditional):
- **If < 3 follow-ups:**
  - Disabled state
  - Red X icon
  - Tooltip: "3 follow-ups required (Current: 2/3)"
  - Click shows warning dialog

- **If ≥ 3 follow-ups:**
  - Enabled state
  - Tooltip: "Close lead (3 follow-ups completed ✓)"

---

## Color Coding System

### Follow-Up Count Badges:
```css
/* 0/3 - Urgent */
bg-destructive/10 text-destructive border-destructive/20

/* 1-2/3 - In Progress */
bg-warning/10 text-warning border-warning/20

/* 3/3 - Complete */
bg-success/10 text-success border-success/20
```

### Follow-Up Status:
- **Overdue:** `text-destructive` (red)
- **Due Soon:** `text-warning` (yellow)
- **On Track:** `text-success` (green)
- **Not Scheduled:** `text-muted-foreground` (gray)

### Outcome Icons:
- ✅ Contacted: Green checkmark
- ⚠️ No Answer: Yellow warning
- 📞 Voicemail: Blue phone
- ❌ Not Interested: Red X
- 💡 Interested: Green lightbulb
- 📅 Callback: Blue calendar

---

## Interactive Elements

### 1. Quick Actions Menu (Lead Table Row)
Right-click or three-dot menu:
```
┌─────────────────────────┐
│ View Details            │
│ Record Follow-Up        │
│ Schedule Follow-Up      │
│ ─────────────────────── │
│ Convert Lead            │
│ Close Lead              │
│ Assign To...            │
└─────────────────────────┘
```

### 2. Follow-Up History Item Actions
Hover over follow-up entry:
- **Edit** (if recent)
- **Delete** (with confirmation)
- **View Full Details**

### 3. Smart Suggestions
When recording follow-up:
- **Auto-suggest next date** based on:
  - Last follow-up date
  - Outcome type
  - Industry best practices
- **Pre-fill notes** template based on outcome
- **Suggest follow-up type** based on lead source

---

## Mobile Responsive Design

### Lead Detail Dialog (Mobile):
- Full-screen on mobile
- Follow-up section scrollable
- Sticky "Record Follow-Up" button at bottom
- Swipeable follow-up history cards

### Lead Table (Mobile):
- Follow-up badge prominent
- Collapsible columns
- Swipe actions: Record Follow-Up, View Details

### Record Follow-Up Form (Mobile):
- Bottom sheet modal (slides up from bottom)
- Large touch targets
- Date/time pickers optimized for mobile
- Voice-to-text for notes (future)

---

## Accessibility Features

### Screen Reader Support:
- ARIA labels for all buttons
- Status announcements for follow-up completion
- Keyboard navigation for all interactions

### Visual Indicators:
- High contrast badges
- Clear iconography
- Color + text (not color alone)
- Focus states for keyboard navigation

---

## User Flow Diagrams

### Flow 1: Recording First Follow-Up
```
Lead Detail Dialog
    ↓
Click "Record Follow-Up"
    ↓
Follow-Up Form Opens
    ↓
Select Type: Call
    ↓
Select Date: Today
    ↓
Select Outcome: Contacted
    ↓
Add Notes: "Initial contact..."
    ↓
Save
    ↓
Badge Updates: 0/3 → 1/3 🟡
Status May Change: new → awaiting_outreach
Timeline Shows: Follow-up #1
```

### Flow 2: Closing Lead (With Validation)
```
Lead Detail Dialog
    ↓
Click Status Dropdown
    ↓
Select "Closed"
    ↓
System Checks: Follow-ups = 2/3
    ↓
❌ Validation Fails
    ↓
Warning Dialog Appears
    ↓
Options:
  • Record Follow-Up #3
  • Request Exception (admin)
  • Cancel
    ↓
User Records Follow-Up #3
    ↓
Badge Updates: 2/3 → 3/3 🟢
    ↓
Now Can Close Lead ✅
```

### Flow 3: Early Conversion
```
Lead Detail Dialog
    ↓
Follow-ups: 2/3 🟡
    ↓
Click "Convert" Button
    ↓
✅ No Validation (Early conversion allowed)
    ↓
Status Changes: high_interest → converted
    ↓
Revenue Calculated
    ↓
Badge Shows: "Converted (2/3 follow-ups)"
    ↓
Success Toast: "Lead converted successfully"
```

---

## Component File Structure

```
src/
├── components/
│   ├── leads/
│   │   ├── LeadDetailDialog.tsx (enhanced)
│   │   ├── FollowUpSection.tsx (new)
│   │   ├── FollowUpHistory.tsx (new)
│   │   ├── FollowUpForm.tsx (new)
│   │   ├── FollowUpBadge.tsx (new)
│   │   └── StatusChangeDialog.tsx (new)
│   └── ui/
│       └── timeline.tsx (new, if needed)
├── hooks/
│   ├── useFollowUps.ts (new)
│   ├── useCreateFollowUp.ts (new)
│   └── useFollowUpValidation.ts (new)
└── types/
    └── followup.ts (new)
```

---

## Implementation Priority

### Must Have (MVP):
1. ✅ Follow-up counter badge
2. ✅ Record follow-up form
3. ✅ Follow-up history display
4. ✅ Status change validation
5. ✅ Database schema

### Should Have (Phase 2):
6. ⚠️ Table column indicators
7. ⚠️ Overdue alerts
8. ⚠️ Smart date suggestions

### Nice to Have (Phase 3):
9. 📊 Analytics dashboard
10. 📅 Calendar integration
11. 🔔 Push notifications

---

## Success Metrics (UI/UX)

### User Experience:
- **Time to record follow-up:** < 30 seconds
- **Follow-up compliance rate:** > 95%
- **User satisfaction:** Positive feedback on ease of use
- **Error rate:** < 2% validation errors

### Visual Clarity:
- **Badge visibility:** 100% of users understand follow-up count
- **Action clarity:** Clear CTAs for next steps
- **Status understanding:** Users know when they can/can't close

---

## Next Steps

1. **Review this specification** with stakeholders
2. **Create design mockups** (Figma/Sketch)
3. **Build database schema** (migration file)
4. **Implement components** (React/TypeScript)
5. **User testing** with sales team
6. **Iterate based on feedback**

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-16  
**Status:** Ready for Implementation

