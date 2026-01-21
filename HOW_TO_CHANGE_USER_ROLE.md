# How to Change User Role from Viewer to Super Admin

## Quick Method: Using Supabase SQL Editor

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run This SQL

```sql
-- Update your role from viewer to super_admin
UPDATE user_roles
SET role = 'super_admin'
WHERE user_id = '58163c0f-db19-4896-9d95-296be91c98ff'
  AND role = 'viewer';

-- Verify the change
SELECT user_id, role, created_at
FROM user_roles
WHERE user_id = '58163c0f-db19-4896-9d95-296be91c98ff';
```

### Step 3: If Update Doesn't Work

If the UPDATE doesn't work (due to unique constraints), use this instead:

```sql
-- Delete viewer role
DELETE FROM user_roles
WHERE user_id = '58163c0f-db19-4896-9d95-296be91c98ff'
  AND role = 'viewer';

-- Insert super_admin role
INSERT INTO user_roles (user_id, role)
VALUES ('58163c0f-db19-4896-9d95-296be91c98ff', 'super_admin')
ON CONFLICT DO NOTHING;

-- Verify
SELECT user_id, role, created_at
FROM user_roles
WHERE user_id = '58163c0f-db19-4896-9d95-296be91c98ff';
```

### Step 4: Refresh Your App
1. After running the SQL, go back to your app
2. **Clear browser localStorage** (F12 → Console → run: `localStorage.clear()`)
3. **Refresh the page** (F5)
4. You should now see all leads!

---

## Alternative Method: Using Table Editor

### Step 1: Open Table Editor
1. Go to Supabase Dashboard
2. Click **Table Editor** in the left sidebar
3. Find and click on the `user_roles` table

### Step 2: Find Your User
1. Look for the row with `user_id = 58163c0f-db19-4896-9d95-296be91c98ff`
2. Click on that row to edit it

### Step 3: Update Role
1. Change the `role` field from `viewer` to `super_admin`
2. Click **Save** or press Enter

### Step 4: Refresh Your App
- Clear localStorage and refresh the page

---

## Verify It Worked

After updating, check the browser console. You should see:
- `👤 User roles: ['super_admin']`
- `✅ Fetched X leads` (where X > 0)

---

## Troubleshooting

### If you get a permission error:
- Make sure you're logged into Supabase as a project owner/admin
- Or use the Service Role key (Settings → API → service_role key) in a separate SQL client

### If the role doesn't update:
- Check if there are multiple rows for your user_id
- Delete all existing roles first, then insert super_admin
- Make sure the user_id is correct (check in auth.users table)

### If you still can't see leads:
- Clear browser localStorage: `localStorage.clear()`
- Log out and log back in
- Check browser console for any errors
- Verify RLS policies are set up correctly

