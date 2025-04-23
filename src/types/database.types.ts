export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string
          created_at: string
          updated_at: string
          archived_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          created_at?: string
        }
      }
      api_keys: {
        Row: {
          id: string
          name: string
          key_value: string
          project_id: string
          created_by: string
          created_at: string
          updated_at: string
          expires_at: string | null
          last_used_at: string | null
          is_active: boolean
          key_type: 'development' | 'staging' | 'production'
          provider: string | null
          environment: 'development' | 'staging' | 'production'
        }
        Insert: {
          id?: string
          name: string
          key_value: string
          project_id: string
          created_by: string
          created_at?: string
          updated_at?: string
          expires_at?: string | null
          last_used_at?: string | null
          is_active?: boolean
          key_type: 'development' | 'staging' | 'production'
          provider?: string | null
          environment: 'development' | 'staging' | 'production'
        }
        Update: {
          id?: string
          name?: string
          key_value?: string
          project_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
          expires_at?: string | null
          last_used_at?: string | null
          is_active?: boolean
          key_type?: 'development' | 'staging' | 'production'
          provider?: string | null
          environment?: 'development' | 'staging' | 'production'
        }
      }
      key_history: {
        Row: {
          id: string
          api_key_id: string
          action: 'created' | 'updated' | 'deleted' | 'viewed' | 'rotated'
          performed_by: string
          performed_at: string
          details: Json | null
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          api_key_id: string
          action: 'created' | 'updated' | 'deleted' | 'viewed' | 'rotated'
          performed_by: string
          performed_at?: string
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          api_key_id?: string
          action?: 'created' | 'updated' | 'deleted' | 'viewed' | 'rotated'
          performed_by?: string
          performed_at?: string
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_project_admin: {
        Args: {
          project_id: string
          user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}