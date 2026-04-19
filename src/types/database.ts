export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      csv_imports: {
        Row: {
          batch_id: string
          completed_at: string | null
          created_at: string
          duplicate_rows: number
          flagged_rows: number
          id: string
          import_type: string
          imported_by: string
          status: Database["public"]["Enums"]["import_status"]
          total_rows: number
          valid_rows: number
        }
        Insert: {
          batch_id?: string
          completed_at?: string | null
          created_at?: string
          duplicate_rows?: number
          flagged_rows?: number
          id?: string
          import_type?: string
          imported_by: string
          status?: Database["public"]["Enums"]["import_status"]
          total_rows?: number
          valid_rows?: number
        }
        Update: {
          batch_id?: string
          completed_at?: string | null
          created_at?: string
          duplicate_rows?: number
          flagged_rows?: number
          id?: string
          import_type?: string
          imported_by?: string
          status?: Database["public"]["Enums"]["import_status"]
          total_rows?: number
          valid_rows?: number
        }
        Relationships: [
          {
            foreignKeyName: "csv_imports_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: string
          lead_id: string
          payload: Json
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          lead_id: string
          payload?: Json
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          lead_id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "lead_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          contact_status: Database["public"]["Enums"]["contact_status"]
          created_at: string
          created_by: string | null
          date_assigned: string | null
          id: string
          import_batch_id: string | null
          interest_level: string | null
          is_dnc: boolean
          is_duplicate: boolean
          last_touched_at: string | null
          name: string | null
          phone_number: string
          response_outcome: string | null
          source: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          contact_status?: Database["public"]["Enums"]["contact_status"]
          created_at?: string
          created_by?: string | null
          date_assigned?: string | null
          id?: string
          import_batch_id?: string | null
          interest_level?: string | null
          is_dnc?: boolean
          is_duplicate?: boolean
          last_touched_at?: string | null
          name?: string | null
          phone_number: string
          response_outcome?: string | null
          source?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          contact_status?: Database["public"]["Enums"]["contact_status"]
          created_at?: string
          created_by?: string | null
          date_assigned?: string | null
          id?: string
          import_batch_id?: string | null
          interest_level?: string | null
          is_dnc?: boolean
          is_duplicate?: boolean
          last_touched_at?: string | null
          name?: string | null
          phone_number?: string
          response_outcome?: string | null
          source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "csv_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          capacity: number
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      response_outcomes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          is_default: boolean
          label: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          label: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          label?: string
        }
        Relationships: [
          {
            foreignKeyName: "response_outcomes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      even_split_assign: {
        Args: { lead_ids: string[]; rep_ids: string[] }
        Returns: undefined
      }
      get_inactivity_report: {
        Args: never
        Returns: {
          oldest_assignment: string
          overdue_leads: number
          rep_id: string
          rep_name: string
        }[]
      }
      get_team_performance: {
        Args: never
        Returns: {
          capacity: number
          leads_assigned: number
          leads_contacted: number
          leads_overdue: number
          leads_responded: number
          rep_id: string
          rep_name: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_sales: { Args: never; Returns: boolean }
      normalise_phone: { Args: { raw_phone: string }; Returns: string }
      redistribute_on_rep_deactivate: {
        Args: { rep_id: string }
        Returns: undefined
      }
    }
    Enums: {
      contact_status:
        | "Not Yet Contacted"
        | "Called"
        | "Callback Scheduled"
        | "Unreachable"
        | "Connected"
        | "Do Not Contact"
      import_status: "pending" | "processing" | "complete" | "failed"
      user_role: "admin" | "sales"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      contact_status: [
        "Not Yet Contacted",
        "Called",
        "Callback Scheduled",
        "Unreachable",
        "Connected",
        "Do Not Contact",
      ],
      import_status: ["pending", "processing", "complete", "failed"],
      user_role: ["admin", "sales"],
    },
  },
} as const


export type ContactStatus = Database['public']['Enums']['contact_status']
export type Lead = Database['public']['Tables']['leads']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type LeadEvent = Database['public']['Tables']['lead_events']['Row']
export type CsvImport = Database['public']['Tables']['csv_imports']['Row']
export type ResponseOutcome = Database['public']['Tables']['response_outcomes']['Row']
