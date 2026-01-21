# Email Setup Guide for ISKA Leads CRM

## Issue: 400/404 Errors When Sending Emails

If you're getting errors when trying to send emails from the CRM, follow these steps:

### Step 1: Set Up Resend API Key

The email function requires a **Resend API Key** to send emails.

1. **Sign up for Resend** (if you don't have an account):
   - Go to: https://resend.com
   - Create a free account (100 emails/day free tier)

2. **Get your API Key**:
   - Go to: https://resend.com/api-keys
   - Click "Create API Key"
   - Name it (e.g., "ISKA CRM")
   - Copy the API key (starts with `re_`)

3. **Add the Secret to Supabase**:
   - Go to: https://supabase.com/dashboard/project/btbsslznsexidjnzizre/functions
   - Click on **`send-notification`** function
   - Go to **Settings** tab
   - Scroll to **Secrets** section
   - Click **"Add new secret"**
   - **Name:** `RESEND_API_KEY`
   - **Value:** Paste your Resend API key
   - Click **"Save"**

### Step 2: Verify Function Secrets

Make sure these secrets are set in the `send-notification` function:

- ✅ `RESEND_API_KEY` - Your Resend API key
- ✅ `SUPABASE_URL` - Should be: `https://btbsslznsexidjnzizre.supabase.co`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Your service role key

**To get your Service Role Key:**
- Go to: Supabase Dashboard → Settings → API
- Find **`service_role`** key (⚠️ Keep this secret!)
- Copy it

### Step 3: Verify Domain (Optional but Recommended)

For production, you should verify your domain in Resend:

1. Go to: https://resend.com/domains
2. Add your domain (e.g., `yourdomain.com`)
3. Add the DNS records Resend provides
4. Wait for verification
5. Update the `from` address in the function to use your domain

**Current default:** `ISKA CRM <onboarding@resend.dev>` (works for testing)

### Step 4: Test Email Sending

1. Go to a lead in your CRM
2. Click on the **Email** tab
3. Select a template or compose a custom email
4. Click **Send Email**
5. Check the browser console for any errors
6. Check Supabase function logs: Dashboard → Functions → send-notification → Logs

### Troubleshooting

#### Error 400: "Subject and body are required"
- **Solution:** Make sure you've selected a template or filled in both subject and body fields

#### Error 400: Bad Request
- **Solution:** Check that:
  - `RESEND_API_KEY` secret is set correctly
  - The email address is valid
  - Subject and body are not empty

#### Error 404: Function not found
- **Solution:** The function has been redeployed. Try again. If it persists, check:
  - Function is deployed: Dashboard → Functions → send-notification should show "ACTIVE"
  - You're using the correct project reference

#### Error 500: Email service not configured
- **Solution:** `RESEND_API_KEY` secret is missing. Follow Step 1 above.

### Testing the Function Manually

You can test the function using curl:

```bash
curl -X POST https://btbsslznsexidjnzizre.supabase.co/functions/v1/send-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "to": "test@example.com",
    "subject": "Test Email",
    "bodyHtml": "<h1>Test</h1><p>This is a test email.</p>"
  }'
```

Replace `YOUR_ANON_KEY` with your Supabase anon key (from Settings → API).

### Next Steps

Once emails are working:
1. ✅ Set up your custom domain in Resend
2. ✅ Update the `from` address in the function
3. ✅ Create email templates in Settings → Email Templates
4. ✅ Test sending emails to real leads

---

**Need Help?**
- Check Supabase function logs for detailed error messages
- Verify all secrets are set correctly
- Make sure your Resend account is active
