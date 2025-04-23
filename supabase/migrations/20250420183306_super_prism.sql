/*
  # Add API key insertion policies

  1. Changes
    - Add policy for inserting API keys
    - Ensure users can only create keys for projects they have access to
    - Maintain existing security model
    
  2. Security
    - Users can only create keys for projects they are members of
    - Created keys must be associated with the authenticated user
*/

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Users can create their own API keys" ON api_keys;

-- Create new insert policy
CREATE POLICY "Users can create API keys for their projects"
ON api_keys
FOR INSERT
TO authenticated
WITH CHECK (
  -- User must be authenticated
  auth.uid() = created_by
  AND
  -- User must be a member of the project
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = api_keys.project_id
    AND project_members.user_id = auth.uid()
  )
);

-- Ensure the policy is enabled
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;