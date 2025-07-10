-- Update existing profiles with "New User" to use email prefix as display name
UPDATE public.profiles 
SET full_name = SPLIT_PART("Email ID", '@', 1)
WHERE full_name = 'New User' AND "Email ID" IS NOT NULL;

-- For profiles without email, try to get from auth.users
UPDATE public.profiles 
SET full_name = COALESCE(
  SPLIT_PART((SELECT email FROM auth.users WHERE id = profiles.id), '@', 1),
  'User'
)
WHERE full_name = 'New User';

-- Update the trigger function to extract name from email if no name in metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, "Email ID", role)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name', 
      SPLIT_PART(NEW.email, '@', 1),
      'User'
    ),
    NEW.email,
    'member'
  );
  RETURN NEW;
END;
$$;