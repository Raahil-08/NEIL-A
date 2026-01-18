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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      demo_state: {
        Row: {
          active_attack_id: string | null
          auto_approve: boolean
          current_phase: string
          id: string
          is_running: boolean
          pending_mitigation_id: string | null
          updated_at: string
        }
        Insert: {
          active_attack_id?: string | null
          auto_approve?: boolean
          current_phase?: string
          id?: string
          is_running?: boolean
          pending_mitigation_id?: string | null
          updated_at?: string
        }
        Update: {
          active_attack_id?: string | null
          auto_approve?: boolean
          current_phase?: string
          id?: string
          is_running?: boolean
          pending_mitigation_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_state_active_attack_id_fkey"
            columns: ["active_attack_id"]
            isOneToOne: false
            referencedRelation: "threat_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_state_pending_mitigation_id_fkey"
            columns: ["pending_mitigation_id"]
            isOneToOne: false
            referencedRelation: "threat_events"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_reputation_cache: {
        Row: {
          abuse_confidence: number
          cached_at: string
          country_code: string | null
          domain: string | null
          expires_at: string
          ip_address: string
          is_public: boolean | null
          is_tor: boolean | null
          isp: string | null
          last_reported_at: string | null
          total_reports: number | null
        }
        Insert: {
          abuse_confidence: number
          cached_at?: string
          country_code?: string | null
          domain?: string | null
          expires_at?: string
          ip_address: string
          is_public?: boolean | null
          is_tor?: boolean | null
          isp?: string | null
          last_reported_at?: string | null
          total_reports?: number | null
        }
        Update: {
          abuse_confidence?: number
          cached_at?: string
          country_code?: string | null
          domain?: string | null
          expires_at?: string
          ip_address?: string
          is_public?: boolean | null
          is_tor?: boolean | null
          isp?: string | null
          last_reported_at?: string | null
          total_reports?: number | null
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          anomaly_score: number
          baseline: number
          created_at: string
          id: string
          metric_type: string
          node_id: string | null
          value: number
        }
        Insert: {
          anomaly_score?: number
          baseline: number
          created_at?: string
          id?: string
          metric_type: string
          node_id?: string | null
          value: number
        }
        Update: {
          anomaly_score?: number
          baseline?: number
          created_at?: string
          id?: string
          metric_type?: string
          node_id?: string | null
          value?: number
        }
        Relationships: []
      }
      system_nodes: {
        Row: {
          connections: string[]
          error_rate: number
          id: string
          latency: number
          name: string
          node_type: string
          requests: number
          status: string
          updated_at: string
        }
        Insert: {
          connections?: string[]
          error_rate?: number
          id: string
          latency?: number
          name: string
          node_type: string
          requests?: number
          status?: string
          updated_at?: string
        }
        Update: {
          connections?: string[]
          error_rate?: number
          id?: string
          latency?: number
          name?: string
          node_type?: string
          requests?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      threat_events: {
        Row: {
          anomaly_score: number
          confidence: number
          created_at: string
          description: string
          event_type: string
          explanation: string
          id: string
          ip_reputation_involved: boolean | null
          ip_reputation_score: number | null
          mitigation_applied: string | null
          severity: string
          source_ip: string
          status: string
          target_endpoint: string
          updated_at: string
          weather_context_applied: boolean | null
          weather_modifier: number | null
        }
        Insert: {
          anomaly_score?: number
          confidence?: number
          created_at?: string
          description: string
          event_type: string
          explanation: string
          id?: string
          ip_reputation_involved?: boolean | null
          ip_reputation_score?: number | null
          mitigation_applied?: string | null
          severity: string
          source_ip: string
          status?: string
          target_endpoint: string
          updated_at?: string
          weather_context_applied?: boolean | null
          weather_modifier?: number | null
        }
        Update: {
          anomaly_score?: number
          confidence?: number
          created_at?: string
          description?: string
          event_type?: string
          explanation?: string
          id?: string
          ip_reputation_involved?: boolean | null
          ip_reputation_score?: number | null
          mitigation_applied?: string | null
          severity?: string
          source_ip?: string
          status?: string
          target_endpoint?: string
          updated_at?: string
          weather_context_applied?: boolean | null
          weather_modifier?: number | null
        }
        Relationships: []
      }
      weather_cache: {
        Row: {
          cached_at: string
          condition: string
          description: string | null
          expires_at: string
          humidity: number | null
          is_severe: boolean | null
          location: string
          severity_modifier: number | null
          temperature: number | null
          wind_speed: number | null
        }
        Insert: {
          cached_at?: string
          condition: string
          description?: string | null
          expires_at?: string
          humidity?: number | null
          is_severe?: boolean | null
          location?: string
          severity_modifier?: number | null
          temperature?: number | null
          wind_speed?: number | null
        }
        Update: {
          cached_at?: string
          condition?: string
          description?: string | null
          expires_at?: string
          humidity?: number | null
          is_severe?: boolean | null
          location?: string
          severity_modifier?: number | null
          temperature?: number | null
          wind_speed?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
