/*
  # Fix Default Project and Policies

  1. Changes
    - Create default project for keys without specific project
    - Drop existing policy if it exists
    - Create new policy for default project access
*/

-- Drop existing policy if it exists
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow access to default project" ON projects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Insert the default project if it doesn't exist
DO $$
BEGIN
  INSERT INTO projects (
    id,
    name,
    description,
    created_by
  )
  SELECT 
    '00000000-0000-0000-0000-000000000000',
    'Projet par défaut',
    'Projet par défaut pour les clés sans projet spécifique',
    (SELECT id FROM auth.users LIMIT 1)
  WHERE NOT EXISTS (
    SELECT 1 FROM projects 
    WHERE id = '00000000-0000-0000-0000-000000000000'
  );
END $$;

-- Create the new policy
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow access to default project" ON projects;
  CREATE POLICY "Allow access to default project"
    ON projects
    FOR ALL
    TO authenticated
    USING (
      id = '00000000-0000-0000-0000-000000000000'
      OR created_by = auth.uid()
    );
END $$;