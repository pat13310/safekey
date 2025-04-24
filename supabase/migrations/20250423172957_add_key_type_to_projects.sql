-- Ajouter la colonne key_type à la table projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS key_type VARCHAR(20) CHECK (key_type IN ('development', 'staging', 'production'));

-- Mettre à jour la table projects pour ajouter des labels par défaut aux projets existants
UPDATE projects 
SET key_type = 'production' 
WHERE key_type IS NULL;

-- Créer un trigger pour que les nouvelles clés API héritent automatiquement du type de projet
CREATE OR REPLACE FUNCTION set_key_type_from_project()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.project_id IS NOT NULL THEN
    SELECT key_type INTO NEW.key_type
    FROM projects
    WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_key_type_trigger ON api_keys;
CREATE TRIGGER set_key_type_trigger
BEFORE INSERT ON api_keys
FOR EACH ROW
EXECUTE FUNCTION set_key_type_from_project();
