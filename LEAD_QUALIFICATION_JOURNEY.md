# Lead Qualification User Journey - Detailed Ideation

## Executive Summary

This document outlines the complete user journey for qualifying leads in the Urban Hub Leads CRM system, with a mandatory 3-follow-up process requirement. The journey maps how leads progress from initial entry through various qualification stages to final conversion or closure.

---

## Current System State

### Existing Lead Statuses
- `new` - Newly created lead (entry point)
- `awaiting_outreach` - Waiting for initial contact
- `low_engagement` - Low engagement level
- `high_interest` - High interest, warm lead
- `converted` - Successfully converted to booking
- `closed` - Closed/lost lead

### Current Capabilities
- Lead creation (manual, bulk upload, webhook)
- Status updates
- Notes tracking
- Assignment to team members
- Hot lead marking
- Audit trail logging

### Missing Components
- **Follow-up tracking system** (not yet implemented)
- **Follow-up count enforcement** (3 mandatory follow-ups)
- **Follow-up scheduling/reminders**
- **Status transition rules based on follow-ups**
- **Follow-up activity logging**

---

## Proposed User Journey: Lead Qualification Process

### Phase 1: Lead Entry & Initial Assessment

#### 1.1 Lead Creation
**Trigger Points:**
- Manual entry by salesperson
- Bulk CSV import
- Website form submission (webhook)
- External integrations

**Initial State:**
- Status: `new`
- Follow-up count: `0`
- Assigned to: `null` (or auto-assigned based on rules)
- Created timestamp recorded

**User Actions Available:**
- View lead details
- Assign to team member
- Add initial notes
- Mark as hot lead (if urgent)

**System Behavior:**
- Lead appears in "New Leads" view
- Notification sent to assigned user (if assigned)
- Audit trail entry: "Lead created"

---

### Phase 2: First Contact & Initial Outreach

#### 2.1 Lead Assignment & Preparation
**User Actions:**
- Salesperson reviews lead details
- Checks lead source, room preference, stay duration
- Reviews any existing notes
- Prepares outreach strategy

**Status Transition:**
- `new` → `awaiting_outreach` (when assigned or when first action taken)

**System Behavior:**
- Status change triggers notification
- Lead moves to "Awaiting Outreach" pipeline
- Audit trail: "Status changed to awaiting_outreach"

#### 2.2 First Follow-Up (Follow-Up #1)
**User Actions:**
- Salesperson initiates contact (call, email, WhatsApp, etc.)
- Records follow-up activity:
  - **Follow-up Type:** Call / Email / WhatsApp / In-person / Other
  - **Date & Time:** When follow-up occurred
  - **Outcome:** 
    - Contacted successfully
    - No answer / Voicemail
    - Wrong number / Email bounced
    - Not interested
    - Interested, needs more info
    - Requested callback
  - **Notes:** Detailed conversation notes
  - **Next Action:** Scheduled next follow-up date (if applicable)

**System Behavior:**
- Follow-up count increments: `0` → `1`
- Follow-up record created in database
- Status evaluation based on outcome:
  - **Positive response** → `high_interest`
  - **No response / Low engagement** → `low_engagement`
  - **Not interested** → `closed`
  - **Needs more info** → `awaiting_outreach` (stays or moves to `high_interest`)
- Audit trail: "Follow-up #1 completed"
- If next action scheduled, reminder created

**Business Rules:**
- First follow-up should occur within 24-48 hours of lead creation
- System can show warning if first follow-up is overdue

---

### Phase 3: Engagement & Qualification

#### 3.1 Second Follow-Up (Follow-Up #2)
**Trigger Conditions:**
- Lead status is `awaiting_outreach`, `low_engagement`, or `high_interest`
- At least 1-3 days after first follow-up (configurable)
- Lead not yet converted

**User Actions:**
- Salesperson conducts second contact attempt
- Records follow-up with same details as #1
- Updates notes with new information
- Assesses lead qualification level

**System Behavior:**
- Follow-up count increments: `1` → `2`
- Status re-evaluation:
  - **Strong interest / Ready to book** → `high_interest`
  - **Still considering** → `high_interest` or `awaiting_outreach`
  - **No response** → `low_engagement`
  - **Declined** → `closed`
- Audit trail: "Follow-up #2 completed"
- If converted, skip remaining follow-ups (see Phase 4)

**Business Rules:**
- Second follow-up typically 2-5 days after first
- System tracks time between follow-ups
- Warning if follow-up is overdue

#### 3.2 Third Follow-Up (Follow-Up #3) - **MANDATORY**
**Trigger Conditions:**
- Lead has completed 2 follow-ups
- Lead status is NOT `converted` or `closed`
- Lead is still in qualification process

**User Actions:**
- Salesperson conducts third contact attempt
- Records follow-up details
- Makes final qualification assessment
- Determines next steps: convert, close, or continue nurturing

**System Behavior:**
- Follow-up count increments: `2` → `3`
- **MANDATORY CHECK:** System validates 3 follow-ups completed
- Status evaluation:
  - **Ready to convert** → `high_interest` (pre-conversion state)
  - **Still considering** → `high_interest`
  - **No response after 3 attempts** → `low_engagement` or `closed`
  - **Declined** → `closed`
- Audit trail: "Follow-up #3 completed - Mandatory requirement met"
- System flags: "3 follow-ups completed" badge/indicator

**Business Rules:**
- **CRITICAL:** Cannot mark as `converted` or `closed` until 3 follow-ups are completed (unless converted earlier)
- Third follow-up typically 3-7 days after second
- System enforces this rule at status change

---

### Phase 4: Conversion or Closure

#### 4.1 Early Conversion (Before 3 Follow-Ups)
**Scenario:** Lead converts after 1st or 2nd follow-up

**User Actions:**
- Salesperson updates status to `converted`
- System validates: Follow-up count < 3, but conversion allowed
- Records conversion details:
  - Conversion date
  - Final revenue amount (auto-calculated)
  - Conversion notes

**System Behavior:**
- Status: `converted`
- Revenue calculated based on room_choice × stay_duration
- Follow-up requirement: **WAIVED** (conversion overrides requirement)
- Audit trail: "Lead converted after [X] follow-ups"
- Notification sent to managers/admins
- Lead moves to "Converted" pipeline

**Business Rules:**
- Early conversion is allowed and encouraged
- System tracks: "Converted after X follow-ups" for analytics

#### 4.2 Conversion After 3 Follow-Ups
**Scenario:** Lead converts after completing mandatory 3 follow-ups

**User Actions:**
- Salesperson updates status to `converted`
- System validates: 3 follow-ups completed ✓
- Records conversion details

**System Behavior:**
- Status: `converted`
- Revenue calculated
- Follow-up requirement: **SATISFIED**
- Audit trail: "Lead converted after 3 follow-ups"
- Lead moves to "Converted" pipeline

#### 4.3 Closure After 3 Follow-Ups
**Scenario:** Lead is closed (not interested, unresponsive, etc.) after 3 follow-ups

**User Actions:**
- Salesperson updates status to `closed`
- System validates: 3 follow-ups completed ✓
- Records closure reason:
  - Not interested
  - Unresponsive
  - Wrong contact info
  - Budget constraints
  - Other (with notes)

**System Behavior:**
- Status: `closed`
- Follow-up requirement: **SATISFIED**
- Audit trail: "Lead closed after 3 follow-ups"
- Lead moves to "Closed" pipeline
- Revenue reset to 0

**Business Rules:**
- Cannot close lead before 3 follow-ups (unless special exception)
- Closure reasons tracked for analytics

#### 4.4 Exception Handling
**Scenario:** Special cases requiring early closure

**User Actions:**
- Salesperson requests exception (admin/manager approval)
- Provides justification:
  - Duplicate lead
  - Invalid contact information
  - Spam/fake lead
  - Other (with detailed notes)

**System Behavior:**
- Admin/Manager reviews exception request
- If approved: Lead can be closed early
- Exception logged in audit trail
- Follow-up requirement: **WAIVED** (with reason)

---

## Status Transition Rules & Flow

### Allowed Status Transitions

```
new
  ↓
awaiting_outreach
  ↓
low_engagement ←→ high_interest
  ↓                    ↓
closed              converted
```

### Status Transition Matrix

| From Status | To Status | Follow-Up Requirement | Notes |
|------------|-----------|----------------------|-------|
| `new` | `awaiting_outreach` | None | Initial assignment |
| `new` | `converted` | Waived | Early conversion allowed |
| `awaiting_outreach` | `high_interest` | After 1+ follow-up | Positive response |
| `awaiting_outreach` | `low_engagement` | After 1+ follow-up | No/low response |
| `awaiting_outreach` | `closed` | After 3 follow-ups | Not interested |
| `low_engagement` | `high_interest` | After follow-up | Re-engagement |
| `low_engagement` | `closed` | After 3 follow-ups | Final attempt failed |
| `high_interest` | `converted` | Any time | Ready to book |
| `high_interest` | `closed` | After 3 follow-ups | Lost interest |
| `high_interest` | `low_engagement` | After follow-up | Interest declined |
| Any | `converted` | Waived if < 3 | Early conversion |
| Any | `closed` | **REQUIRED 3** | Must complete 3 follow-ups |

### Status Change Validation Rules

1. **Converting to `converted`:**
   - ✅ Allowed at any time (early conversion encouraged)
   - System tracks follow-up count at conversion

2. **Converting to `closed`:**
   - ❌ **BLOCKED** if follow-up count < 3
   - ✅ Allowed if follow-up count ≥ 3
   - ✅ Allowed with admin exception approval

3. **Moving between qualification statuses:**
   - ✅ Allowed based on engagement level
   - No follow-up count restriction

---

## Follow-Up Tracking System Design

### Database Schema Requirements

#### New Table: `lead_followups`
```sql
CREATE TABLE public.lead_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  followup_number INTEGER NOT NULL, -- 1, 2, or 3
  followup_type TEXT NOT NULL, -- 'call', 'email', 'whatsapp', 'in_person', 'other'
  followup_date TIMESTAMPTZ NOT NULL,
  outcome TEXT NOT NULL, -- 'contacted', 'no_answer', 'voicemail', 'not_interested', 'interested', 'callback_requested'
  notes TEXT,
  next_action_date TIMESTAMPTZ, -- Scheduled next follow-up
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_lead_followup_number UNIQUE (lead_id, followup_number)
);
```

#### Update `leads` Table
```sql
ALTER TABLE public.leads 
ADD COLUMN followup_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN last_followup_date TIMESTAMPTZ,
ADD COLUMN next_followup_date TIMESTAMPTZ;
```

### Follow-Up Types
- **Call** - Phone call attempt
- **Email** - Email sent
- **WhatsApp** - WhatsApp message
- **In-person** - Face-to-face meeting
- **Other** - Other communication method

### Follow-Up Outcomes
- **Contacted Successfully** - Reached the lead
- **No Answer** - No response to call/message
- **Voicemail** - Left voicemail
- **Not Interested** - Lead declined
- **Interested** - Lead shows interest
- **Needs More Info** - Lead requested information
- **Callback Requested** - Lead wants to be called back
- **Wrong Contact Info** - Invalid phone/email

---

## UI/UX Considerations

### Lead Detail View Enhancements

#### Follow-Up Section
- **Follow-Up Counter Badge:**
  - Shows current count: "Follow-ups: 2/3"
  - Color coding:
    - Red: 0 follow-ups (overdue)
    - Yellow: 1-2 follow-ups (in progress)
    - Green: 3+ follow-ups (complete)

- **Follow-Up History Timeline:**
  - Visual timeline showing all follow-ups
  - Each follow-up shows:
    - Date & time
    - Type (icon)
    - Outcome
    - Notes preview
    - User who performed it

- **Add Follow-Up Button:**
  - Prominent button: "Record Follow-Up"
  - Opens follow-up form dialog
  - Auto-increments follow-up number
  - Pre-fills next action date suggestion

- **Status Change Restrictions:**
  - If trying to close with < 3 follow-ups:
    - Show warning modal
    - Explain requirement
    - Option to request exception
    - Block action until resolved

#### Status Change UI
- **Convert Button:**
  - Always enabled (early conversion allowed)
  - Shows tooltip: "Convert now (X follow-ups completed)"

- **Close Button:**
  - Disabled if follow-up count < 3
  - Enabled if follow-up count ≥ 3
  - Shows tooltip explaining requirement
  - Exception request option for admins

### Dashboard Enhancements

#### Follow-Up Alerts
- **Overdue Follow-Ups:**
  - Leads with no follow-up in 48+ hours
  - Leads approaching 3-follow-up deadline
  - Visual indicators in lead table

#### Follow-Up Metrics
- Average follow-ups to conversion
- Follow-up completion rate
- Time between follow-ups
- Follow-up type effectiveness

### Lead Table Enhancements

#### New Columns
- **Follow-Up Count:** "2/3" badge
- **Last Follow-Up:** Date of most recent follow-up
- **Next Follow-Up:** Scheduled next action date
- **Follow-Up Status:** Overdue / Due / Complete

#### Filtering Options
- Filter by follow-up count
- Filter by overdue follow-ups
- Filter by next follow-up date

---

## Workflow Automation & Reminders

### Automated Reminders

#### First Follow-Up Reminder
- **Trigger:** 24 hours after lead creation
- **Condition:** Follow-up count = 0
- **Action:** Notification to assigned user
- **Message:** "New lead requires first follow-up"

#### Follow-Up Interval Reminders
- **Trigger:** 3-5 days after last follow-up
- **Condition:** Follow-up count < 3, status not converted/closed
- **Action:** Notification with suggested follow-up date
- **Message:** "Lead ready for follow-up #X"

#### Mandatory Follow-Up Alert
- **Trigger:** When attempting to close with < 3 follow-ups
- **Action:** Block action, show warning
- **Message:** "3 follow-ups required before closing. Current: X/3"

### Smart Suggestions

#### Next Follow-Up Date
- System suggests optimal follow-up date based on:
  - Last follow-up date
  - Lead status
  - Industry best practices (2-5 day intervals)
  - User's calendar availability (future enhancement)

#### Follow-Up Type Recommendation
- Based on lead source:
  - Website → Email first
  - Phone inquiry → Call first
  - WhatsApp → WhatsApp first

---

## Analytics & Reporting

### Follow-Up Metrics Dashboard

#### Key Metrics
1. **Follow-Up Completion Rate:**
   - % of leads with 3+ follow-ups before close
   - Target: 95%+ compliance

2. **Average Follow-Ups to Conversion:**
   - Track conversion efficiency
   - Identify optimal follow-up count

3. **Follow-Up Response Rate:**
   - % of successful contacts per follow-up
   - Track by follow-up number (1st, 2nd, 3rd)

4. **Time to First Follow-Up:**
   - Average time from lead creation to first contact
   - Target: < 24 hours

5. **Follow-Up Interval Analysis:**
   - Average time between follow-ups
   - Optimal interval identification

#### Reports
- **Follow-Up Compliance Report:**
  - Leads closed without 3 follow-ups (exceptions)
  - Compliance rate by user/team

- **Follow-Up Effectiveness Report:**
  - Conversion rate by follow-up count
  - Best performing follow-up types
  - Optimal follow-up timing

---

## Implementation Phases

### Phase 1: Core Follow-Up Tracking
**Priority: HIGH**
- Create `lead_followups` table
- Add follow-up count fields to leads table
- Build follow-up recording UI
- Implement follow-up history display

### Phase 2: Status Change Enforcement
**Priority: HIGH**
- Add validation rules for status changes
- Block closing without 3 follow-ups
- Exception request workflow
- Update status change UI

### Phase 3: Reminders & Automation
**Priority: MEDIUM**
- Follow-up reminder notifications
- Overdue follow-up alerts
- Next follow-up date suggestions

### Phase 4: Analytics & Reporting
**Priority: MEDIUM**
- Follow-up metrics dashboard
- Compliance reports
- Effectiveness analysis

### Phase 5: Advanced Features
**Priority: LOW**
- Calendar integration for follow-up scheduling
- Email/SMS automation
- AI-powered follow-up recommendations

---

## Business Rules Summary

### Critical Rules
1. ✅ **3 follow-ups are MANDATORY before closing a lead**
2. ✅ **Early conversion is allowed** (converts before 3 follow-ups)
3. ✅ **Exception requests require admin approval**
4. ✅ **Follow-up count must be tracked accurately**
5. ✅ **Status changes must validate follow-up requirements**

### Best Practices
1. First follow-up within 24-48 hours
2. Follow-up intervals: 2-5 days
3. Complete 3 follow-ups before giving up
4. Document all follow-up outcomes
5. Schedule next actions immediately

---

## User Scenarios

### Scenario 1: Ideal Path (Early Conversion)
1. Lead created → Status: `new`
2. Assigned to salesperson
3. First follow-up (call) → Contacted, interested
4. Status: `high_interest`, Follow-ups: 1/3
5. Second follow-up (email) → Ready to book
6. **Converted** → Status: `converted`, Follow-ups: 2/3 (waived)

### Scenario 2: Standard Path (3 Follow-Ups)
1. Lead created → Status: `new`
2. Assigned to salesperson
3. First follow-up → No answer, left voicemail
4. Status: `low_engagement`, Follow-ups: 1/3
5. Second follow-up → Contacted, considering
6. Status: `high_interest`, Follow-ups: 2/3
7. Third follow-up → Ready to book
8. **Converted** → Status: `converted`, Follow-ups: 3/3 ✓

### Scenario 3: Closure Path (3 Follow-Ups Required)
1. Lead created → Status: `new`
2. Assigned to salesperson
3. First follow-up → No answer
4. Status: `low_engagement`, Follow-ups: 1/3
5. Second follow-up → No answer
6. Status: `low_engagement`, Follow-ups: 2/3
7. Third follow-up → No answer, unresponsive
8. **Closed** → Status: `closed`, Follow-ups: 3/3 ✓

### Scenario 4: Exception Path (Early Closure)
1. Lead created → Status: `new`
2. Assigned to salesperson
3. First follow-up → Invalid phone number, email bounced
4. Follow-ups: 1/3
5. Salesperson requests exception: "Invalid contact info"
6. Admin approves exception
7. **Closed** → Status: `closed`, Follow-ups: 1/3 (exception)

---

## Success Criteria

### System Requirements
- ✅ All leads track follow-up count accurately
- ✅ Status changes enforce 3-follow-up rule
- ✅ Exception workflow functions properly
- ✅ Follow-up history is complete and searchable
- ✅ Analytics reflect follow-up metrics accurately

### User Experience Requirements
- ✅ Users understand follow-up requirements
- ✅ Follow-up recording is quick and intuitive
- ✅ Status change restrictions are clear
- ✅ Reminders help users stay on track
- ✅ Reports provide actionable insights

### Business Requirements
- ✅ 95%+ compliance with 3-follow-up rule
- ✅ Reduced lead abandonment rate
- ✅ Improved conversion tracking
- ✅ Better follow-up accountability
- ✅ Data-driven follow-up optimization

---

## Next Steps

1. **Review & Approval:** Stakeholder review of this journey
2. **Database Design:** Finalize schema changes
3. **UI/UX Design:** Create mockups for follow-up UI
4. **Development:** Implement Phase 1 features
5. **Testing:** User acceptance testing
6. **Training:** User training on new workflow
7. **Rollout:** Gradual deployment with monitoring

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-16  
**Status:** Draft for Review

