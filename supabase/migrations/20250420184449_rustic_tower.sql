/*
  # Enrich key history with additional details
  
  1. Changes
    - Add new columns to key_history table for enriched data
    - Update key history policies
    - Add trigger for automatic history creation
*/

-- Add new columns to key_history table
ALTER TABLE key_history
ADD COLUMN IF NOT EXISTS environment text,
ADD COLUMN IF NOT EXISTS key_type text,
ADD COLUMN IF NOT EXISTS provider text,
ADD COLUMN IF NOT EXISTS project_name text;

-- Create function to automatically create history entry
CREATE OR REPLACE FUNCTION create_key_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO key_history (
      api_key_id,
      action,
      performed_by,
      environment,
      key_type,
      provider,
      project_name,
      details,
      ip_address,
      user_agent
    )
    SELECT
      NEW.id,
      'created',
      NEW.created_by,
      NEW.environment,
      NEW.key_type,
      NEW.provider,
      (SELECT name FROM projects WHERE id = NEW.project_id),
      jsonb_build_object(
        'name', NEW.name,
        'project_id', NEW.project_id,
        'expires_at', NEW.expires_at,
        'is_active', NEW.is_active,
        'created_at', NEW.created_at
      ),
      current_setting('request.headers', true)::json->>'x-real-ip',
      current_setting('request.headers', true)::json->>'user-agent';
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO key_history (
      api_key_id,
      action,
      performed_by,
      environment,
      key_type,
      provider,
      project_name,
      details,
      ip_address,
      user_agent
    )
    SELECT
      NEW.id,
      CASE
        WHEN OLD.is_active = true AND NEW.is_active = false THEN 'deleted'
        WHEN NEW.key_value != OLD.key_value THEN 'rotated'
        ELSE 'updated'
      END,
      NEW.created_by,
      NEW.environment,
      NEW.key_type,
      NEW.provider,
      (SELECT name FROM projects WHERE id = NEW.project_id),
      jsonb_build_object(
        'name', NEW.name,
        'project_id', NEW.project_id,
        'expires_at', NEW.expires_at,
        'is_active', NEW.is_active,
        'updated_at', NEW.updated_at,
        'changes', jsonb_build_object(
          'name', CASE WHEN NEW.name != OLD.name THEN jsonb_build_object('old', OLD.name, 'new', NEW.name) ELSE null END,
          'expires_at', CASE WHEN NEW.expires_at != OLD.expires_at THEN jsonb_build_object('old', OLD.expires_at, 'new', NEW.expires_at) ELSE null END,
          'is_active', CASE WHEN NEW.is_active != OLD.is_active THEN jsonb_build_object('old', OLD.is_active, 'new', NEW.is_active) ELSE null END,
          'environment', CASE WHEN NEW.environment != OLD.environment THEN jsonb_build_object('old', OLD.environment, 'new', NEW.environment) ELSE null END
        )
      ),
      current_setting('request.headers', true)::json->>'x-real-ip',
      current_setting('request.headers', true)::json->>'user-agent';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for API key changes
DROP TRIGGER IF EXISTS api_key_history_trigger ON api_keys;
CREATE TRIGGER api_key_history_trigger
  AFTER INSERT OR UPDATE
  ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION create_key_history();

-- Update key history policies
DROP POLICY IF EXISTS "Users can manage key history" ON key_history;

CREATE POLICY "Users can read key history"
ON key_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM api_keys
    WHERE api_keys.id = key_history.api_key_id
    AND api_keys.created_by = auth.uid()
  )
);

CREATE POLICY "System can create key history"
ON key_history
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM api_keys
    WHERE api_keys.id = key_history.api_key_id
    AND api_keys.created_by = auth.uid()
  )
);