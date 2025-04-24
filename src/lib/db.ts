import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

// Create the Supabase client with additional options for better error handling
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  // Configuration multilingue
  global: {
    headers: {
      'Accept-Language': 'fr,en,es',  // Support du français, anglais et espagnol
    },
  },
});

// Types
export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  archived_at: Date | null;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  created_at: Date;
}

export interface ApiKey {
  id: string;
  name: string;
  key_value: string;
  project_id: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  expires_at: Date | null;
  last_used_at: Date | null;
  is_active: boolean;
  key_type:
    | "Site e-commerce"
    | "API interne"
    | "Application mobile"
    | "Divers"
    | null;
  provider: string | null;
  environment: "development" | "staging" | "production" | null;
  // La propriété language a été supprimée car elle n'existe pas dans la table api_keys
}

export interface KeyHistory {
  id: string;
  api_key_id: string;
  action: "created" | "updated" | "deleted" | "viewed" | "rotated";
  performed_by: string;
  performed_at: Date;
  details: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
}

// Database queries
export const queries = {
  createApiKey: async (
    apiKeyData: Omit<ApiKey, "id" | "created_at" | "updated_at">
  ) => {
    const { data, error } = await supabase
      .from("api_keys")
      .insert([apiKeyData])
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  },

  addKeyHistory: async (
    historyData: Omit<KeyHistory, "id" | "performed_at">
  ) => {
    const { data, error } = await supabase
      .from("key_history")
      .insert([historyData])
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  },
  
  // Fonction spécifique pour supprimer l'historique des clés d'un utilisateur
  clearKeyHistory: async (userId: string) => {
    if (!userId) {
      throw new Error("ID utilisateur requis");
    }
    
    try {
      // 1. Récupérer les clés API de l'utilisateur avec leur nom pour un meilleur affichage
      const { data: userApiKeys, error: apiKeysError } = await supabase
        .from("api_keys")
        .select("id, name, project_id")
        .eq("created_by", userId);
      
      if (apiKeysError) {
        throw apiKeysError;
      }
      
      console.log(`${userApiKeys.length} clés API trouvées pour l'utilisateur`);
      
      // 2. Récupérer les entrées d'historique pour ces clés
      const { data: historyEntries, error: historyError } = await supabase
        .from("key_history")
        .select("id, api_key_id, action, performed_at")
        .eq("performed_by", userId);
      
      if (historyError) {
        throw historyError;
      }
      
      console.log(`${historyEntries?.length || 0} entrées d'historique trouvées pour l'utilisateur`);
      
      // 3. Supprimer toutes les entrées d'historique de l'utilisateur
      const { error: deleteError } = await supabase
        .from("key_history")
        .delete()
        .eq("performed_by", userId);
      
      if (deleteError) {
        console.error("Erreur lors de la suppression de l'historique:", deleteError);
        throw deleteError;
      }
      
      // 4. Préparer un résumé des clés et de leur historique pour l'affichage
      const keySummary = userApiKeys.map(key => {
        const keyHistory = historyEntries?.filter(entry => entry.api_key_id === key.id) || [];
        return {
          id: key.id,
          nom: key.name,
          projet: key.project_id,
          actions: keyHistory.length
        };
      });
      
      // Calculer les statistiques de suppression
      const totalEntries = historyEntries?.length || 0;
      
      return { 
        success: true, 
        stats: { 
          totalKeys: userApiKeys.length,
          totalHistoryEntries: totalEntries,
          successCount: totalEntries, // Nombre d'entrées supprimées avec succès
          errorCount: 0, // Pas d'erreurs si on arrive ici
          keySummary: keySummary
        } 
      };
    } catch (error) {
      console.error("Erreur lors de la suppression de l'historique:", error);
      throw error;
    }
  },

  // User management
  createDemoUser: async () => {
    try {
      // Try to sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: "demo@example.com",
        password: "demo@2025",
      });

      // Only create a new user if sign in fails with user not found
      if (
        signInError &&
        signInError.message.includes("Invalid login credentials")
      ) {
        const { data, error } = await supabase.auth.signUp({
          email: "demo@example.com",
          password: "demo@2025",
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          console.error("Error creating demo user:", error);
          return { success: false, error };
        }

        return { success: true, data };
      }

      return { success: true };
    } catch (error) {
      console.error("Error in createDemoUser:", error);
      return { success: false, error };
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error signing in:", error);
      return { success: false, error };
    }
  },
};

// Create demo user on initialization if it doesn't exist
// Wrap in a setTimeout to ensure DOM is fully loaded
setTimeout(() => {
  queries.createDemoUser().catch((error) => {
    console.error("Error handling demo user:", error);
  });
}, 1000);

export default supabase;
