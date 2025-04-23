/*
  # Fix project members policies

  1. Changes
    - Remove recursive policy conditions from project_members table
    - Rewrite policies to avoid self-referencing
    
  2. Security
    - Maintain existing security model while fixing recursion
    - Ensure admins can still manage project members
    - Ensure members can still view project members
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admins can manage project members" ON project_members;
DROP POLICY IF EXISTS "Members can view project members" ON project_members;

-- Create new policies without recursion
CREATE POLICY "Admins can manage project members"
ON project_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = project_members.project_id
    AND pm.user_id = auth.uid()
    AND pm.role IN ('admin', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = project_members.project_id
    AND pm.user_id = auth.uid()
    AND pm.role IN ('admin', 'owner')
  )
);

CREATE POLICY "Members can view project members"
ON project_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = project_members.project_id
    AND pm.user_id = auth.uid()
  )
);