export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      ig_accounts: {
        Row: {
          id: string;
          ig_user_id: string;
          username: string | null;
          account_type: string | null;
          profile_picture_url: string | null;
          connected_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ig_user_id: string;
          username?: string | null;
          account_type?: string | null;
          profile_picture_url?: string | null;
          connected_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['ig_accounts']['Insert']>;
      };
      ig_tokens: {
        Row: {
          id: string;
          account_id: string;
          access_token: string;
          token_type: string | null;
          expires_at: string | null;
          scope: string | null;
          raw_token_response: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          access_token: string;
          token_type?: string | null;
          expires_at?: string | null;
          scope?: string | null;
          raw_token_response?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['ig_tokens']['Insert']>;
      };
      account_daily_metrics: {
        Row: {
          id: string;
          account_id: string;
          metric_date: string;
          followers_count: number | null;
          follows: number | null;
          reach: number | null;
          profile_views: number | null;
          impressions: number | null;
          raw_payload: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          metric_date: string;
          followers_count?: number | null;
          follows?: number | null;
          reach?: number | null;
          profile_views?: number | null;
          impressions?: number | null;
          raw_payload?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['account_daily_metrics']['Insert']>;
      };
      media_items: {
        Row: {
          id: string;
          account_id: string;
          ig_media_id: string;
          caption: string | null;
          media_type: string | null;
          media_product_type: string | null;
          permalink: string | null;
          thumbnail_url: string | null;
          media_url: string | null;
          posted_at: string | null;
          series: string | null;
          slide_count: number | null;
          content_role: string | null;
          ai_confidence: number | null;
          ai_reason: string | null;
          hashtag_set: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          ig_media_id: string;
          caption?: string | null;
          media_type?: string | null;
          media_product_type?: string | null;
          permalink?: string | null;
          thumbnail_url?: string | null;
          media_url?: string | null;
          posted_at?: string | null;
          series?: string | null;
          slide_count?: number | null;
          content_role?: string | null;
          ai_confidence?: number | null;
          ai_reason?: string | null;
          hashtag_set?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['media_items']['Insert']>;
      };
      media_insights_daily: {
        Row: {
          id: string;
          media_item_id: string;
          metric_date: string;
          like_count: number | null;
          comments_count: number | null;
          save_count: number | null;
          shares: number | null;
          reach: number | null;
          plays: number | null;
          impressions: number | null;
          raw_payload: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          media_item_id: string;
          metric_date: string;
          like_count?: number | null;
          comments_count?: number | null;
          save_count?: number | null;
          shares?: number | null;
          reach?: number | null;
          plays?: number | null;
          impressions?: number | null;
          raw_payload?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['media_insights_daily']['Insert']>;
      };
    };
    Views: {
      growth_overview: {
        Row: {
          account_id: string | null;
          metric_date: string | null;
          followers_count: number | null;
          follows: number | null;
          reach: number | null;
          profile_views: number | null;
          impressions: number | null;
          prev_followers_count: number | null;
          follower_net_delta: number | null;
        };
      };
    };
  };
};
