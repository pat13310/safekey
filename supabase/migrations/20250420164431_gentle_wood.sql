/*
  # Add RLS policies for API keys management

  1. Security Changes
    - Add RLS policy for inserting API keys by authenticated users
    - Add RLS policy for updating API keys by project admins/owners
    - Add RLS policy for deleting API keys by project admins/owners
    - Add RLS policy for viewing API keys by project members

  2. Policy Details
    - INSERT: Any authenticated user can create API keys if they are the creator
    - UPDATE: Project admins/owners can update API keys in their projects
    - DELETE: Project admins/owners can delete API keys in their projects
    - SELECT: Project members can view API keys in their projects
*/

-- Policy for inserting API keys
CREATE POLICY "Users can create their own API keys"
ON api_keys
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Policy for updating API keys
CREATE POLICY "Project admins can update API keys"
ON api_keys
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = api_keys.project_id
    AND project_members.user_id = auth.uid()
    AND project_members.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = api_keys.project_id
    AND project_members.user_id = auth.uid()
    AND project_members.role IN ('owner', 'admin')
  )
);

-- Policy for deleting API keys
CREATE POLICY "Project admins can delete API keys"
ON api_keys
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = api_keys.project_id
    AND project_members.user_id = auth.uid()
    AND project_members.role IN ('owner', 'admin')
  )
);

-- Policy for viewing API keys
CREATE POLICY "Project members can view API keys"
ON api_keys
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = api_keys.project_id
    AND project_members.user_id = auth.uid()
  )
);