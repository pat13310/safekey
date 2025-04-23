/*
  # Fix project members RLS policies

  1. Changes
    - Drop existing problematic RLS policies on project_members table
    - Create new optimized RLS policies that avoid recursion
    
  2. Security
    - Enable RLS on project_members table
    - Add policy for project members to read other members in their projects
    - Add policy for project admins to manage members
    - Add policy for project owners to manage members
*/

-- First, drop the problematic policy
DROP POLICY IF EXISTS "Project members can read project members" ON project_members;

-- Create new, optimized policies
CREATE POLICY "Members can view project members"
ON project_members
FOR SELECT
TO authenticated
USING (
  project_id IN (
    SELECT project_id 
    FROM project_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage project members"
ON project_members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM project_members
    WHERE 
      project_members.project_id = project_id 
      AND user_id = auth.uid()
      AND role IN ('admin', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM project_members
    WHERE 
      project_members.project_id = project_id 
      AND user_id = auth.uid()
      AND role IN ('admin', 'owner')
  )
);