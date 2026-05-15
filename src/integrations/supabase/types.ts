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
      abandoned_checkouts: {
        Row: {
          admin_notes: string | null
          cart_items: Json
          contacted: boolean
          contacted_at: string | null
          converted: boolean
          converted_at: string | null
          converted_order_id: string | null
          coupon_code: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          discount_amount: number
          id: string
          item_count: number
          notes: string | null
          page_url: string | null
          payment_method: string | null
          session_token: string
          subtotal: number
          total: number
          updated_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          cart_items?: Json
          contacted?: boolean
          contacted_at?: string | null
          converted?: boolean
          converted_at?: string | null
          converted_order_id?: string | null
          coupon_code?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number
          id?: string
          item_count?: number
          notes?: string | null
          page_url?: string | null
          payment_method?: string | null
          session_token: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          cart_items?: Json
          contacted?: boolean
          contacted_at?: string | null
          converted?: boolean
          converted_at?: string | null
          converted_order_id?: string | null
          coupon_code?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number
          id?: string
          item_count?: number
          notes?: string | null
          page_url?: string | null
          payment_method?: string | null
          session_token?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      addresses: {
        Row: {
          address_line: string
          city: string
          created_at: string
          district: string | null
          id: string
          is_default: boolean
          label: string
          phone: string
          postal_code: string | null
          recipient_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line: string
          city: string
          created_at?: string
          district?: string | null
          id?: string
          is_default?: boolean
          label?: string
          phone: string
          postal_code?: string | null
          recipient_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line?: string
          city?: string
          created_at?: string
          district?: string | null
          id?: string
          is_default?: boolean
          label?: string
          phone?: string
          postal_code?: string | null
          recipient_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_2fa: {
        Row: {
          backup_codes: string[]
          created_at: string
          enabled: boolean
          last_used_at: string | null
          secret: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          backup_codes?: string[]
          created_at?: string
          enabled?: boolean
          last_used_at?: string | null
          secret: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          backup_codes?: string[]
          created_at?: string
          enabled?: boolean
          last_used_at?: string | null
          secret?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      admin_2fa_config: {
        Row: {
          allow_remember_device: boolean
          id: number
          remember_device_ttl_days: number
          session_ttl_hours: number
          updated_at: string
        }
        Insert: {
          allow_remember_device?: boolean
          id?: number
          remember_device_ttl_days?: number
          session_ttl_hours?: number
          updated_at?: string
        }
        Update: {
          allow_remember_device?: boolean
          id?: number
          remember_device_ttl_days?: number
          session_ttl_hours?: number
          updated_at?: string
        }
        Relationships: []
      }
      admin_2fa_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip: string | null
          token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip?: string | null
          token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip?: string | null
          token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_email_otps: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          expires_at: string
          id: string
          ip: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          created_at?: string
          expires_at: string
          id?: string
          ip?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          expires_at?: string
          id?: string
          ip?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      affiliate_accounts: {
        Row: {
          admin_note: string | null
          applicant_email: string | null
          applicant_name: string | null
          applicant_phone: string | null
          application_note: string | null
          approved_at: string | null
          approved_by: string | null
          audience_size: string | null
          available_balance: number
          created_at: string
          custom_commission_percent: number | null
          custom_customer_discount_percent: number | null
          facebook_url: string | null
          id: string
          niche: string | null
          other_social_url: string | null
          payout_account: string | null
          payout_account_name: string | null
          payout_method: string | null
          promotion_strategy: string | null
          referral_code: string
          status: string
          total_clicks: number
          total_conversions: number
          total_earned: number
          total_paid: number
          updated_at: string
          user_id: string
          website_url: string | null
          why_join: string | null
          youtube_url: string | null
        }
        Insert: {
          admin_note?: string | null
          applicant_email?: string | null
          applicant_name?: string | null
          applicant_phone?: string | null
          application_note?: string | null
          approved_at?: string | null
          approved_by?: string | null
          audience_size?: string | null
          available_balance?: number
          created_at?: string
          custom_commission_percent?: number | null
          custom_customer_discount_percent?: number | null
          facebook_url?: string | null
          id?: string
          niche?: string | null
          other_social_url?: string | null
          payout_account?: string | null
          payout_account_name?: string | null
          payout_method?: string | null
          promotion_strategy?: string | null
          referral_code: string
          status?: string
          total_clicks?: number
          total_conversions?: number
          total_earned?: number
          total_paid?: number
          updated_at?: string
          user_id: string
          website_url?: string | null
          why_join?: string | null
          youtube_url?: string | null
        }
        Update: {
          admin_note?: string | null
          applicant_email?: string | null
          applicant_name?: string | null
          applicant_phone?: string | null
          application_note?: string | null
          approved_at?: string | null
          approved_by?: string | null
          audience_size?: string | null
          available_balance?: number
          created_at?: string
          custom_commission_percent?: number | null
          custom_customer_discount_percent?: number | null
          facebook_url?: string | null
          id?: string
          niche?: string | null
          other_social_url?: string | null
          payout_account?: string | null
          payout_account_name?: string | null
          payout_method?: string | null
          promotion_strategy?: string | null
          referral_code?: string
          status?: string
          total_clicks?: number
          total_conversions?: number
          total_earned?: number
          total_paid?: number
          updated_at?: string
          user_id?: string
          website_url?: string | null
          why_join?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      affiliate_clicks: {
        Row: {
          affiliate_id: string
          converted: boolean
          country: string | null
          created_at: string
          id: string
          ip_address: string | null
          landing_page: string | null
          product_id: string | null
          referral_code: string
          referrer: string | null
          user_agent: string | null
          visitor_id: string | null
        }
        Insert: {
          affiliate_id: string
          converted?: boolean
          country?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          product_id?: string | null
          referral_code: string
          referrer?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Update: {
          affiliate_id?: string
          converted?: boolean
          country?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          product_id?: string | null
          referral_code?: string
          referrer?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_conversions: {
        Row: {
          affiliate_id: string
          commission_amount: number
          commission_percent: number
          created_at: string
          customer_discount_amount: number | null
          id: string
          order_id: string
          order_number: string
          order_total: number
          paid_at: string | null
          rejection_reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          commission_amount: number
          commission_percent: number
          created_at?: string
          customer_discount_amount?: number | null
          id?: string
          order_id: string
          order_number: string
          order_total: number
          paid_at?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number
          commission_percent?: number
          created_at?: string
          customer_discount_amount?: number | null
          id?: string
          order_id?: string
          order_number?: string
          order_total?: number
          paid_at?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_conversions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_conversions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_product_commissions: {
        Row: {
          commission_percent: number
          created_at: string
          customer_discount_percent: number | null
          id: string
          is_active: boolean
          product_id: string
          updated_at: string
        }
        Insert: {
          commission_percent: number
          created_at?: string
          customer_discount_percent?: number | null
          id?: string
          is_active?: boolean
          product_id: string
          updated_at?: string
        }
        Update: {
          commission_percent?: number
          created_at?: string
          customer_discount_percent?: number | null
          id?: string
          is_active?: boolean
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_product_commissions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_settings: {
        Row: {
          auto_approve_applications: boolean
          cookie_duration_days: number
          customer_discount_percent: number
          default_commission_percent: number
          enable_affiliate_commission: boolean
          enable_customer_discount: boolean
          id: number
          is_enabled: boolean
          minimum_withdrawal: number
          terms_and_conditions: string | null
          updated_at: string
        }
        Insert: {
          auto_approve_applications?: boolean
          cookie_duration_days?: number
          customer_discount_percent?: number
          default_commission_percent?: number
          enable_affiliate_commission?: boolean
          enable_customer_discount?: boolean
          id?: number
          is_enabled?: boolean
          minimum_withdrawal?: number
          terms_and_conditions?: string | null
          updated_at?: string
        }
        Update: {
          auto_approve_applications?: boolean
          cookie_duration_days?: number
          customer_discount_percent?: number
          default_commission_percent?: number
          enable_affiliate_commission?: boolean
          enable_customer_discount?: boolean
          id?: number
          is_enabled?: boolean
          minimum_withdrawal?: number
          terms_and_conditions?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      affiliate_withdrawals: {
        Row: {
          account_name: string | null
          account_number: string
          admin_notes: string | null
          affiliate_id: string
          amount: number
          id: string
          method: string
          processed_at: string | null
          processed_by: string | null
          requested_at: string
          status: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          account_name?: string | null
          account_number: string
          admin_notes?: string | null
          affiliate_id: string
          amount: number
          id?: string
          method: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          account_name?: string | null
          account_number?: string
          admin_notes?: string | null
          affiliate_id?: string
          amount?: number
          id?: string
          method?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_withdrawals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          author_email: string | null
          author_name: string
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          status: string
          user_id: string | null
        }
        Insert: {
          author_email?: string | null
          author_name: string
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          status?: string
          user_id?: string | null
        }
        Update: {
          author_email?: string | null
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_comments_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_avatar: string | null
          author_bio: string | null
          author_name: string | null
          category_id: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          is_featured: boolean | null
          published_at: string | null
          reading_time: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          views: number | null
        }
        Insert: {
          author_avatar?: string | null
          author_bio?: string | null
          author_name?: string | null
          category_id?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_featured?: boolean | null
          published_at?: string | null
          reading_time?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          views?: number | null
        }
        Update: {
          author_avatar?: string | null
          author_bio?: string | null
          author_name?: string | null
          category_id?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_featured?: boolean | null
          published_at?: string | null
          reading_time?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          ai_response: string
          created_at: string
          id: string
          page_url: string | null
          session_id: string
          user_agent: string | null
          user_message: string
        }
        Insert: {
          ai_response: string
          created_at?: string
          id?: string
          page_url?: string | null
          session_id: string
          user_agent?: string | null
          user_message: string
        }
        Update: {
          ai_response?: string
          created_at?: string
          id?: string
          page_url?: string | null
          session_id?: string
          user_agent?: string | null
          user_message?: string
        }
        Relationships: []
      }
      cid_balance_adjustments: {
        Row: {
          adjusted_by: string | null
          balance_after: number
          created_at: string
          delta: number
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          adjusted_by?: string | null
          balance_after: number
          created_at?: string
          delta: number
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          adjusted_by?: string | null
          balance_after?: number
          created_at?: string
          delta?: number
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cid_balances: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_added: number
          total_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_added?: number
          total_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_added?: number
          total_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cid_generations: {
        Row: {
          cost: number
          created_at: string
          id: string
          number: string | null
          operator: string
          operator_name: string | null
          provider: string | null
          result: Json | null
          status: string
          user_id: string
        }
        Insert: {
          cost?: number
          created_at?: string
          id?: string
          number?: string | null
          operator: string
          operator_name?: string | null
          provider?: string | null
          result?: Json | null
          status?: string
          user_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          id?: string
          number?: string | null
          operator?: string
          operator_name?: string | null
          provider?: string | null
          result?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      cid_product_credits: {
        Row: {
          cid_credits: number
          created_at: string
          id: string
          is_active: boolean
          product_id: string
          updated_at: string
        }
        Insert: {
          cid_credits?: number
          created_at?: string
          id?: string
          is_active?: boolean
          product_id: string
          updated_at?: string
        }
        Update: {
          cid_credits?: number
          created_at?: string
          id?: string
          is_active?: boolean
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cid_product_credits_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_amount: number | null
          updated_at: string
          uses_count: number | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          updated_at?: string
          uses_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          updated_at?: string
          uses_count?: number | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      global_attribute_values: {
        Row: {
          attribute_id: string
          color_code: string | null
          created_at: string
          description: string | null
          id: string
          slug: string
          sort_order: number
          updated_at: string
          value: string
        }
        Insert: {
          attribute_id: string
          color_code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          slug: string
          sort_order?: number
          updated_at?: string
          value: string
        }
        Update: {
          attribute_id?: string
          color_code?: string | null
          created_at?: string
          description?: string | null
          id?: string
          slug?: string
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "global_attribute_values_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "global_attributes"
            referencedColumns: ["id"]
          },
        ]
      }
      global_attributes: {
        Row: {
          created_at: string
          has_archives: boolean
          id: string
          name: string
          order_by: string
          slug: string
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          has_archives?: boolean
          id?: string
          name: string
          order_by?: string
          slug: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          has_archives?: boolean
          id?: string
          name?: string
          order_by?: string
          slug?: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      help_articles: {
        Row: {
          category: string
          content: string | null
          created_at: string
          excerpt: string | null
          helpful_no: number | null
          helpful_yes: number | null
          id: string
          is_featured: boolean | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          views: number | null
        }
        Insert: {
          category?: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          helpful_no?: number | null
          helpful_yes?: number | null
          id?: string
          is_featured?: boolean | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          views?: number | null
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          helpful_no?: number | null
          helpful_yes?: number | null
          id?: string
          is_featured?: boolean | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          views?: number | null
        }
        Relationships: []
      }
      key_check_history: {
        Row: {
          act_type: string | null
          created_at: string
          error_code: string | null
          id: string
          key_value: string
          product: string | null
          remaining: string | null
          status: string
          sub_type: string | null
          user_id: string
        }
        Insert: {
          act_type?: string | null
          created_at?: string
          error_code?: string | null
          id?: string
          key_value: string
          product?: string | null
          remaining?: string | null
          status: string
          sub_type?: string | null
          user_id: string
        }
        Update: {
          act_type?: string | null
          created_at?: string
          error_code?: string | null
          id?: string
          key_value?: string
          product?: string | null
          remaining?: string | null
          status?: string
          sub_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      license_keys: {
        Row: {
          assigned_at: string | null
          created_at: string
          delivered_to_phone: string | null
          delivery_batch_id: string | null
          extra_info: string | null
          id: string
          key_type: string
          key_value: string
          order_item_id: string | null
          product_id: string | null
          status: string
        }
        Insert: {
          assigned_at?: string | null
          created_at?: string
          delivered_to_phone?: string | null
          delivery_batch_id?: string | null
          extra_info?: string | null
          id?: string
          key_type?: string
          key_value: string
          order_item_id?: string | null
          product_id?: string | null
          status?: string
        }
        Update: {
          assigned_at?: string | null
          created_at?: string
          delivered_to_phone?: string | null
          delivery_batch_id?: string | null
          extra_info?: string | null
          id?: string
          key_type?: string
          key_value?: string
          order_item_id?: string | null
          product_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_keys_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_keys_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          name: string | null
          source: string | null
          status: string
          subscribed_at: string
          updated_at: string
        }
        Insert: {
          email: string
          id?: string
          name?: string | null
          source?: string | null
          status?: string
          subscribed_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          id?: string
          name?: string | null
          source?: string | null
          status?: string
          subscribed_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      office365_check_history: {
        Row: {
          checked_at: string
          id: string
          status_acc: string
          user_id: string
          username: string
        }
        Insert: {
          checked_at?: string
          id?: string
          status_acc: string
          user_id: string
          username: string
        }
        Update: {
          checked_at?: string
          id?: string
          status_acc?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          custom_field_values: Json | null
          id: string
          license_key: string | null
          order_id: string
          price: number
          product_id: string | null
          product_name: string
          quantity: number
          total: number
        }
        Insert: {
          created_at?: string
          custom_field_values?: Json | null
          id?: string
          license_key?: string | null
          order_id: string
          price: number
          product_id?: string | null
          product_name: string
          quantity?: number
          total: number
        }
        Update: {
          created_at?: string
          custom_field_values?: Json | null
          id?: string
          license_key?: string | null
          order_id?: string
          price?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_timeline: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          order_id: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          order_id: string
          status: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_timeline_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_notes: string | null
          affiliate_discount_amount: number | null
          affiliate_referral_code: string | null
          coupon_code: string | null
          coupon_id: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          discount_amount: number | null
          id: string
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_status: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          transaction_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          affiliate_discount_amount?: number | null
          affiliate_referral_code?: string | null
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_number: string
          payment_method?: string | null
          payment_status?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          transaction_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          affiliate_discount_amount?: number | null
          affiliate_referral_code?: string | null
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          transaction_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_logs: {
        Row: {
          channel: string | null
          created_at: string
          created_by: string | null
          event_type: string
          id: string
          message: string | null
          occurred_at: string
          prospect_id: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          channel?: string | null
          created_at?: string
          created_by?: string | null
          event_type?: string
          id?: string
          message?: string | null
          occurred_at?: string
          prospect_id: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          channel?: string | null
          created_at?: string
          created_by?: string | null
          event_type?: string
          id?: string
          message?: string | null
          occurred_at?: string
          prospect_id?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_logs_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "outreach_prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_prospects: {
        Row: {
          category: string | null
          contact_channel: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string
          domain_authority: number | null
          follow_up_at: string | null
          id: string
          last_contacted_at: string | null
          notes: string | null
          pitch_template: string | null
          published_url: string | null
          site_name: string
          site_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          contact_channel?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          domain_authority?: number | null
          follow_up_at?: string | null
          id?: string
          last_contacted_at?: string | null
          notes?: string | null
          pitch_template?: string | null
          published_url?: string | null
          site_name: string
          site_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          contact_channel?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          domain_authority?: number | null
          follow_up_at?: string | null
          id?: string
          last_contacted_at?: string | null
          notes?: string | null
          pitch_template?: string | null
          published_url?: string | null
          site_name?: string
          site_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_proofs: {
        Row: {
          admin_notes: string | null
          amount: number | null
          id: string
          order_id: string
          payment_method: string
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_url: string | null
          status: string
          submitted_at: string
          transaction_id: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount?: number | null
          id?: string
          order_id: string
          payment_method?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          status?: string
          submitted_at?: string
          transaction_id: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number | null
          id?: string
          order_id?: string
          payment_method?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          status?: string
          submitted_at?: string
          transaction_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_licenses: {
        Row: {
          category: string | null
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          delivered_at: string | null
          expires_at: string | null
          id: string
          key_value: string | null
          name: string
          note: string | null
          password: string | null
          password_type: string | null
          status: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          expires_at?: string | null
          id?: string
          key_value?: string | null
          name: string
          note?: string | null
          password?: string | null
          password_type?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          expires_at?: string | null
          id?: string
          key_value?: string | null
          name?: string
          note?: string | null
          password?: string | null
          password_type?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          balance_after: number
          created_at: string
          id: string
          note: string | null
          points: number
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          balance_after?: number
          created_at?: string
          id?: string
          note?: string | null
          points: number
          reference_id?: string | null
          type?: string
          user_id: string
        }
        Update: {
          balance_after?: number
          created_at?: string
          id?: string
          note?: string | null
          points?: number
          reference_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      product_attribute_assignments: {
        Row: {
          attribute_id: string | null
          attribute_type: string
          created_at: string
          custom_name: string | null
          id: string
          is_visible: boolean
          product_id: string
          selected_values: Json
          sort_order: number
          updated_at: string
          use_in_variation: boolean
        }
        Insert: {
          attribute_id?: string | null
          attribute_type?: string
          created_at?: string
          custom_name?: string | null
          id?: string
          is_visible?: boolean
          product_id: string
          selected_values?: Json
          sort_order?: number
          updated_at?: string
          use_in_variation?: boolean
        }
        Update: {
          attribute_id?: string | null
          attribute_type?: string
          created_at?: string
          custom_name?: string | null
          id?: string
          is_visible?: boolean
          product_id?: string
          selected_values?: Json
          sort_order?: number
          updated_at?: string
          use_in_variation?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "product_attribute_assignments_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "global_attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_attribute_assignments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          category_id: string
          created_at: string
          product_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          product_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_groups: {
        Row: {
          created_at: string
          display_type: string
          id: string
          is_required: boolean
          name: string
          product_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_type?: string
          id?: string
          is_required?: boolean
          name: string
          product_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_type?: string
          id?: string
          is_required?: boolean
          name?: string
          product_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_option_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_values: {
        Row: {
          created_at: string
          group_id: string
          id: string
          is_default: boolean
          label: string
          price_adjustment: number
          product_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          is_default?: boolean
          label: string
          price_adjustment?: number
          product_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          is_default?: boolean
          label?: string
          price_adjustment?: number
          product_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_option_values_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "product_option_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_option_values_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          author_email: string | null
          author_name: string
          body: string
          created_at: string
          helpful_count: number
          id: string
          is_verified: boolean
          product_id: string | null
          product_slug: string
          rating: number
          status: string
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          author_email?: string | null
          author_name: string
          body: string
          created_at?: string
          helpful_count?: number
          id?: string
          is_verified?: boolean
          product_id?: string | null
          product_slug: string
          rating: number
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          author_email?: string | null
          author_name?: string
          body?: string
          created_at?: string
          helpful_count?: number
          id?: string
          is_verified?: boolean
          product_id?: string | null
          product_slug?: string
          rating?: number
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          attributes: Json | null
          badge: string | null
          brand: string | null
          category_id: string | null
          cost_price: number | null
          created_at: string
          custom_fields: Json | null
          delivery_time: string | null
          delivery_type: string | null
          demo_url: string | null
          description: string | null
          discount_percent: number | null
          download_link: string | null
          faq: Json | null
          id: string
          image_url: string | null
          images: string[] | null
          is_digital: boolean | null
          is_featured: boolean | null
          name: string
          original_price: number | null
          price: number
          product_type: string | null
          refund_note: string | null
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          sku: string | null
          slug: string
          sort_order: number | null
          status: Database["public"]["Enums"]["product_status"]
          stock_quantity: number | null
          subcategory_id: string | null
          tags: string[] | null
          total_sales: number | null
          total_views: number | null
          updated_at: string
          variants: Json | null
          video_url: string | null
          warranty_note: string | null
          what_you_get: string[] | null
        }
        Insert: {
          attributes?: Json | null
          badge?: string | null
          brand?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          custom_fields?: Json | null
          delivery_time?: string | null
          delivery_type?: string | null
          demo_url?: string | null
          description?: string | null
          discount_percent?: number | null
          download_link?: string | null
          faq?: Json | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_digital?: boolean | null
          is_featured?: boolean | null
          name: string
          original_price?: number | null
          price?: number
          product_type?: string | null
          refund_note?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          sku?: string | null
          slug: string
          sort_order?: number | null
          status?: Database["public"]["Enums"]["product_status"]
          stock_quantity?: number | null
          subcategory_id?: string | null
          tags?: string[] | null
          total_sales?: number | null
          total_views?: number | null
          updated_at?: string
          variants?: Json | null
          video_url?: string | null
          warranty_note?: string | null
          what_you_get?: string[] | null
        }
        Update: {
          attributes?: Json | null
          badge?: string | null
          brand?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          custom_fields?: Json | null
          delivery_time?: string | null
          delivery_type?: string | null
          demo_url?: string | null
          description?: string | null
          discount_percent?: number | null
          download_link?: string | null
          faq?: Json | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_digital?: boolean | null
          is_featured?: boolean | null
          name?: string
          original_price?: number | null
          price?: number
          product_type?: string | null
          refund_note?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          sku?: string | null
          slug?: string
          sort_order?: number | null
          status?: Database["public"]["Enums"]["product_status"]
          stock_quantity?: number | null
          subcategory_id?: string | null
          tags?: string[] | null
          total_sales?: number | null
          total_views?: number | null
          updated_at?: string
          variants?: Json | null
          video_url?: string | null
          warranty_note?: string | null
          what_you_get?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          is_suspended: boolean
          phone: string | null
          points_balance: number
          referral_code: string | null
          referral_credit: number
          referral_credit_balance: number
          referral_discount: number
          referral_earnings: number
          referred_by: string | null
          signup_ip: string | null
          suspended_at: string | null
          suspended_reason: string | null
          total_points_earned: number
          total_points_redeemed: number
          updated_at: string
          user_id: string
          username: string | null
          wallet_balance: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_suspended?: boolean
          phone?: string | null
          points_balance?: number
          referral_code?: string | null
          referral_credit?: number
          referral_credit_balance?: number
          referral_discount?: number
          referral_earnings?: number
          referred_by?: string | null
          signup_ip?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          total_points_earned?: number
          total_points_redeemed?: number
          updated_at?: string
          user_id: string
          username?: string | null
          wallet_balance?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_suspended?: boolean
          phone?: string | null
          points_balance?: number
          referral_code?: string | null
          referral_credit?: number
          referral_credit_balance?: number
          referral_discount?: number
          referral_earnings?: number
          referred_by?: string | null
          signup_ip?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          total_points_earned?: number
          total_points_redeemed?: number
          updated_at?: string
          user_id?: string
          username?: string | null
          wallet_balance?: number
        }
        Relationships: []
      }
      recently_viewed: {
        Row: {
          id: string
          product_id: string
          product_image: string | null
          product_name: string
          product_price: number
          product_slug: string | null
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          product_id: string
          product_image?: string | null
          product_name: string
          product_price: number
          product_slug?: string | null
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          product_image?: string | null
          product_name?: string
          product_price?: number
          product_slug?: string | null
          user_id?: string
          viewed_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referred_id: string | null
          referrer_id: string
          reward_amount: number
          reward_paid: boolean
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          referred_id?: string | null
          referrer_id: string
          reward_amount?: number
          reward_paid?: boolean
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string | null
          referrer_id?: string
          reward_amount?: number
          reward_paid?: boolean
          status?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          category: string | null
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          category?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          category?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      software_downloads: {
        Row: {
          created_at: string
          description: string | null
          download_url: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          download_url: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          download_url?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      support_replies: {
        Row: {
          author_id: string | null
          author_name: string
          created_at: string
          id: string
          is_admin: boolean
          message: string
          ticket_id: string
        }
        Insert: {
          author_id?: string | null
          author_name: string
          created_at?: string
          id?: string
          is_admin?: boolean
          message: string
          ticket_id: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          created_at?: string
          id?: string
          is_admin?: boolean
          message?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          id: string
          message: string
          order_number: string | null
          priority: string
          status: string
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          message: string
          order_number?: string | null
          priority?: string
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          message?: string
          order_number?: string | null
          priority?: string
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      telegram_bot_state: {
        Row: {
          id: number
          update_offset: number
          updated_at: string
        }
        Insert: {
          id: number
          update_offset?: number
          updated_at?: string
        }
        Update: {
          id?: number
          update_offset?: number
          updated_at?: string
        }
        Relationships: []
      }
      telegram_cart: {
        Row: {
          chat_id: string
          created_at: string
          id: string
          price: number
          product_id: string | null
          product_name: string
          product_slug: string
          quantity: number
        }
        Insert: {
          chat_id: string
          created_at?: string
          id?: string
          price?: number
          product_id?: string | null
          product_name: string
          product_slug: string
          quantity?: number
        }
        Update: {
          chat_id?: string
          created_at?: string
          id?: string
          price?: number
          product_id?: string | null
          product_name?: string
          product_slug?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "telegram_cart_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_checkout_state: {
        Row: {
          chat_id: string
          collected_data: Json
          created_at: string
          id: string
          step: string
          updated_at: string
        }
        Insert: {
          chat_id: string
          collected_data?: Json
          created_at?: string
          id?: string
          step?: string
          updated_at?: string
        }
        Update: {
          chat_id?: string
          collected_data?: Json
          created_at?: string
          id?: string
          step?: string
          updated_at?: string
        }
        Relationships: []
      }
      telegram_checkout_tokens: {
        Row: {
          cart_data: Json
          chat_id: string
          created_at: string
          expires_at: string
          id: string
          is_used: boolean
          token: string
        }
        Insert: {
          cart_data?: Json
          chat_id: string
          created_at?: string
          expires_at?: string
          id?: string
          is_used?: boolean
          token: string
        }
        Update: {
          cart_data?: Json
          chat_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_used?: boolean
          token?: string
        }
        Relationships: []
      }
      telegram_order_messages: {
        Row: {
          created_at: string
          id: string
          order_id: string
          order_number: string
          telegram_chat_id: string
          telegram_message_id: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          order_number: string
          telegram_chat_id: string
          telegram_message_id: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          order_number?: string
          telegram_chat_id?: string
          telegram_message_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "telegram_order_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_user_prefs: {
        Row: {
          chat_id: string
          created_at: string
          language: string
          updated_at: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          language?: string
          updated_at?: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          language?: string
          updated_at?: string
        }
        Relationships: []
      }
      text_overrides: {
        Row: {
          category: string
          created_at: string
          default_value: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          category?: string
          created_at?: string
          default_value?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          category?: string
          created_at?: string
          default_value?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_topup_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          payment_method: string
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_url: string | null
          status: string
          transaction_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          payment_method?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          status?: string
          transaction_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          payment_method?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          status?: string
          transaction_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          reference_id?: string | null
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          reference_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      welcome_coupons: {
        Row: {
          code: string
          created_at: string
          discount_amount: number
          discount_percent: number
          discount_type: string
          expires_at: string
          id: string
          is_used: boolean
          prize_label: string | null
          used_by_order_id: string | null
          visitor_id: string
        }
        Insert: {
          code: string
          created_at?: string
          discount_amount?: number
          discount_percent: number
          discount_type?: string
          expires_at: string
          id?: string
          is_used?: boolean
          prize_label?: string | null
          used_by_order_id?: string | null
          visitor_id: string
        }
        Update: {
          code?: string
          created_at?: string
          discount_amount?: number
          discount_percent?: number
          discount_type?: string
          expires_at?: string
          id?: string
          is_used?: boolean
          prize_label?: string | null
          used_by_order_id?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "welcome_coupons_used_by_order_id_fkey"
            columns: ["used_by_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          product_image: string | null
          product_name: string
          product_price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          product_image?: string | null
          product_name: string
          product_price: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          product_image?: string | null
          product_name?: string
          product_price?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      blog_comments_public: {
        Row: {
          author_name: string | null
          content: string | null
          created_at: string | null
          id: string | null
          parent_id: string | null
          post_id: string | null
          status: string | null
        }
        Insert: {
          author_name?: string | null
          content?: string | null
          created_at?: string | null
          id?: string | null
          parent_id?: string | null
          post_id?: string | null
          status?: string | null
        }
        Update: {
          author_name?: string | null
          content?: string | null
          created_at?: string | null
          id?: string | null
          parent_id?: string | null
          post_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_comments_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_adjust_cid_balance: {
        Args: { p_delta: number; p_note?: string; p_user_id: string }
        Returns: Json
      }
      admin_find_user_for_cid: {
        Args: { p_query: string }
        Returns: {
          balance: number
          display_name: string
          email: string
          phone: string
          total_added: number
          total_used: number
          user_id: string
        }[]
      }
      approve_affiliate_conversion: {
        Args: { p_conversion_id: string }
        Returns: Json
      }
      auto_assign_licenses: { Args: { p_order_id: string }; Returns: Json }
      debit_cid_balance: {
        Args: { p_amount: number; p_user_id: string }
        Returns: Json
      }
      deduct_order_points: {
        Args: { p_order_id: string; p_order_total: number; p_user_id: string }
        Returns: Json
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      earn_order_points: {
        Args: { p_order_id: string; p_order_total: number; p_user_id: string }
        Returns: Json
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_affiliate_code: { Args: never; Returns: string }
      get_referral_tier: { Args: { referral_count: number }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_username_available: {
        Args: { p_user_id?: string; p_username: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      process_affiliate_withdrawal: {
        Args: {
          p_action: string
          p_admin_notes?: string
          p_transaction_id?: string
          p_withdrawal_id: string
        }
        Returns: Json
      }
      process_google_referral:
        | {
            Args: { p_referral_code: string; p_referred_user_id: string }
            Returns: Json
          }
        | {
            Args: {
              p_ip?: string
              p_referral_code: string
              p_referred_user_id: string
            }
            Returns: Json
          }
      process_referral:
        | {
            Args: { p_referral_code: string; p_referred_user_id: string }
            Returns: Json
          }
        | {
            Args: {
              p_ip?: string
              p_referral_code: string
              p_referred_user_id: string
            }
            Returns: Json
          }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      record_affiliate_conversion: {
        Args: { p_order_id: string; p_referral_code: string }
        Returns: Json
      }
      redeem_points: {
        Args: { p_points: number; p_user_id: string }
        Returns: Json
      }
      redeem_referral_credit: {
        Args: {
          p_amount: number
          p_order_id?: string
          p_order_subtotal: number
          p_user_id: string
        }
        Returns: Json
      }
      reject_affiliate_conversion: {
        Args: { p_conversion_id: string; p_reason?: string }
        Returns: Json
      }
      wallet_credit: {
        Args: {
          p_amount: number
          p_created_by?: string
          p_note?: string
          p_reference_id?: string
          p_user_id: string
        }
        Returns: Json
      }
      wallet_debit: {
        Args: {
          p_amount: number
          p_created_by?: string
          p_note?: string
          p_reference_id?: string
          p_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "user" | "reseller"
      order_status:
        | "pending"
        | "processing"
        | "completed"
        | "cancelled"
        | "refunded"
        | "delivered"
        | "failed"
      product_status: "active" | "draft" | "out_of_stock"
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
      app_role: ["admin", "manager", "user", "reseller"],
      order_status: [
        "pending",
        "processing",
        "completed",
        "cancelled",
        "refunded",
        "delivered",
        "failed",
      ],
      product_status: ["active", "draft", "out_of_stock"],
    },
  },
} as const
