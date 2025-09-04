-- Add launch_url column to tools table
BEGIN;

ALTER TABLE public.tools
  ADD COLUMN IF NOT EXISTS launch_url TEXT;

COMMIT;

-- Down migration
-- BEGIN;
-- ALTER TABLE public.tools
--   DROP COLUMN IF EXISTS launch_url;
-- COMMIT;
