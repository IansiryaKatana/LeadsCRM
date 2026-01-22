# WordPress Forms Integration Guide

This guide explains how to integrate your WordPress website forms (Elementor Forms and WP Forms) with the Urban Hub Leads CRM.

## Overview

The CRM provides a webhook endpoint that accepts form submissions from WordPress and automatically creates leads in the system. Different form types are tracked separately to help you identify where leads are coming from.

## Form Types Supported

1. **Contact Form** (`web_contact`) - General contact/inquiry forms
2. **Book Viewing Form** (`web_booking`) - Forms for scheduling property viewings
3. **Schedule Callback Form** (`web_callback`) - Forms for requesting callbacks
4. **Deposit Payment Form** (`web_deposit`) - Paid deposit forms (automatically marked as converted leads)

## Setup Instructions

### Step 1: Deploy the Webhook Function

The webhook function is located at `supabase/functions/wordpress-webhook/index.ts`.

**Deploy using Supabase CLI:**
```bash
supabase functions deploy wordpress-webhook --project-ref YOUR_PROJECT_REF
```

**Or deploy via Supabase Dashboard:**
1. Go to your Supabase project dashboard
2. Navigate to Edge Functions
3. Create a new function named `wordpress-webhook`
4. Copy the contents of `supabase/functions/wordpress-webhook/index.ts`
5. Deploy the function

### Step 2: Get Your Webhook URL

After deployment, your webhook URL will be:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/wordpress-webhook
```

### Step 3: Configure WordPress Forms

#### Option A: Elementor Forms

1. **Open your form in Elementor**
2. **Go to Form Settings → Actions After Submit**
3. **Add "Webhook" action**
4. **Configure the webhook:**
   - **Webhook URL:** `https://YOUR_PROJECT_REF.supabase.co/functions/v1/wordpress-webhook`
   - **Request Method:** `POST`
   - **Request Headers:** (optional, for authentication)
     - `Content-Type: application/json`
   - **Request Body:** Use JSON format with the following structure:

**For Contact Forms:**
```json
{
  "full_name": "{name}",
  "email": "{email}",
  "phone": "{phone}",
  "form_type": "contact",
  "form_name": "Contact Form",
  "message": "{message}"
}
```

**For Book Viewing Forms:**
```json
{
  "full_name": "{name}",
  "email": "{email}",
  "phone": "{phone}",
  "form_type": "booking",
  "form_name": "Book Viewing",
  "preferred_date": "{date}",
  "preferred_time": "{time}",
  "studio_type": "{studio_type}",
  "room_choice": "{studio_type}",
  "stay_duration": "{duration}"
}
```

**Note:** The webhook accepts both `studio_type` and `room_choice` field names. Use whichever matches your form field names.

**For Schedule Callback Forms:**
```json
{
  "full_name": "{name}",
  "email": "{email}",
  "phone": "{phone}",
  "form_type": "callback",
  "form_name": "Schedule Callback",
  "preferred_date": "{date}",
  "preferred_time": "{time}",
  "studio_type": "{studio_type}",
  "duration": "{duration}",
  "stay_duration": "{duration}"
}
```

**Note:** The webhook accepts both `duration` and `stay_duration` field names. Studio type and duration from callback forms will be captured in the lead.

**For Deposit Payment Forms:**
```json
{
  "full_name": "{name}",
  "email": "{email}",
  "phone": "{phone}",
  "form_type": "deposit",
  "form_name": "Deposit Payment",
  "deposit_amount": "{amount}",
  "payment_status": "{status}",
  "installment_plan": "{installment_option}",
  "referral": "{referral_checkbox}",
  "duration": "{duration}",
  "stay_duration": "{duration}",
  "academic_year": "{year}"
}
```

**Important Notes:**
- `deposit_amount` can be a number (e.g., `99`) or a formatted string (e.g., `"£99"` or `"£99.00"`). The webhook will extract the numeric value.
- `installment_plan` (e.g., "Pay in 3 Installments") will be saved in the lead notes.
- `referral` checkbox value will be saved in the lead notes.
- Deposit forms are automatically marked as **converted leads** with `is_hot: true`.

**Note:** Replace `{field_name}` with the actual field IDs from your Elementor form. For example:
- `{name}` → `[field id="name"]`
- `{email}` → `[field id="email"]`
- `{phone}` → `[field id="phone"]`

#### Option B: WP Forms

1. **Open your form in WP Forms**
2. **Go to Settings → Notifications**
3. **Add a new notification** or edit existing
4. **Set notification method to "Webhook"**
5. **Configure the webhook:**
   - **Webhook URL:** `https://YOUR_PROJECT_REF.supabase.co/functions/v1/wordpress-webhook`
   - **Request Method:** `POST`
   - **Request Format:** `JSON`
   - **Request Body:** Use the same JSON structure as Elementor Forms above

**WP Forms Field Mapping:**
- `{name}` → `{field_id="1"}` (replace 1 with your name field ID)
- `{email}` → `{field_id="2"}` (replace 2 with your email field ID)
- `{phone}` → `{field_id="3"}` (replace 3 with your phone field ID)

### Step 4: Test the Integration

1. **Submit a test form** on your WordPress site
2. **Check the CRM** - the lead should appear in the Leads page
3. **Verify the source** - it should show the correct form type (Contact, Booking, Callback, or Deposit)
4. **Check Supabase logs** - Go to Edge Functions → wordpress-webhook → Logs to see any errors

## Field Mapping Reference

### Required Fields
- `email` (required) - Lead's email address
- `full_name` or `name` - Lead's full name

### Optional Fields
- `phone` - Lead's phone number
- `form_type` - One of: `"contact"`, `"booking"`, `"callback"`, `"deposit"`
- `form_name` - Name of the form (for logging)
- `room_choice` or `studio_type` - One of: `"platinum"`, `"gold"`, `"silver"`, `"bronze"`, `"standard"` (both field names accepted)
- `stay_duration` or `duration` - One of: `"51_weeks"`, `"45_weeks"`, `"short_stay"` (accepts variations like "45 Weeks", "45 weeks", etc.)
- `academic_year` - Format: `"2024/2025"`
- `message` - Additional message/notes
- `preferred_date` or `date` - Preferred date for booking/callback
- `preferred_time` or `time` - Preferred time for booking/callback
- `deposit_amount` - Deposit amount (for deposit forms) - Can be number or string like "£99"
- `payment_status` - Payment status (for deposit forms)
- `installment_plan` - Payment installment option (e.g., "Pay in 3 Installments") - Saved in notes
- `referral` - Referral checkbox value - Saved in notes

## Special Behavior

### Deposit Forms
- **Automatically marked as "converted"** - Deposit forms indicate a paid lead, so they're automatically set to `lead_status: "converted"`
- **Marked as hot lead** - Deposit forms are automatically marked as `is_hot: true`
- **Revenue set** - If `deposit_amount` is provided, it's set as `potential_revenue`

### Form Type Detection
If `form_type` is not provided, the system will attempt to detect it from the `form_name`:
- Contains "deposit", "payment", or "paid" → `deposit`
- Contains "book", "viewing", or "view" → `booking`
- Contains "callback", "call back", or "schedule" → `callback`
- Default → `contact`

## Troubleshooting

### Lead Not Appearing in CRM

1. **Check webhook URL** - Ensure it's correct and accessible
2. **Check form field mapping** - Verify field names match the expected format
3. **Check Supabase logs** - Look for error messages in Edge Functions logs
4. **Verify lead source exists** - Ensure the lead source (e.g., `web_contact`) exists in the `lead_sources` table

### Common Errors

**Error: "Email is required"**
- Solution: Ensure your form includes an email field and it's mapped correctly

**Error: "Invalid lead source"**
- Solution: The lead source might not exist. Check the `lead_sources` table in Supabase and ensure the source is active

**Error: "CORS error"**
- Solution: The webhook function includes CORS headers. If you're still seeing CORS errors, check that the request is coming from an allowed origin

### Testing Webhook Manually

You can test the webhook using curl:

**Test Book Viewing Form:**
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/wordpress-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+44 50 123 4567",
    "form_type": "booking",
    "form_name": "Book a Viewing",
    "preferred_date": "2025-02-15",
    "preferred_time": "10:00am",
    "studio_type": "Silver"
  }'
```

**Test Callback Form:**
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/wordpress-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+44 50 987 6543",
    "form_type": "callback",
    "form_name": "Get a Callback",
    "studio_type": "Silver",
    "duration": "45 Weeks"
  }'
```

**Test Deposit Payment Form:**
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/wordpress-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Bob Johnson",
    "email": "bob@example.com",
    "phone": "+44 50 555 1234",
    "form_type": "deposit",
    "form_name": "Deposit Payment",
    "deposit_amount": "£99",
    "duration": "45 Weeks",
    "installment_plan": "Pay in 3 Installments",
    "referral": true
  }'
```

**Note:** The webhook automatically handles:
- Field name variations (`studio_type` = `room_choice`, `duration` = `stay_duration`)
- Duration formats ("45 Weeks", "45 weeks", "45_weeks" all work)
- Deposit amounts in various formats ("£99", "99", "99.00")

## Security Considerations

1. **Rate Limiting** - Consider implementing rate limiting on your WordPress side to prevent spam
2. **Validation** - The webhook validates required fields, but you should also validate on the WordPress side
3. **HTTPS** - Always use HTTPS for webhook URLs
4. **Authentication** (Optional) - You can add authentication headers if needed by modifying the webhook function

## Next Steps

1. **Set up auto-assignment rules** - Configure rules to automatically assign leads from different form types to specific team members
2. **Create email templates** - Set up automated welcome emails for different form types
3. **Configure notifications** - Set up notifications for new leads from WordPress forms
4. **Monitor performance** - Use the Reports page to track which form types generate the most leads

## Support

If you encounter issues:
1. Check the Supabase Edge Functions logs
2. Verify your form field mappings
3. Test the webhook manually using curl
4. Check that all required lead sources exist in the database
