-- Allow public read access to settings table
-- This is necessary so the login screen can display store information
-- and to prevent "row-level security policy" errors when unauthenticated users load the app

-- Drop existing SELECT policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can view settings" ON public.settings;
DROP POLICY IF EXISTS "Everyone can view settings" ON public.settings;

-- Create new policy allowing everyone (including anon) to select
CREATE POLICY "Everyone can view settings" 
ON public.settings 
FOR SELECT 
USING (true);
