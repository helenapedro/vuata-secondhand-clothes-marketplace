/*
  # Fix user signup and profile creation

  1. Changes
    - Update handle_new_user trigger function to properly handle all profile fields
    - Add proper error handling for missing fields
    - Ensure all vendor-specific fields are properly stored

  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity with proper NULL handling
*/

-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the handle_new_user function with better field handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    role,
    whatsapp,
    identity_number,
    linkedin_url
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'cliente'),
    CASE 
      WHEN new.raw_user_meta_data->>'role' = 'vendedor' 
      THEN new.raw_user_meta_data->>'whatsapp'
      ELSE NULL
    END,
    CASE 
      WHEN new.raw_user_meta_data->>'role' = 'vendedor' 
      THEN new.raw_user_meta_data->>'identity_number'
      ELSE NULL
    END,
    CASE 
      WHEN new.raw_user_meta_data->>'role' = 'vendedor' 
      THEN new.raw_user_meta_data->>'linkedin_url'
      ELSE NULL
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();