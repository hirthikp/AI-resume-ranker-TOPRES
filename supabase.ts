import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Using local storage fallback.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          password: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          password: string;
          role: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          password?: string;
          role?: string;
          created_at?: string;
        };
      };
      resumes: {
        Row: {
          id: string;
          candidate_id: string;
          candidate_name: string;
          content: string;
          file_data: string | null;
          file_name: string | null;
          upload_date: string;
          status: string;
          analysis: any | null;
          shortlisted: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          candidate_name: string;
          content: string;
          file_data?: string | null;
          file_name?: string | null;
          upload_date?: string;
          status?: string;
          analysis?: any | null;
          shortlisted?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          candidate_name?: string;
          content?: string;
          file_data?: string | null;
          file_name?: string | null;
          upload_date?: string;
          status?: string;
          analysis?: any | null;
          shortlisted?: boolean;
          created_at?: string;
        };
      };
      job_descriptions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          created_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          created_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          created_at?: string;
          is_active?: boolean;
        };
      };
    };
  };
}