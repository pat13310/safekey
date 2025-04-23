/*
  # Fix authentication policies

  1. Changes
    - Add missing policies for project creation
    - Update API key policies to handle authentication properly
    - Simplify access control model
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own projects" ON projects;
DROP POLICY IF EXISTS "Users can manage API keys for their projects" ON api_keys;

-- Create new project policies
CREATE POLICY "Users can create projects"
ON projects
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can read own projects"
ON projects
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Users can update own projects"
ON projects
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own projects"
ON projects
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Create new API key policies
CREATE POLICY "Users can create API keys"
ON api_keys
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE id = api_keys.project_id
    AND created_by = auth.uid()
  )
);

CREATE POLICY "Users can read own API keys"
ON api_keys
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE id = api_keys.project_id
    AND created_by = auth.uid()
  )
);

CREATE POLICY "Users can update own API keys"
ON api_keys
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE id = api_keys.project_id
    AND created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE id = api_keys.project_id
    AND created_by = auth.uid()
  )
);

CREATE POLICY "Users can delete own API keys"
ON api_keys
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE id = api_keys.project_id
    AND created_by = auth.uid()
  )
);

-- Update key history policy
DROP POLICY IF EXISTS "Users can read key history for their projects" ON key_history;

CREATE POLICY "Users can manage key history"
ON key_history
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM api_keys
    JOIN projects ON api_keys.project_id = projects.id
    WHERE api_keys.id = key_history.api_key_id
    AND projects.created_by = auth.uid()
  )
);