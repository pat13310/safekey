/*
  # Initial Schema Setup for API Key Management

  1. New Tables
    - `users`
      - Stores user information
      - Contains authentication details and profile data
    
    - `projects`
      - Stores project information
      - Each project can have multiple API keys
      - Contains project metadata and settings
    
    - `api_keys`
      - Stores API key information
      - Links to projects and users
      - Tracks key status and expiration
    
    - `key_history`
      - Tracks all actions performed on API keys
      - Maintains audit trail for security and compliance
    
    - `project_members`
      - Manages project access and permissions
      - Links users to projects with specific roles

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
    - Implement role-based access control
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  archived_at timestamptz,
  CONSTRAINT projects_name_length CHECK (char_length(name) >= 3)
);

-- Project members table (for managing access and roles)
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key_value text NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  last_used_at timestamptz,
  is_active boolean DEFAULT true,
  key_type text NOT NULL CHECK (key_type IN ('development', 'staging', 'production')),
  provider text,
  environment text NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
  CONSTRAINT api_keys_name_length CHECK (char_length(name) >= 3)
);

-- Key History table (for audit trail)
CREATE TABLE IF NOT EXISTS key_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid REFERENCES api_keys(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'viewed', 'rotated')),
  performed_by uuid REFERENCES users(id) NOT NULL,
  performed_at timestamptz DEFAULT now(),
  details jsonb,
  ip_address text,
  user_agent text
);

-- Enable RLS for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_history ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Project members can read projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = projects.id
      AND user_id = auth.uid()
    )
  );

-- Project members policies
CREATE POLICY "Project members can read project members"
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

-- API keys policies
CREATE POLICY "Project members can read API keys"
  ON api_keys
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = api_keys.project_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Project admins can manage API keys"
  ON api_keys
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = api_keys.project_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Key history policies
CREATE POLICY "Project members can read key history"
  ON key_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM api_keys
      JOIN project_members ON api_keys.project_id = project_members.project_id
      WHERE api_keys.id = key_history.api_key_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_api_keys_project_id ON api_keys(project_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_by ON api_keys(created_by);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON api_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_key_history_api_key_id ON key_history(api_key_id);
CREATE INDEX IF NOT EXISTS idx_key_history_performed_by ON key_history(performed_by);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to check if a user is a project admin
CREATE OR REPLACE FUNCTION is_project_admin(project_id uuid, user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = $1
    AND project_members.user_id = $2
    AND project_members.role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;