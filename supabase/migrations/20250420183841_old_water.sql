/*
  # Remove project_members table and simplify access control

  1. Changes
    - Drop project_members table and related policies
    - Update project and API key policies to use direct project ownership
    - Simplify access control model
*/

-- Drop project_members table and its policies
DROP TABLE IF EXISTS project_members CASCADE;

-- Update projects policies
DROP POLICY IF EXISTS "Project members can read projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;

-- New project policies based on direct ownership
CREATE POLICY "Users can manage their own projects"
ON projects
FOR ALL
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Update API keys policies
DROP POLICY IF EXISTS "Project members can read API keys" ON api_keys;
DROP POLICY IF EXISTS "Project admins can manage API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can create API keys for their projects" ON api_keys;

-- New API key policies based on project ownership
CREATE POLICY "Users can manage API keys for their projects"
ON api_keys
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = api_keys.project_id
    AND projects.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = api_keys.project_id
    AND projects.created_by = auth.uid()
  )
);

-- Update key history policies
DROP POLICY IF EXISTS "Project members can read key history" ON key_history;

CREATE POLICY "Users can read key history for their projects"
ON key_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM api_keys
    JOIN projects ON api_keys.project_id = projects.id
    WHERE api_keys.id = key_history.api_key_id
    AND projects.created_by = auth.uid()
  )
);