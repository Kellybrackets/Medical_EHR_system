-- ========================================
-- ADD PRACTICE CODE TO USER REGISTRATION
-- ========================================
-- This migration updates the user registration trigger to include practice_code

-- Update the handle_new_user function to include practice_code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, username, role, name, practice_code, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'doctor'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'practice_code',  -- Added practice_code from metadata
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS
'Automatically creates a record in public.users with practice_code when a new user signs up via Supabase Auth';
