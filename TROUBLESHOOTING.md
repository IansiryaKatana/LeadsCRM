# Troubleshooting: Leads Not Showing After Supabase Migration

## Quick Fixes (Try These First)

### 1. Restart Development Server
**CRITICAL:** Vite only reads `.env` file on startup. After changing `.env`, you MUST restart the dev server.

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### 2. Clear Browser Storage
Old auth tokens from the previous project are stored in localStorage and will cause issues.

**Option A: Clear via Browser DevTools**
1. Open DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Local Storage** → Your site URL
4. Delete all items (or just the Supabase auth items)
5. Refresh the page

**Option B: Clear All Site Data**
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Clear storage** on the left
4. Check all boxes
5. Click **Clear site data**
6. Refresh the page

### 3. Log Out and Log Back In
1. Click logout in the app
2. Clear browser storage (see above)
3. Log back in with your credentials

### 4. Clear React Query Cache
The React Query cache might have stale data. Add this to your browser console:

```javascript
// Open browser console (F12) and run:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## Debugging Steps

### Step 1: Verify Environment Variables Are Loaded

Open browser console (F12) and check:

```javascript
// Check if env vars are loaded
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.substring(0, 20) + '...');
```

**Expected:** Should show your new project URL and key  
**If undefined:** Dev server needs restart or `.env` file issue

### Step 2: Check Supabase Connection

In browser console:

```javascript
// Test Supabase connection
import { supabase } from '@/integrations/supabase/client';
supabase.from('leads').select('count').then(console.log);
```

**Expected:** Should return count or error message  
**If error:** Check RLS policies or connection

### Step 3: Check Authentication

In browser console:

```javascript
// Check current user
import { supabase } from '@/integrations/supabase/client';
supabase.auth.getUser().then(({data, error}) => {
  console.log('User:', data.user?.id);
  console.log('Error:', error);
});
```

**Expected:** Should show your user ID  
**If null:** You need to log in again

### Step 4: Check Database Query

In browser console:

```javascript
// Try to fetch leads directly
import { supabase } from '@/integrations/supabase/client';
supabase
  .from('leads')
  .select('*')
  .limit(5)
  .then(({data, error}) => {
    console.log('Leads:', data);
    console.log('Error:', error);
  });
```

**Expected:** Should return leads array or RLS error  
**If RLS error:** Check user role and RLS policies

### Step 5: Check React Query Cache

The leads might be cached. In browser console:

```javascript
// Clear React Query cache
window.location.reload();
// Then check Network tab to see if queries are firing
```

## Common Issues & Solutions

### Issue: "Invalid API key" Error
**Cause:** Environment variables not loaded  
**Solution:**
1. Restart dev server
2. Verify `.env` file has correct values
3. Check `.env` file is in project root (not in `src/`)

### Issue: "Row Level Security" Error
**Cause:** RLS policies blocking access  
**Solution:**
1. Verify migrations ran in new project
2. Check user has correct role in `user_roles` table
3. Verify RLS policies are enabled and correct

### Issue: Leads Exist But Not Showing
**Cause:** React Query cache or query key mismatch  
**Solution:**
1. Clear browser storage
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Check browser Network tab - are queries firing?

### Issue: "User not authenticated"
**Cause:** Old auth tokens from previous project  
**Solution:**
1. Clear localStorage
2. Log out and log back in
3. Verify you're using correct credentials for new project

## Verification Checklist

- [ ] Dev server restarted after `.env` changes
- [ ] Browser localStorage cleared
- [ ] Logged out and logged back in
- [ ] Environment variables loaded correctly (check console)
- [ ] Supabase connection working (check console)
- [ ] User authenticated (check console)
- [ ] Database queries working (check Network tab)
- [ ] RLS policies set up in new project
- [ ] User roles assigned in new project
- [ ] Migrations ran in new project

## Still Not Working?

1. **Check Browser Console:** Look for any red errors
2. **Check Network Tab:** See if API calls are being made and what responses they get
3. **Check Supabase Dashboard:** 
   - Verify leads exist in database
   - Check RLS policies
   - Check user roles
   - Check function logs

4. **Share Debug Info:**
   - Browser console errors
   - Network tab responses
   - Supabase dashboard screenshots

