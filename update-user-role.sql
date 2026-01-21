-- Update user role from viewer to super_admin
-- Replace 'YOUR_USER_ID' with your actual user ID: 58163c0f-db19-4896-9d95-296be91c98ff

-- Option 1: Update existing role
UPDATE user_roles
SET role = 'super_admin'
WHERE user_id = '58163c0f-db19-4896-9d95-296be91c98ff'
  AND role = 'viewer';

-- Option 2: If the above doesn't work, delete viewer role and insert super_admin
-- (This handles the case where there might be a unique constraint)
DELETE FROM user_roles
WHERE user_id = '58163c0f-db19-4896-9d95-296be91c98ff'
  AND role = 'viewer';

INSERT INTO user_roles (user_id, role)
VALUES ('58163c0f-db19-4896-9d95-296be91c98ff', 'super_admin')
ON CONFLICT DO NOTHING;

-- Verify the change
SELECT user_id, role, created_at
FROM user_roles
WHERE user_id = '58163c0f-db19-4896-9d95-296be91c98ff';

