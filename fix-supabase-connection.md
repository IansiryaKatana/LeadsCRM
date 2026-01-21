# Quick Fix: Supabase Connection Issues

## Immediate Steps to Fix

### 1. Stop and Restart Dev Server
```bash
# Press Ctrl+C to stop current server
# Then restart:
npm run dev
```

### 2. Clear Browser Data
**In Browser Console (F12), run this:**
```javascript
// Clear all storage
localStorage.clear();
sessionStorage.clear();
// Reload page
location.reload();
```

### 3. Check Console for Debug Info
After restarting, check browser console. You should see:
- `🔧 Supabase Config:` - Shows if env vars are loaded
- `✅ Fetched X leads` - Shows if query succeeded
- `❌ Error fetching leads:` - Shows any errors

### 4. Verify You're Logged In
- If not logged in, log in again
- Check console for user ID

### 5. Check Network Tab
- Open DevTools → Network tab
- Filter by "leads" or "supabase"
- See if queries are being made
- Check response status codes

## What to Look For

### ✅ Good Signs:
- Console shows Supabase config with your new URL
- Network tab shows successful API calls (200 status)
- Console shows "Fetched X leads"

### ❌ Bad Signs:
- Console shows "Missing Supabase environment variables"
- Network tab shows 401 (Unauthorized) errors
- Network tab shows 403 (Forbidden) errors - RLS issue
- Console shows "Error fetching leads"

## Common Fixes

### If "Missing environment variables":
- Restart dev server
- Check `.env` file exists in project root
- Check `.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`

### If 401 Unauthorized:
- Clear localStorage
- Log out and log back in
- Check you're using correct credentials for new project

### If 403 Forbidden (RLS Error):
- Check user has role in `user_roles` table
- Check RLS policies are set up in new project
- Verify migrations ran successfully

### If No Errors But No Data:
- Check academic year filter matches your data
- Check leads exist in database (Supabase dashboard)
- Try removing academic year filter temporarily

