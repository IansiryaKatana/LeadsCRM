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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_trail: {
        Row: {
          action: string
          id: string
          lead_id: string
          new_value: Json | null
          old_value: Json | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          action: string
          id?: string
          lead_id: string
          new_value?: Json | null
          old_value?: Json | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          id?: string
          lead_id?: string
          new_value?: Json | null
          old_value?: Json | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_trail_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_imports: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_log: Json | null
          failed_rows: number
          file_name: string
          id: string
          status: string
          successful_rows: number
          total_rows: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_log?: Json | null
          failed_rows?: number
          file_name: string
          id?: string
          status?: string
          successful_rows?: number
          total_rows?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_log?: Json | null
          failed_rows?: number
          file_name?: string
          id?: string
          status?: string
          successful_rows?: number
          total_rows?: number
        }
        Relationships: []
      }
      lead_notes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          lead_id: string
          note: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id: string
          note: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          academic_year: string
          assigned_to: string | null
          contact_message: string | null
          contact_reason: string | null
          keyworker_length_of_stay: string | null
          keyworker_preferred_date: string | null
          landing_page: string | null
          created_at: string
          created_by: string | null
          email: string
          followup_count: number
          full_name: string
          id: string
          is_hot: boolean
          last_followup_date: string | null
          lead_status: Database["public"]["Enums"]["lead_status"]
          next_followup_date: string | null
          phone: string
          potential_revenue: number
          room_choice: Database["public"]["Enums"]["room_choice"]
          source: Database["public"]["Enums"]["lead_source"]
          stay_duration: Database["public"]["Enums"]["stay_duration"]
          updated_at: string
        }
        Insert: {
          academic_year?: string
          assigned_to?: string | null
          contact_message?: string | null
          contact_reason?: string | null
          keyworker_length_of_stay?: string | null
          keyworker_preferred_date?: string | null
          landing_page?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          followup_count?: number
          full_name: string
          id?: string
          is_hot?: boolean
          last_followup_date?: string | null
          lead_status?: Database["public"]["Enums"]["lead_status"]
          next_followup_date?: string | null
          phone: string
          potential_revenue?: number
          room_choice?: Database["public"]["Enums"]["room_choice"]
          source?: Database["public"]["Enums"]["lead_source"]
          stay_duration?: Database["public"]["Enums"]["stay_duration"]
          updated_at?: string
        }
        Update: {
          academic_year?: string
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          contact_message?: string | null
          contact_reason?: string | null
          keyworker_length_of_stay?: string | null
          keyworker_preferred_date?: string | null
          landing_page?: string | null
          email?: string
          followup_count?: number
          full_name?: string
          id?: string
          is_hot?: boolean
          last_followup_date?: string | null
          lead_status?: Database["public"]["Enums"]["lead_status"]
          next_followup_date?: string | null
          phone?: string
          potential_revenue?: number
          room_choice?: Database["public"]["Enums"]["room_choice"]
          source?: Database["public"]["Enums"]["lead_source"]
          stay_duration?: Database["public"]["Enums"]["stay_duration"]
          updated_at?: string
        }
        Relationships: []
      }
      lead_followups: {
        Row: {
          id: string
          lead_id: string
          followup_number: number
          followup_type: Database["public"]["Enums"]["followup_type"]
          followup_date: string
          outcome: Database["public"]["Enums"]["followup_outcome"]
          notes: string | null
          next_action_date: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          followup_number: number
          followup_type: Database["public"]["Enums"]["followup_type"]
          followup_date?: string
          outcome: Database["public"]["Enums"]["followup_outcome"]
          notes?: string | null
          next_action_date?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          followup_number?: number
          followup_type?: Database["public"]["Enums"]["followup_type"]
          followup_date?: string
          outcome?: Database["public"]["Enums"]["followup_outcome"]
          notes?: string | null
          next_action_date?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_followups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_close_lead: {
        Args: {
          _lead_id: string
        }
        Returns: boolean
      }
      has_elevated_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "manager" | "salesperson" | "viewer"
      followup_outcome:
        | "contacted"
        | "no_answer"
        | "voicemail"
        | "not_interested"
        | "interested"
        | "callback_requested"
        | "wrong_contact_info"
      followup_type: "call" | "email" | "whatsapp" | "in_person" | "other"
      lead_source:
        | "tiktok"
        | "meta"
        | "google_ads"
        | "website"
        | "whatsapp"
        | "email"
        | "referral"
      lead_status:
        | "new"
        | "awaiting_outreach"
        | "low_engagement"
        | "high_interest"
        | "converted"
        | "closed"
      room_choice: "platinum" | "gold" | "silver" | "bronze" | "standard"
      stay_duration: "51_weeks" | "45_weeks" | "short_stay"
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
      app_role: ["super_admin", "admin", "manager", "salesperson", "viewer"],
      lead_source: [
        "tiktok",
        "meta",
        "google_ads",
        "website",
        "whatsapp",
        "email",
        "referral",
      ],
      lead_status: [
        "new",
        "awaiting_outreach",
        "low_engagement",
        "high_interest",
        "converted",
        "closed",
      ],
      room_choice: ["platinum", "gold", "silver", "bronze", "standard"],
      stay_duration: ["51_weeks", "45_weeks", "short_stay"],
    },
  },
} as const
