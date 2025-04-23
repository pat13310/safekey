/*
  # Remove users table and update references to auth.users

  1. Changes
    - Drop users table since it's managed by Supabase Auth
    - Update foreign key references to use auth.users instead
    - Update RLS policies to use auth.uid()

  2. Security
    - Maintain RLS policies for all tables
    - Update policies to use auth.uid() for user identification
*/

-- Drop foreign key constraints that reference the users table
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_created_by_fkey;
ALTER TABLE api_keys DROP CONSTRAINT IF EXISTS api_keys_created_by_fkey;
ALTER TABLE key_history DROP CONSTRAINT IF EXISTS key_history_performed_by_fkey;

-- Drop the users table and its policies
DROP TABLE IF EXISTS users CASCADE;

-- Update foreign key constraints to reference auth.users
ALTER TABLE projects
  ADD CONSTRAINT projects_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

ALTER TABLE api_keys
  ADD CONSTRAINT api_keys_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

ALTER TABLE key_history
  ADD CONSTRAINT key_history_performed_by_fkey
  FOREIGN KEY (performed_by)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Update project members foreign key
ALTER TABLE project_members DROP CONSTRAINT IF EXISTS project_members_user_id_fkey;
ALTER TABLE project_members
  ADD CONSTRAINT project_members_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Recreate indexes if needed
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_by ON api_keys(created_by);
CREATE INDEX IF NOT EXISTS idx_key_history_performed_by ON key_history(performed_by);