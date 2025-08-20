-- Create the profiles table
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING' NOT NULL,
  role TEXT DEFAULT 'USER' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (id)
);

-- Add comments to the table
COMMENT ON TABLE public.profiles IS 'User profile information';
