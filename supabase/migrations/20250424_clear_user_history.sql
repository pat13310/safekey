-- Fonction SQL pour supprimer l'historique des clés d'un utilisateur
CREATE OR REPLACE FUNCTION public.clear_user_history(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Supprimer toutes les entrées d'historique pour l'utilisateur spécifié
  DELETE FROM public.key_history
  WHERE performed_by = user_id;
END;
$$;

-- Commentaire pour la fonction
COMMENT ON FUNCTION public.clear_user_history(UUID) IS 'Supprime tout l''historique des clés pour un utilisateur donné';

-- Accorder les privilèges nécessaires
GRANT EXECUTE ON FUNCTION public.clear_user_history(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_user_history(UUID) TO service_role;
