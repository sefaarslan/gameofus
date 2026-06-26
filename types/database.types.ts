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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: string
          is_premium: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_premium?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_premium?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      answers: {
        Row: {
          answer_value: Json
          created_at: string
          id: string
          locked_at: string | null
          participant_id: string
          question_id: string
          room_id: string
        }
        Insert: {
          answer_value: Json
          created_at?: string
          id?: string
          locked_at?: string | null
          participant_id: string
          question_id: string
          room_id: string
        }
        Update: {
          answer_value?: Json
          created_at?: string
          id?: string
          locked_at?: string | null
          participant_id?: string
          question_id?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          completed_at: string | null
          created_at: string
          display_name: string | null
          id: string
          last_seen_at: string | null
          role: Database["public"]["Enums"]["participant_role"]
          room_id: string
          status: Database["public"]["Enums"]["participant_status"]
          token_hash: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          last_seen_at?: string | null
          role: Database["public"]["Enums"]["participant_role"]
          room_id: string
          status?: Database["public"]["Enums"]["participant_status"]
          token_hash: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          last_seen_at?: string | null
          role?: Database["public"]["Enums"]["participant_role"]
          room_id?: string
          status?: Database["public"]["Enums"]["participant_status"]
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          provider: string
          provider_event_id: string
          room_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          provider?: string
          provider_event_id: string
          room_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          provider?: string
          provider_event_id?: string
          room_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          confidence_level: Database["public"]["Enums"]["confidence_level"]
          confidence_multiplier: number
          created_at: string
          id: string
          locked_at: string | null
          predicted_value: Json
          predictor_participant_id: string
          question_id: string
          room_id: string
          target_participant_id: string
        }
        Insert: {
          confidence_level?: Database["public"]["Enums"]["confidence_level"]
          confidence_multiplier?: number
          created_at?: string
          id?: string
          locked_at?: string | null
          predicted_value: Json
          predictor_participant_id: string
          question_id: string
          room_id: string
          target_participant_id: string
        }
        Update: {
          confidence_level?: Database["public"]["Enums"]["confidence_level"]
          confidence_multiplier?: number
          created_at?: string
          id?: string
          locked_at?: string | null
          predicted_value?: Json
          predictor_participant_id?: string
          question_id?: string
          room_id?: string
          target_participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_predictor_participant_id_fkey"
            columns: ["predictor_participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_target_participant_id_fkey"
            columns: ["target_participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      question_options: {
        Row: {
          id: string
          option_text: string
          question_id: string
          sort_order: number
        }
        Insert: {
          id?: string
          option_text: string
          question_id: string
          sort_order: number
        }
        Update: {
          id?: string
          option_text?: string
          question_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          is_active: boolean
          locale: string
          mode: Database["public"]["Enums"]["game_mode"]
          question_text: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          locale?: string
          mode?: Database["public"]["Enums"]["game_mode"]
          question_text: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          locale?: string
          mode?: Database["public"]["Enums"]["game_mode"]
          question_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          action: string
          count: number
          created_at: string
          id: string
          key: string
          window_start: string
        }
        Insert: {
          action: string
          count?: number
          created_at?: string
          id?: string
          key: string
          window_start?: string
        }
        Update: {
          action?: string
          count?: number
          created_at?: string
          id?: string
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      results: {
        Row: {
          created_at: string
          details_json: Json
          id: string
          reading_score: number
          room_id: string
        }
        Insert: {
          created_at?: string
          details_json?: Json
          id?: string
          reading_score: number
          room_id: string
        }
        Update: {
          created_at?: string
          details_json?: Json
          id?: string
          reading_score?: number
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "results_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_questions: {
        Row: {
          id: string
          question_id: string
          room_id: string
          round_order: number
        }
        Insert: {
          id?: string
          question_id: string
          room_id: string
          round_order: number
        }
        Update: {
          id?: string
          question_id?: string
          room_id?: string
          round_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "room_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_questions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          expires_at: string
          game_mode: Database["public"]["Enums"]["game_mode"]
          id: string
          is_premium_room: boolean
          join_locked: boolean
          locale: string
          max_participants: number
          owner_id: string | null
          question_count: number
          room_code: string
          status: Database["public"]["Enums"]["room_status"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          game_mode?: Database["public"]["Enums"]["game_mode"]
          id?: string
          is_premium_room?: boolean
          join_locked?: boolean
          locale?: string
          max_participants?: number
          owner_id?: string | null
          question_count: number
          room_code: string
          status?: Database["public"]["Enums"]["room_status"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          game_mode?: Database["public"]["Enums"]["game_mode"]
          id?: string
          is_premium_room?: boolean
          join_locked?: boolean
          locale?: string
          max_participants?: number
          owner_id?: string | null
          question_count?: number
          room_code?: string
          status?: Database["public"]["Enums"]["room_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          id: string
          premium_until: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          premium_until?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          premium_until?: string | null
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
      confidence_level: "guess" | "think" | "sure"
      game_mode: "secret_choice" | "prediction" | "orderline" | "mixed"
      participant_role: "owner" | "guest"
      participant_status: "invited" | "joined" | "playing" | "completed"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      room_status:
        | "created"
        | "owner_playing"
        | "owner_completed"
        | "waiting_guest"
        | "guest_joined"
        | "guest_playing"
        | "guest_completed"
        | "result_ready"
        | "completed"
        | "expired"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      confidence_level: ["guess", "think", "sure"],
      game_mode: ["secret_choice", "prediction", "orderline", "mixed"],
      participant_role: ["owner", "guest"],
      participant_status: ["invited", "joined", "playing", "completed"],
      payment_status: ["pending", "paid", "failed", "refunded"],
      room_status: [
        "created",
        "owner_playing",
        "owner_completed",
        "waiting_guest",
        "guest_joined",
        "guest_playing",
        "guest_completed",
        "result_ready",
        "completed",
        "expired",
      ],
    },
  },
} as const
