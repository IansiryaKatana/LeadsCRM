# Elementor Forms Setup Guide for Urban Hub Leads CRM

## Your Webhook URL
```
https://btbsslznsexidjnzizre.supabase.co/functions/v1/wordpress-webhook
```

---

## Step-by-Step Setup for Each Form Type

### 📝 Step 1: Open Your Form in Elementor

1. Go to your WordPress admin dashboard
2. Navigate to **Pages** → Edit the page with your form
3. Click **Edit with Elementor**
4. Click on your form widget to select it
5. In the left panel, go to **Form Settings** → **Actions After Submit**

---

### 📋 Step 2: Add Webhook Action

1. Click **Add Action** → Select **Webhook**
2. You'll see fields for:
   - **Webhook URL**
   - **Request Method**
   - **Request Headers** (optional)
   - **Request Body** (this is where you map your form fields)

---

### 📅 Step 3: Configure Each Form Type

#### **Form Type 1: Book a Viewing Form**

**Webhook Configuration:**
- **Webhook URL:** `https://btbsslznsexidjnzizre.supabase.co/functions/v1/wordpress-webhook`
- **Request Method:** `POST`
- **Request Headers:** (Click "Add Header")
  - **Header Name:** `Content-Type`
  - **Header Value:** `application/json`
- **Request Body:** (Select "JSON" format)

**JSON Body Template:**
```json
{
  "full_name": "[field id=\"name\"]",
  "email": "[field id=\"email\"]",
  "phone": "[field id=\"phone\"]",
  "form_type": "booking",
  "form_name": "Book a Viewing",
  "preferred_date": "[field id=\"date\"]",
  "preferred_time": "[field id=\"time\"]",
  "studio_type": "[field id=\"studio_type\"]",
  "landing_page": "Book_Viewing_LP"
}
```

**Important:** Replace `[field id="name"]` with your actual Elementor form field IDs. To find field IDs:
- In Elementor form editor, each field has an ID shown in the field settings
- Or use the field label/name (Elementor will auto-detect)

**Example with actual field names:**
```json
{
  "full_name": "[field id=\"form_field_name\"]",
  "email": "[field id=\"form_field_email\"]",
  "phone": "[field id=\"form_field_phone\"]",
  "form_type": "booking",
  "form_name": "Book a Viewing",
  "preferred_date": "[field id=\"form_field_date\"]",
  "preferred_time": "[field id=\"form_field_time\"]",
  "studio_type": "[field id=\"form_field_studio_type\"]"
}
```

---

#### **Form Type 2: Schedule a Callback Form**

**Webhook Configuration:**
- **Webhook URL:** `https://btbsslznsexidjnzizre.supabase.co/functions/v1/wordpress-webhook`
- **Request Method:** `POST`
- **Request Headers:**
  - **Header Name:** `Content-Type`
  - **Header Value:** `application/json`
- **Request Body:** (Select "JSON" format)

**JSON Body Template:**
```json
{
  "full_name": "[field id=\"name\"]",
  "email": "[field id=\"email\"]",
  "phone": "[field id=\"phone\"]",
  "form_type": "callback",
  "form_name": "Schedule Callback",
  "studio_type": "[field id=\"studio_type\"]",
  "duration": "[field id=\"duration\"]",
  "landing_page": "Callback_LP"
}
```

**Note:** The webhook will automatically map `studio_type` to `room_choice` and `duration` to `stay_duration`.

---

#### **Form Type 3: Contact Us Form**

**Webhook Configuration:**
- **Webhook URL:** `https://btbsslznsexidjnzizre.supabase.co/functions/v1/wordpress-webhook`
- **Request Method:** `POST`
- **Request Headers:**
  - **Header Name:** `Content-Type`
  - **Header Value:** `application/json`
- **Request Body:** (Select "JSON" format)

**JSON Body Template:**
```json
{
  "full_name": "[field id=\"name\"]",
  "email": "[field id=\"email\"]",
  "phone": "[field id=\"phone\"]",
  "form_type": "contact",
  "form_name": "Contact Form",
  "message": "[field id=\"message\"]"
}
```

---

#### **Form Type 4: Deposit Payment Form**

**Webhook Configuration:**
- **Webhook URL:** `https://btbsslznsexidjnzizre.supabase.co/functions/v1/wordpress-webhook`
- **Request Method:** `POST`
- **Request Headers:**
  - **Header Name:** `Content-Type`
  - **Header Value:** `application/json`
- **Request Body:** (Select "JSON" format)

**JSON Body Template:**
```json
{
  "full_name": "[field id=\"name\"]",
  "email": "[field id=\"email\"]",
  "phone": "[field id=\"phone\"]",
  "form_type": "deposit",
  "form_name": "Deposit Payment",
  "deposit_amount": "[field id=\"deposit_amount\"]",
  "duration": "[field id=\"duration\"]",
  "installment_plan": "[field id=\"installment_plan\"]",
  "referral": "[field id=\"referral\"]"
}
```

**Important Notes for Deposit Forms:**
- `deposit_amount` can be formatted like "£99" - the webhook will extract the number
- `referral` checkbox: Use `[field id="referral"]` - it will send "Yes" or "No"
- Deposit forms are **automatically marked as converted leads** in your CRM

---

## 🔍 How to Find Elementor Field IDs

### Method 1: Using Field Settings
1. Click on the form field in Elementor
2. Look at the left panel → **Content** tab
3. Find the **Field ID** or **Field Name** (usually shown as `form_field_xxx`)

### Method 2: Using Field Labels
Elementor can also use field labels. If your field label is "Your Name", you can use:
```json
{
  "full_name": "[field label=\"Your Name\"]"
}
```

### Method 3: Inspect Element (Advanced)
1. Right-click on the form field → **Inspect**
2. Look for `name="form_fields[name]"` or `id="form_field_name"`
3. Use the field name in brackets: `[field id="name"]`

---

## ✅ Testing Your Setup

### Test 1: Submit a Test Form
1. Fill out your form on the frontend
2. Submit it
3. Check your CRM → **Leads** page
4. The lead should appear with the correct source (e.g., "Web - Book Viewing")

### Test 2: Check Webhook Logs
1. Go to: https://supabase.com/dashboard/project/btbsslznsexidjnzizre/functions
2. Click on `wordpress-webhook`
3. Go to **Logs** tab
4. You should see successful requests with status 200

### Test 3: Verify Lead Data
- Check that all fields are captured correctly
- Verify the lead source matches your form type
- For deposit forms, verify it's marked as "converted"

---

## 🐛 Troubleshooting

### Issue: Form submits but lead doesn't appear in CRM

**Solutions:**
1. **Check field IDs** - Make sure they match your actual Elementor field IDs
2. **Check webhook URL** - Verify it's exactly: `https://btbsslznsexidjnzizre.supabase.co/functions/v1/wordpress-webhook`
3. **Check Supabase logs** - Go to Edge Functions → wordpress-webhook → Logs
4. **Verify JSON format** - Make sure your JSON is valid (no trailing commas)

### Issue: Error 400 Bad Request

**Solutions:**
1. **Email is required** - Make sure your form has an email field and it's mapped
2. **Invalid JSON** - Check your JSON syntax in the Request Body
3. **Field ID mismatch** - Verify field IDs exist in your form

### Issue: Lead appears but fields are empty

**Solutions:**
1. **Check field mapping** - Verify field IDs in JSON match your form
2. **Test field IDs** - Try using field labels instead: `[field label="Your Name"]`
3. **Check Elementor version** - Some older versions use different field ID formats

---

## 📋 Quick Reference: Field Mapping

| Elementor Field Type | JSON Field Name | Example |
|---------------------|-----------------|---------|
| Name/Text Field | `full_name` | `"[field id=\"name\"]"` |
| Email Field | `email` | `"[field id=\"email\"]"` |
| Phone Field | `phone` | `"[field id=\"phone\"]"` |
| Date Picker | `preferred_date` or `date` | `"[field id=\"date\"]"` |
| Time Picker | `preferred_time` or `time` | `"[field id=\"time\"]"` |
| Select/Dropdown (Studio Type) | `studio_type` | `"[field id=\"studio_type\"]"` |
| Select/Dropdown (Duration) | `duration` | `"[field id=\"duration\"]"` |
| Textarea (Message) | `message` | `"[field id=\"message\"]"` |
| Number (Deposit Amount) | `deposit_amount` | `"[field id=\"deposit_amount\"]"` |
| Checkbox (Referral) | `referral` | `"[field id=\"referral\"]"` |

---

## 🎯 Next Steps

1. ✅ Configure all 4 form types using the templates above
2. ✅ Test each form with a test submission
3. ✅ Verify leads appear in your CRM
4. ✅ Check that deposit forms are marked as "converted"
5. ✅ Monitor the webhook logs for any errors

Once configured, all form submissions will automatically create leads in your CRM! 🚀
