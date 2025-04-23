import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create the Supabase client with additional options for better error handling
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
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
  role: 'owner' | 'admin' | 'member';
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
  key_type: 'development' | 'staging' | 'production';
  provider: string | null;
  environment: 'development' | 'staging' | 'production';
}

export interface KeyHistory {
  id: string;
  api_key_id: string;
  action: 'created' | 'updated' | 'deleted' | 'viewed' | 'rotated';
  performed_by: string;
  performed_at: Date;
  details: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
}

// Database queries
export const queries = {
  createApiKey: async (apiKeyData: Omit<ApiKey, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('api_keys')
      .insert([apiKeyData])
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  },

  addKeyHistory: async (historyData: Omit<KeyHistory, 'id' | 'performed_at'>) => {
    const { data, error } = await supabase
      .from('key_history')
      .insert([historyData])
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  },

  // User management
  createDemoUser: async () => {
    try {
      // Try to sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: 'demo@example.com',
        password: 'demo@2025',
      });

      // Only create a new user if sign in fails with user not found
      if (signInError && signInError.message.includes('Invalid login credentials')) {
        const { data, error } = await supabase.auth.signUp({
          email: 'demo@example.com',
          password: 'demo@2025',
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        });

        if (error) {
          console.error('Error creating demo user:', error);
          throw error;
        }
        return data;
      }
      
      // If sign in was successful or failed for other reasons, return silently
      return null;
    } catch (error) {
      console.error('Error in createDemoUser:', error);
      // Don't throw the error here to prevent app crashes
      return null;
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error in signIn:', error);
      throw error;
    }
  }
};

// Create demo user on initialization if it doesn't exist
// Wrap in a setTimeout to ensure DOM is fully loaded
setTimeout(() => {
  queries.createDemoUser().catch(error => {
    console.error('Error handling demo user:', error);
  });
}, 1000);

export default supabase;