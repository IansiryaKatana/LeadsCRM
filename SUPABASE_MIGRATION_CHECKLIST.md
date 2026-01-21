# Supabase Project Migration Checklist

## ✅ Already Updated (by you)
- [x] `.env` file with new project credentials
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- [x] Edge Functions uploaded to new project
- [x] Edge Function secrets configured in new Supabase dashboard

## ⚠️ Needs Update

### 1. `supabase/config.toml` - Project ID
**Current:** `project_id = "djxbcxvvrizpuvcbdpbe"`  
**Action:** Update to your new Supabase project ID

**How to find your new project ID:**
- Go to your Supabase dashboard
- The project ID is in the URL: `https://app.supabase.com/project/[PROJECT_ID]`
- Or check Settings → General → Reference ID

### 2. Edge Function Environment Variables (in Supabase Dashboard)
**Location:** Supabase Dashboard → Edge Functions → Settings → Secrets

**Required Secrets:**
- `SUPABASE_URL` - Your new project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your new service role key (⚠️ Keep this secret!)

**Functions that use these:**
- `process-csv-import`
- `send-notification`
- `wpforms-webhook`

### 3. Database Types (Optional but Recommended)
**Location:** `src/integrations/supabase/types.ts`

**Action:** Regenerate types if your database schema changed
```bash
# If you have Supabase CLI installed:
npx supabase gen types typescript --project-id YOUR_NEW_PROJECT_ID > src/integrations/supabase/types.ts
```

## 📋 Verification Steps

1. **Test Frontend Connection:**
   - Start dev server: `npm run dev`
   - Try logging in
   - Check browser console for errors

2. **Test Edge Functions:**
   - Try bulk upload
   - Check function logs in Supabase dashboard
   - Verify leads are created

3. **Test Database Queries:**
   - View leads list
   - Create a new lead manually
   - Check if data appears correctly

## 🔍 Where Supabase Config is Used

### Frontend (uses `.env` file):
- `src/integrations/supabase/client.ts` - Reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`

### Edge Functions (uses Supabase Dashboard secrets):
- `supabase/functions/process-csv-import/index.ts` - Uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- `supabase/functions/send-notification/index.ts` - Uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- `supabase/functions/wpforms-webhook/index.ts` - Uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

### Local Development (uses `config.toml`):
- `supabase/config.toml` - Used by Supabase CLI for local development

## ⚠️ Important Notes

1. **Service Role Key:** Never commit this to git. It's only set in Supabase dashboard secrets.

2. **Project ID in config.toml:** Only needed if using Supabase CLI locally. If you're not using CLI, this file can be ignored.

3. **Environment Variables:** Make sure your `.env` file is in `.gitignore` and not committed to version control.

4. **Clear Browser Cache:** After changing projects, clear browser localStorage to remove old auth tokens:
   - Open DevTools → Application → Local Storage → Clear

## 🚨 Common Issues After Migration

1. **"Invalid API key" errors:**
   - Check `.env` file has correct values
   - Restart dev server after changing `.env`

2. **Edge functions failing:**
   - Verify secrets are set in Supabase dashboard
   - Check function logs in dashboard

3. **Auth not working:**
   - Clear browser localStorage
   - Check RLS policies are set up in new project
   - Verify migrations ran successfully

4. **Data not showing:**
   - Verify migrations ran in new project
   - Check RLS policies allow access
   - Verify user roles are set up

