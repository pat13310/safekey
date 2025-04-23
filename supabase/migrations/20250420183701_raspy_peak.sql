/*
  # Fix RLS policies for project members

  1. Changes
    - Fix project member policies to use WITH CHECK for INSERT
    - Update foreign key constraints to reference auth.users
    - Ensure consistent policy definitions
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Project members can read projects" ON projects;
DROP POLICY IF EXISTS "Users can create API keys for their projects" ON api_keys;
DROP POLICY IF EXISTS "Project admins can add members" ON project_members;

-- Add policy for project creation
CREATE POLICY "Users can create projects"
ON projects
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Update project read policy
CREATE POLICY "Project members can read projects"
ON projects
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = id
    AND project_members.user_id = auth.uid()
  )
);

-- Update API key creation policy
CREATE POLICY "Users can create API keys for their projects"
ON api_keys
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = api_keys.project_id
    AND project_members.user_id = auth.uid()
  )
);

-- Add policy for project member creation
CREATE POLICY "Project admins can add members"
ON project_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = project_members.project_id
    AND pm.user_id = auth.uid()
    AND pm.role IN ('owner', 'admin')
  )
  OR 
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_members.project_id
    AND p.created_by = auth.uid()
  )
);

-- Verify foreign key constraints
DO $$ 
BEGIN
  -- Projects table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'projects_created_by_fkey'
  ) THEN
    ALTER TABLE projects
      ADD CONSTRAINT projects_created_by_fkey
      FOREIGN KEY (created_by)
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;

  -- API keys table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'api_keys_created_by_fkey'
  ) THEN
    ALTER TABLE api_keys
      ADD CONSTRAINT api_keys_created_by_fkey
      FOREIGN KEY (created_by)
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;

  -- Key history table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'key_history_performed_by_fkey'
  ) THEN
    ALTER TABLE key_history
      ADD CONSTRAINT key_history_performed_by_fkey
      FOREIGN KEY (performed_by)
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;

  -- Project members table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'project_members_user_id_fkey'
  ) THEN
    ALTER TABLE project_members
      ADD CONSTRAINT project_members_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;
END $$;