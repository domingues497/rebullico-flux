-- Force Supabase types regeneration
-- This migration doesn't change the schema but forces type generation

-- Verify settings table structure
DO $$ 
BEGIN
  -- Just a verification query to force types refresh
  PERFORM column_name, data_type, is_nullable, column_default
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND table_name = 'settings';
END $$;