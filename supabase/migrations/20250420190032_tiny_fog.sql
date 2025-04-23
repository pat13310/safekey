/*
  # Fix Default Project and Policies

  1. Changes
    - Create default project for keys without specific project
    - Update policies for project and API key access
    - Handle policy creation in a safe way using DO blocks
*/

-- Create default project if it doesn't exist
DO $$
BEGIN
  INSERT INTO projects (
    id,
    name,
    description,
    created_by
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Projet par défaut',
    'Projet par défaut pour les clés sans projet spécifique',
    (SELECT id FROM auth.users LIMIT 1)
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Update project policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Allow access to default project" ON projects;
  DROP POLICY IF EXISTS "Users can create API keys" ON api_keys;

  -- Create new policies
  CREATE POLICY "Allow access to default project"
    ON projects
    FOR ALL
    TO authenticated
    USING (
      id = '00000000-0000-0000-0000-000000000000'
      OR created_by = auth.uid()
    );

  CREATE POLICY "Users can create API keys"
    ON api_keys
    FOR INSERT
    TO authenticated
    WITH CHECK (
      auth.uid() = created_by
      AND (
        project_id = '00000000-0000-0000-0000-000000000000'
        OR EXISTS (
          SELECT 1 FROM projects
          WHERE id = api_keys.project_id
          AND created_by = auth.uid()
        )
      )
    );
END $$;