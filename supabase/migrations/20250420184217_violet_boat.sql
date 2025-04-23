/*
  # Enforce user ID requirement for API keys
  
  1. Changes
    - Make created_by NOT NULL for api_keys table
    - Add validation to ensure created_by matches auth.uid()
    - Update existing policies to enforce user ownership
*/

-- First, ensure all existing records have a valid created_by
UPDATE api_keys
SET created_by = (
  SELECT created_by 
  FROM projects 
  WHERE projects.id = api_keys.project_id
)
WHERE created_by IS NULL;

-- Make created_by NOT NULL
ALTER TABLE api_keys 
  ALTER COLUMN created_by SET NOT NULL;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can read own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can update own API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can delete own API keys" ON api_keys;

-- Create new policies with strict user validation
CREATE POLICY "Users can create API keys"
ON api_keys
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
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
  created_by = auth.uid()
  AND EXISTS (
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
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM projects
    WHERE id = api_keys.project_id
    AND created_by = auth.uid()
  )
)
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
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
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM projects
    WHERE id = api_keys.project_id
    AND created_by = auth.uid()
  )
);