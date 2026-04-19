export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: 'admin' | 'sales'
          capacity: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: 'admin' | 'sales'
          capacity?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'admin' | 'sales'
          capacity?: number
          is_active?: boolean
          updated_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          name: string | null
          phone_number: string
          source: string | null
          interest_level: string | null
          assigned_to: string | null
          contact_status: ContactStatus
          response_outcome: string | null
          date_assigned: string | null
          last_touched_at: string | null
          is_duplicate: boolean
          is_dnc: boolean
          import_batch_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          phone_number: string
          source?: string | null
          interest_level?: string | null
          assigned_to?: string | null
          contact_status?: ContactStatus
          response_outcome?: string | null
          date_assigned?: string | null
          last_touched_at?: string | null
          is_duplicate?: boolean
          is_dnc?: boolean
          import_batch_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string | null
          phone_number?: string
          source?: string | null
          interest_level?: string | null
          assigned_to?: string | null
          contact_status?: ContactStatus
          response_outcome?: string | null
          date_assigned?: string | null
          last_touched_at?: string | null
          is_dnc?: boolean
          updated_at?: string
        }
      }
      lead_events: {
        Row: {
          id: string
          lead_id: string
          actor_id: string | null
          event_type: string
          payload: Json
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          actor_id?: string | null
          event_type: string
          payload?: Json
          created_at?: string
        }
        Update: never
      }
      csv_imports: {
        Row: {
          id: string
          batch_id: string
          imported_by: string
          import_type: string
          total_rows: number
          valid_rows: number
          duplicate_rows: number
          flagged_rows: number
          status: 'pending' | 'processing' | 'complete' | 'failed'
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          batch_id?: string
          imported_by: string
          import_type?: string
          total_rows?: number
          valid_rows?: number
          duplicate_rows?: number
          flagged_rows?: number
          status?: 'pending' | 'processing' | 'complete' | 'failed'
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          total_rows?: number
          valid_rows?: number
          duplicate_rows?: number
          flagged_rows?: number
          status?: 'pending' | 'processing' | 'complete' | 'failed'
          completed_at?: string | null
        }
      }
      response_outcomes: {
        Row: {
          id: string
          label: string
          is_default: boolean
          is_active: boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          label: string
          is_default?: boolean
          is_active?: boolean
          created_by?: string | null
          created_at?: string
        }
        Update: {
          label?: string
          is_active?: boolean
        }
      }
      system_settings: {
        Row: {
          key: string
          value: string
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          key: string
          value: string
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          value?: string
          updated_by?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
        [_ in never]: never
    }
    Functions: {
      get_inactivity_report: {
        Returns: Array<{
          rep_id: string
          rep_name: string
          overdue_leads: number
          oldest_assignment: string
        }>
      }
      get_team_performance: {
        Returns: Array<{
          rep_id: string
          rep_name: string
          leads_assigned: number
          leads_contacted: number
          leads_responded: number
          leads_overdue: number
          capacity: number
        }>
      }
      even_split_assign: {
        Args: { lead_ids: string[]; rep_ids: string[] }
        Returns: void
      }
      redistribute_on_rep_deactivate: {
        Args: { rep_id: string }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type ContactStatus =
  | 'Not Yet Contacted'
  | 'Called'
  | 'Callback Scheduled'
  | 'Unreachable'
  | 'Connected'
  | 'Do Not Contact'

export type Lead = Database['public']['Tables']['leads']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type LeadEvent = Database['public']['Tables']['lead_events']['Row']
export type CsvImport = Database['public']['Tables']['csv_imports']['Row']
export type ResponseOutcome = Database['public']['Tables']['response_outcomes']['Row']
