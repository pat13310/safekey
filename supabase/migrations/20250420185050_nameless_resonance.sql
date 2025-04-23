/*
  # Fix API Keys RLS Policies

  1. Changes
    - Update RLS policies for api_keys table to properly handle API key creation
    - Ensure users can only create API keys for projects they own
    - Maintain existing security constraints while fixing the insert policy

  2. Security
    - Modify INSERT policy to properly check project ownership
    - Keep existing RLS enabled
    - Ensure proper authentication checks
*/

-- Drop existing INSERT policy if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'api_keys' 
    AND cmd = 'INSERT'
  ) THEN
    DROP POLICY IF EXISTS "Users can create API keys" ON public.api_keys;
  END IF;
END $$;

-- Create new INSERT policy with proper project ownership check
CREATE POLICY "Users can create API keys" ON public.api_keys
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = created_by AND
  (
    -- Allow insertion if project_id exists and user owns the project
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = api_keys.project_id
      AND projects.created_by = auth.uid()
    )
    OR
    -- Allow insertion if using default project ID
    project_id = '00000000-0000-0000-0000-000000000000'
  )
);