/*
  # Create Verified Admin User - Raman Abdullah
  
  1. Admin User Creation
    - Creates verified admin user with specified credentials
    - Email: rahman.nisha@gmail.com
    - Name: Raman Abdullah
    - Mobile: 9791103607
    - Role: Administrator
    - Password: daGvfrtada@Q@#13!!
    
  2. Security
    - Password is properly hashed using bcrypt
    - Account is active by default
    - Admin role assigned
*/

-- Create the verified admin user
DO $$
DECLARE
    hashed_password text;
BEGIN
    -- Generate bcrypt hash for the password 'daGvfrtada@Q@#13!!'
    -- Using bcrypt with salt rounds 12 for security
    hashed_password := crypt('daGvfrtada@Q@#13!!', gen_salt('bf', 12));
    
    -- Insert the admin user if not exists
    INSERT INTO admin_users (
        email,
        password_hash,
        name,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        'rahman.nisha@gmail.com',
        hashed_password,
        'Raman Abdullah',
        'admin',
        true,
        now(),
        now()
    )
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active,
        updated_at = now();
    
    -- Log the creation
    RAISE NOTICE 'Verified admin user created/updated: Raman Abdullah (rahman.nisha@gmail.com)';
END $$;

-- Verify the user was created
DO $$
DECLARE
    user_count integer;
BEGIN
    SELECT COUNT(*) INTO user_count 
    FROM admin_users 
    WHERE email = 'rahman.nisha@gmail.com' AND is_active = true;
    
    IF user_count > 0 THEN
        RAISE NOTICE 'Verification successful: Admin user Raman Abdullah is active';
    ELSE
        RAISE EXCEPTION 'Verification failed: Admin user was not created properly';
    END IF;
END $$;