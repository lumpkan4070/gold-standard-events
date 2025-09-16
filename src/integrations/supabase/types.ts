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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          description: string | null
          id: string
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          description?: string | null
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          description?: string | null
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      analytics: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      contest_entries: {
        Row: {
          age_bracket: string
          city_state: string | null
          email: string
          full_name: string
          id: string
          ip_address: string | null
          submitted_at: string
          user_agent: string | null
        }
        Insert: {
          age_bracket: string
          city_state?: string | null
          email: string
          full_name: string
          id?: string
          ip_address?: string | null
          submitted_at?: string
          user_agent?: string | null
        }
        Update: {
          age_bracket?: string
          city_state?: string | null
          email?: string
          full_name?: string
          id?: string
          ip_address?: string | null
          submitted_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      dare_prompts: {
        Row: {
          category: Database["public"]["Enums"]["prompt_category"]
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          offer_id: string | null
          points_reward: number
          text: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["prompt_category"]
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          offer_id?: string | null
          points_reward?: number
          text: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["prompt_category"]
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          offer_id?: string | null
          points_reward?: number
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dare_prompts_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      dj_ratings: {
        Row: {
          comment: string | null
          created_at: string
          dj_id: string
          id: string
          performance_date: string | null
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          dj_id: string
          id?: string
          performance_date?: string | null
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          dj_id?: string
          id?: string
          performance_date?: string | null
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dj_ratings_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "djs"
            referencedColumns: ["id"]
          },
        ]
      }
      djs: {
        Row: {
          average_rating: number | null
          bio: string | null
          created_at: string
          genre_specialties: string[] | null
          id: string
          is_active: boolean
          name: string
          profile_image_url: string | null
          total_ratings: number | null
          updated_at: string
        }
        Insert: {
          average_rating?: number | null
          bio?: string | null
          created_at?: string
          genre_specialties?: string[] | null
          id?: string
          is_active?: boolean
          name: string
          profile_image_url?: string | null
          total_ratings?: number | null
          updated_at?: string
        }
        Update: {
          average_rating?: number | null
          bio?: string | null
          created_at?: string
          genre_specialties?: string[] | null
          id?: string
          is_active?: boolean
          name?: string
          profile_image_url?: string | null
          total_ratings?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      event_bookings: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          email: string
          event_date: string
          event_image_url: string | null
          event_title: string | null
          id: string
          message: string | null
          name: string
          number_of_guests: number
          phone: string
          special_requests: string | null
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email: string
          event_date: string
          event_image_url?: string | null
          event_title?: string | null
          id?: string
          message?: string | null
          name: string
          number_of_guests: number
          phone: string
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string
          event_date?: string
          event_image_url?: string | null
          event_title?: string | null
          id?: string
          message?: string | null
          name?: string
          number_of_guests?: number
          phone?: string
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          event_date: string
          featured_image_url: string | null
          id: string
          is_approved: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          event_date: string
          featured_image_url?: string | null
          id?: string
          is_approved?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          event_date?: string
          featured_image_url?: string | null
          id?: string
          is_approved?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_recipients: {
        Row: {
          created_at: string
          delivered_at: string | null
          id: string
          notification_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          id?: string
          notification_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          id?: string
          notification_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_recipients_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          delivered_count: number | null
          id: string
          message: string
          opened_count: number | null
          recipient_count: number | null
          sent_at: string
          sent_by: string | null
          title: string
        }
        Insert: {
          delivered_count?: number | null
          id?: string
          message: string
          opened_count?: number | null
          recipient_count?: number | null
          sent_at?: string
          sent_by?: string | null
          title: string
        }
        Update: {
          delivered_count?: number | null
          id?: string
          message?: string
          opened_count?: number | null
          recipient_count?: number | null
          sent_at?: string
          sent_by?: string | null
          title?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          created_at: string
          created_by: string
          current_uses: number
          description: string | null
          discount_amount: number | null
          discount_percentage: number | null
          id: string
          is_active: boolean
          max_uses: number | null
          offer_type: string
          title: string
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          current_uses?: number
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          offer_type?: string
          title: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          current_uses?: number
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          offer_type?: string
          title?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      photo_wall: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          caption: string | null
          created_at: string
          id: string
          image_url: string
          is_approved: boolean
          is_featured: boolean
          likes_count: number
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_approved?: boolean
          is_featured?: boolean
          likes_count?: number
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_approved?: boolean
          is_featured?: boolean
          likes_count?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          anniversary: string | null
          birthday: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          last_visit: string | null
          phone: string | null
          preferences: Json | null
          total_bookings: number
          updated_at: string
          user_id: string
          victory_points: number
          vip_status: boolean
        }
        Insert: {
          anniversary?: string | null
          birthday?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          last_visit?: string | null
          phone?: string | null
          preferences?: Json | null
          total_bookings?: number
          updated_at?: string
          user_id: string
          victory_points?: number
          vip_status?: boolean
        }
        Update: {
          anniversary?: string | null
          birthday?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          last_visit?: string | null
          phone?: string | null
          preferences?: Json | null
          total_bookings?: number
          updated_at?: string
          user_id?: string
          victory_points?: number
          vip_status?: boolean
        }
        Relationships: []
      }
      song_requests: {
        Row: {
          artist: string
          created_at: string
          dj_id: string | null
          event_date: string | null
          id: string
          requested_by_name: string | null
          song_title: string
          status: string | null
          updated_at: string
          user_id: string
          vote_count: number | null
        }
        Insert: {
          artist: string
          created_at?: string
          dj_id?: string | null
          event_date?: string | null
          id?: string
          requested_by_name?: string | null
          song_title: string
          status?: string | null
          updated_at?: string
          user_id: string
          vote_count?: number | null
        }
        Update: {
          artist?: string
          created_at?: string
          dj_id?: string | null
          event_date?: string | null
          id?: string
          requested_by_name?: string | null
          song_title?: string
          status?: string | null
          updated_at?: string
          user_id?: string
          vote_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "song_requests_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "djs"
            referencedColumns: ["id"]
          },
        ]
      }
      song_votes: {
        Row: {
          created_at: string
          id: string
          song_request_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          song_request_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          song_request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_votes_song_request_id_fkey"
            columns: ["song_request_id"]
            isOneToOne: false
            referencedRelation: "song_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_votes_song_request_id_fkey"
            columns: ["song_request_id"]
            isOneToOne: false
            referencedRelation: "song_requests_public"
            referencedColumns: ["id"]
          },
        ]
      }
      truth_prompts: {
        Row: {
          category: Database["public"]["Enums"]["prompt_category"]
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          text: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["prompt_category"]
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          text: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["prompt_category"]
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_game_activity: {
        Row: {
          completed: boolean
          completion_data: Json | null
          created_at: string
          game_session_id: string
          id: string
          points_awarded: number
          posted_to_photo_wall: boolean
          prompt_id: string
          prompt_type: Database["public"]["Enums"]["game_prompt_type"]
          shared_to_social: boolean
          user_id: string
        }
        Insert: {
          completed?: boolean
          completion_data?: Json | null
          created_at?: string
          game_session_id?: string
          id?: string
          points_awarded?: number
          posted_to_photo_wall?: boolean
          prompt_id: string
          prompt_type: Database["public"]["Enums"]["game_prompt_type"]
          shared_to_social?: boolean
          user_id: string
        }
        Update: {
          completed?: boolean
          completion_data?: Json | null
          created_at?: string
          game_session_id?: string
          id?: string
          points_awarded?: number
          posted_to_photo_wall?: boolean
          prompt_id?: string
          prompt_type?: Database["public"]["Enums"]["game_prompt_type"]
          shared_to_social?: boolean
          user_id?: string
        }
        Relationships: []
      }
      user_offers: {
        Row: {
          id: string
          offer_id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          id?: string
          offer_id: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          id?: string
          offer_id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_offers_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
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
      contest_stats: {
        Row: {
          age_bracket: string | null
          daily_entries: number | null
          entries_per_age_bracket: number | null
          submission_date: string | null
          total_entries: number | null
          unique_age_brackets: number | null
        }
        Relationships: []
      }
      song_requests_public: {
        Row: {
          artist: string | null
          created_at: string | null
          event_date: string | null
          id: string | null
          requested_by_name: string | null
          song_title: string | null
          status: string | null
          user_id: string | null
          vote_count: number | null
        }
        Insert: {
          artist?: string | null
          created_at?: string | null
          event_date?: string | null
          id?: string | null
          requested_by_name?: never
          song_title?: string | null
          status?: string | null
          user_id?: never
          vote_count?: number | null
        }
        Update: {
          artist?: string | null
          created_at?: string | null
          event_date?: string | null
          id?: string | null
          requested_by_name?: never
          song_title?: string | null
          status?: string | null
          user_id?: never
          vote_count?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_assign_role: {
        Args: {
          _admin_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      admin_delete_user: {
        Args: { _admin_id: string; _user_id: string }
        Returns: undefined
      }
      award_victory_points: {
        Args: { points: number; user_uuid: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_offer_usage: {
        Args: { offer_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      booking_status: "pending" | "approved" | "rejected"
      game_prompt_type: "truth" | "dare"
      prompt_category:
        | "icebreakers"
        | "party_fun"
        | "memory_lane"
        | "victory_specials"
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
      app_role: ["admin", "user"],
      booking_status: ["pending", "approved", "rejected"],
      game_prompt_type: ["truth", "dare"],
      prompt_category: [
        "icebreakers",
        "party_fun",
        "memory_lane",
        "victory_specials",
      ],
    },
  },
} as const
