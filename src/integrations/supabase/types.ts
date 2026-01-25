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
      admin_announcements: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          message: string
          show_popup: boolean
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message: string
          show_popup?: boolean
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message?: string
          show_popup?: boolean
          title?: string
          type?: string
        }
        Relationships: []
      }
      admin_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      affiliate_commissions: {
        Row: {
          affiliate_matricula: number
          amount: number
          created_at: string
          id: string
          invited_matricula: number
          released_at: string | null
          status: string
        }
        Insert: {
          affiliate_matricula: number
          amount?: number
          created_at?: string
          id?: string
          invited_matricula: number
          released_at?: string | null
          status?: string
        }
        Update: {
          affiliate_matricula?: number
          amount?: number
          created_at?: string
          id?: string
          invited_matricula?: number
          released_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_matricula_fkey"
            columns: ["affiliate_matricula"]
            isOneToOne: false
            referencedRelation: "users_admin_view"
            referencedColumns: ["matricula"]
          },
          {
            foreignKeyName: "affiliate_commissions_affiliate_matricula_fkey"
            columns: ["affiliate_matricula"]
            isOneToOne: false
            referencedRelation: "users_matricula"
            referencedColumns: ["matricula"]
          },
          {
            foreignKeyName: "affiliate_commissions_invited_matricula_fkey"
            columns: ["invited_matricula"]
            isOneToOne: true
            referencedRelation: "users_admin_view"
            referencedColumns: ["matricula"]
          },
          {
            foreignKeyName: "affiliate_commissions_invited_matricula_fkey"
            columns: ["invited_matricula"]
            isOneToOne: true
            referencedRelation: "users_matricula"
            referencedColumns: ["matricula"]
          },
        ]
      }
      affiliate_invites: {
        Row: {
          created_at: string
          id: string
          invited_matricula: number
          inviter_matricula: number
          reviewed_at: string | null
          reviewed_by_admin: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_matricula: number
          inviter_matricula: number
          reviewed_at?: string | null
          reviewed_by_admin?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_matricula?: number
          inviter_matricula?: number
          reviewed_at?: string | null
          reviewed_by_admin?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_invites_invited_matricula_fkey"
            columns: ["invited_matricula"]
            isOneToOne: true
            referencedRelation: "users_admin_view"
            referencedColumns: ["matricula"]
          },
          {
            foreignKeyName: "affiliate_invites_invited_matricula_fkey"
            columns: ["invited_matricula"]
            isOneToOne: true
            referencedRelation: "users_matricula"
            referencedColumns: ["matricula"]
          },
          {
            foreignKeyName: "affiliate_invites_inviter_matricula_fkey"
            columns: ["inviter_matricula"]
            isOneToOne: false
            referencedRelation: "users_admin_view"
            referencedColumns: ["matricula"]
          },
          {
            foreignKeyName: "affiliate_invites_inviter_matricula_fkey"
            columns: ["inviter_matricula"]
            isOneToOne: false
            referencedRelation: "users_matricula"
            referencedColumns: ["matricula"]
          },
        ]
      }
      affiliate_withdrawals: {
        Row: {
          affiliate_matricula: number
          amount: number
          created_at: string
          id: string
          notes: string | null
          pix_key: string | null
          pix_key_type: string | null
          processed_at: string | null
          processed_by: string | null
          requested_at: string
          status: string
        }
        Insert: {
          affiliate_matricula: number
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: string
        }
        Update: {
          affiliate_matricula?: number
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: string
        }
        Relationships: []
      }
      agenda_items: {
        Row: {
          concluido: boolean | null
          created_at: string
          data: string
          descricao: string | null
          hora: string
          id: string
          notificacao_minutos: number | null
          tipo: string
          titulo: string
          updated_at: string
          user_matricula: number
        }
        Insert: {
          concluido?: boolean | null
          created_at?: string
          data: string
          descricao?: string | null
          hora: string
          id?: string
          notificacao_minutos?: number | null
          tipo?: string
          titulo: string
          updated_at?: string
          user_matricula: number
        }
        Update: {
          concluido?: boolean | null
          created_at?: string
          data?: string
          descricao?: string | null
          hora?: string
          id?: string
          notificacao_minutos?: number | null
          tipo?: string
          titulo?: string
          updated_at?: string
          user_matricula?: number
        }
        Relationships: []
      }
      announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          read_at: string
          user_matricula: number
        }
        Insert: {
          announcement_id: string
          id?: string
          read_at?: string
          user_matricula: number
        }
        Update: {
          announcement_id?: string
          id?: string
          read_at?: string
          user_matricula?: number
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "admin_announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          type: string
          user_matricula: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          type: string
          user_matricula: number
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          type?: string
          user_matricula?: number
        }
        Relationships: []
      }
      discount_coupons: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          times_used: number
          usage_limit: number | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          times_used?: number
          usage_limit?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          times_used?: number
          usage_limit?: number | null
        }
        Relationships: []
      }
      elevenlabs_usage: {
        Row: {
          created_at: string
          id: string
          month_year: string
          tokens_used: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          month_year: string
          tokens_used?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          month_year?: string
          tokens_used?: number
          updated_at?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          current_amount: number | null
          deadline: string | null
          id: string
          is_active: boolean | null
          name: string
          target_amount: number
          updated_at: string
          user_matricula: number
        }
        Insert: {
          created_at?: string
          current_amount?: number | null
          deadline?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          target_amount: number
          updated_at?: string
          user_matricula: number
        }
        Update: {
          created_at?: string
          current_amount?: number | null
          deadline?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          target_amount?: number
          updated_at?: string
          user_matricula?: number
        }
        Relationships: []
      }
      live_chat_messages: {
        Row: {
          created_at: string
          id: string
          is_ai: boolean | null
          message: string
          sender_id: string | null
          sender_type: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_ai?: boolean | null
          message: string
          sender_id?: string | null
          sender_type?: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_ai?: boolean | null
          message?: string
          sender_id?: string | null
          sender_type?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_chat_sessions: {
        Row: {
          admin_id: string | null
          created_at: string
          ended_at: string | null
          id: string
          status: string
          updated_at: string
          user_matricula: number
          user_name: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_matricula: number
          user_name?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_matricula?: number
          user_name?: string | null
        }
        Relationships: []
      }
      payment_logs: {
        Row: {
          amount: number
          created_at: string
          id: string
          name: string
          paid_at: string
          payment_type: string
          scheduled_payment_id: string | null
          user_matricula: number
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          name: string
          paid_at?: string
          payment_type?: string
          scheduled_payment_id?: string | null
          user_matricula: number
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          name?: string
          paid_at?: string
          payment_type?: string
          scheduled_payment_id?: string | null
          user_matricula?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_logs_scheduled_payment_id_fkey"
            columns: ["scheduled_payment_id"]
            isOneToOne: false
            referencedRelation: "scheduled_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          activate_affiliate_mode: boolean | null
          admin_affiliate_link_code: string | null
          advance_amount: number | null
          advance_day: number | null
          affiliate_code: number | null
          amount: number
          cpf: string | null
          created_at: string
          credit_due_day: number | null
          credit_limit: number | null
          current_credit_used: number | null
          email: string | null
          full_name: string
          has_credit_card: boolean | null
          id: string
          initial_balance: number | null
          matricula: number | null
          mp_payment_id: string | null
          mp_preference_id: string | null
          payment_provider: string
          payment_status: string
          phone: string | null
          salary_amount: number | null
          salary_day: number | null
          updated_at: string
          user_temp_id: string
        }
        Insert: {
          activate_affiliate_mode?: boolean | null
          admin_affiliate_link_code?: string | null
          advance_amount?: number | null
          advance_day?: number | null
          affiliate_code?: number | null
          amount: number
          cpf?: string | null
          created_at?: string
          credit_due_day?: number | null
          credit_limit?: number | null
          current_credit_used?: number | null
          email?: string | null
          full_name: string
          has_credit_card?: boolean | null
          id?: string
          initial_balance?: number | null
          matricula?: number | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          payment_provider?: string
          payment_status?: string
          phone?: string | null
          salary_amount?: number | null
          salary_day?: number | null
          updated_at?: string
          user_temp_id: string
        }
        Update: {
          activate_affiliate_mode?: boolean | null
          admin_affiliate_link_code?: string | null
          advance_amount?: number | null
          advance_day?: number | null
          affiliate_code?: number | null
          amount?: number
          cpf?: string | null
          created_at?: string
          credit_due_day?: number | null
          credit_limit?: number | null
          current_credit_used?: number | null
          email?: string | null
          full_name?: string
          has_credit_card?: boolean | null
          id?: string
          initial_balance?: number | null
          matricula?: number | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          payment_provider?: string
          payment_status?: string
          phone?: string | null
          salary_amount?: number | null
          salary_day?: number | null
          updated_at?: string
          user_temp_id?: string
        }
        Relationships: []
      }
      rotina_analytics: {
        Row: {
          best_hour: string | null
          completed_count: number | null
          completion_rate: number | null
          created_at: string
          horarios_ideais: string[] | null
          horarios_livres: string[] | null
          horarios_sobrecarregados: string[] | null
          horas_concluidas: number | null
          horas_nao_cumpridas: number | null
          horas_planejadas: number | null
          id: string
          in_progress_count: number | null
          indice_empenho: number | null
          indice_foco: number | null
          melhor_horario: string | null
          not_done_count: number | null
          period_end: string
          period_start: string
          pior_horario: string | null
          streak_days: number | null
          total_rotinas: number | null
          updated_at: string
          user_matricula: number
          worst_hour: string | null
        }
        Insert: {
          best_hour?: string | null
          completed_count?: number | null
          completion_rate?: number | null
          created_at?: string
          horarios_ideais?: string[] | null
          horarios_livres?: string[] | null
          horarios_sobrecarregados?: string[] | null
          horas_concluidas?: number | null
          horas_nao_cumpridas?: number | null
          horas_planejadas?: number | null
          id?: string
          in_progress_count?: number | null
          indice_empenho?: number | null
          indice_foco?: number | null
          melhor_horario?: string | null
          not_done_count?: number | null
          period_end: string
          period_start: string
          pior_horario?: string | null
          streak_days?: number | null
          total_rotinas?: number | null
          updated_at?: string
          user_matricula: number
          worst_hour?: string | null
        }
        Update: {
          best_hour?: string | null
          completed_count?: number | null
          completion_rate?: number | null
          created_at?: string
          horarios_ideais?: string[] | null
          horarios_livres?: string[] | null
          horarios_sobrecarregados?: string[] | null
          horas_concluidas?: number | null
          horas_nao_cumpridas?: number | null
          horas_planejadas?: number | null
          id?: string
          in_progress_count?: number | null
          indice_empenho?: number | null
          indice_foco?: number | null
          melhor_horario?: string | null
          not_done_count?: number | null
          period_end?: string
          period_start?: string
          pior_horario?: string | null
          streak_days?: number | null
          total_rotinas?: number | null
          updated_at?: string
          user_matricula?: number
          worst_hour?: string | null
        }
        Relationships: []
      }
      rotina_completions: {
        Row: {
          created_at: string
          data_conclusao: string
          id: string
          rotina_id: string
          user_matricula: number
        }
        Insert: {
          created_at?: string
          data_conclusao: string
          id?: string
          rotina_id: string
          user_matricula: number
        }
        Update: {
          created_at?: string
          data_conclusao?: string
          id?: string
          rotina_id?: string
          user_matricula?: number
        }
        Relationships: [
          {
            foreignKeyName: "rotina_completions_rotina_id_fkey"
            columns: ["rotina_id"]
            isOneToOne: false
            referencedRelation: "rotinas"
            referencedColumns: ["id"]
          },
        ]
      }
      rotina_executions: {
        Row: {
          ai_tip_shown: boolean | null
          ai_tip_text: string | null
          atraso_minutos: number | null
          auto_marked: boolean | null
          categoria: string | null
          completed_at: string | null
          created_at: string
          data: string
          hora_fim_planejada: string | null
          hora_real_fim: string | null
          hora_real_inicio: string | null
          id: string
          prioridade: string | null
          rotina_id: string
          scheduled_time: string
          started_at: string | null
          status: string
          tempo_executado_minutos: number | null
          tempo_planejado_minutos: number | null
          updated_at: string
          user_matricula: number
        }
        Insert: {
          ai_tip_shown?: boolean | null
          ai_tip_text?: string | null
          atraso_minutos?: number | null
          auto_marked?: boolean | null
          categoria?: string | null
          completed_at?: string | null
          created_at?: string
          data: string
          hora_fim_planejada?: string | null
          hora_real_fim?: string | null
          hora_real_inicio?: string | null
          id?: string
          prioridade?: string | null
          rotina_id: string
          scheduled_time: string
          started_at?: string | null
          status?: string
          tempo_executado_minutos?: number | null
          tempo_planejado_minutos?: number | null
          updated_at?: string
          user_matricula: number
        }
        Update: {
          ai_tip_shown?: boolean | null
          ai_tip_text?: string | null
          atraso_minutos?: number | null
          auto_marked?: boolean | null
          categoria?: string | null
          completed_at?: string | null
          created_at?: string
          data?: string
          hora_fim_planejada?: string | null
          hora_real_fim?: string | null
          hora_real_inicio?: string | null
          id?: string
          prioridade?: string | null
          rotina_id?: string
          scheduled_time?: string
          started_at?: string | null
          status?: string
          tempo_executado_minutos?: number | null
          tempo_planejado_minutos?: number | null
          updated_at?: string
          user_matricula?: number
        }
        Relationships: [
          {
            foreignKeyName: "rotina_executions_rotina_id_fkey"
            columns: ["rotina_id"]
            isOneToOne: false
            referencedRelation: "rotinas"
            referencedColumns: ["id"]
          },
        ]
      }
      rotinas: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          created_at: string
          descricao: string | null
          dias_semana: string[]
          hora: string
          hora_fim: string | null
          id: string
          notificacao_minutos: number | null
          prioridade: string | null
          titulo: string
          updated_at: string
          user_matricula: number
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          dias_semana?: string[]
          hora: string
          hora_fim?: string | null
          id?: string
          notificacao_minutos?: number | null
          prioridade?: string | null
          titulo: string
          updated_at?: string
          user_matricula: number
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string
          descricao?: string | null
          dias_semana?: string[]
          hora?: string
          hora_fim?: string | null
          id?: string
          notificacao_minutos?: number | null
          prioridade?: string | null
          titulo?: string
          updated_at?: string
          user_matricula?: number
        }
        Relationships: []
      }
      rotinas_transporte: {
        Row: {
          ativo: boolean | null
          created_at: string
          endereco_casa: string
          endereco_trabalho: string
          horario_trabalho: string
          id: string
          linha_onibus: string | null
          modo_transporte: string | null
          tempo_ate_ponto: number | null
          ultima_verificacao: string | null
          updated_at: string
          user_matricula: number
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          endereco_casa: string
          endereco_trabalho: string
          horario_trabalho: string
          id?: string
          linha_onibus?: string | null
          modo_transporte?: string | null
          tempo_ate_ponto?: number | null
          ultima_verificacao?: string | null
          updated_at?: string
          user_matricula: number
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          endereco_casa?: string
          endereco_trabalho?: string
          horario_trabalho?: string
          id?: string
          linha_onibus?: string | null
          modo_transporte?: string | null
          tempo_ate_ponto?: number | null
          ultima_verificacao?: string | null
          updated_at?: string
          user_matricula?: number
        }
        Relationships: []
      }
      routine_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_matricula: number
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_matricula: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_matricula?: number
        }
        Relationships: []
      }
      routine_queue: {
        Row: {
          created_at: string
          execution_id: string | null
          id: string
          priority: number | null
          processed: boolean | null
          processed_at: string | null
          queue_type: string
          user_matricula: number
        }
        Insert: {
          created_at?: string
          execution_id?: string | null
          id?: string
          priority?: number | null
          processed?: boolean | null
          processed_at?: string | null
          queue_type?: string
          user_matricula: number
        }
        Update: {
          created_at?: string
          execution_id?: string | null
          id?: string
          priority?: number | null
          processed?: boolean | null
          processed_at?: string | null
          queue_type?: string
          user_matricula?: number
        }
        Relationships: [
          {
            foreignKeyName: "routine_queue_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "rotina_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_tips: {
        Row: {
          accepted: boolean | null
          created_at: string
          execution_id: string | null
          id: string
          rotina_id: string | null
          shown_at: string
          tip_text: string
          tip_type: string | null
          user_matricula: number
        }
        Insert: {
          accepted?: boolean | null
          created_at?: string
          execution_id?: string | null
          id?: string
          rotina_id?: string | null
          shown_at?: string
          tip_text: string
          tip_type?: string | null
          user_matricula: number
        }
        Update: {
          accepted?: boolean | null
          created_at?: string
          execution_id?: string | null
          id?: string
          rotina_id?: string | null
          shown_at?: string
          tip_text?: string
          tip_type?: string | null
          user_matricula?: number
        }
        Relationships: [
          {
            foreignKeyName: "routine_tips_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "rotina_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_tips_rotina_id_fkey"
            columns: ["rotina_id"]
            isOneToOne: false
            referencedRelation: "rotinas"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_credits: {
        Row: {
          amount: number
          created_at: string
          credited_at: string
          id: string
          month_year: string
          user_matricula: number
        }
        Insert: {
          amount: number
          created_at?: string
          credited_at?: string
          id?: string
          month_year: string
          user_matricula: number
        }
        Update: {
          amount?: number
          created_at?: string
          credited_at?: string
          id?: string
          month_year?: string
          user_matricula?: number
        }
        Relationships: []
      }
      scheduled_payments: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          due_day: number
          id: string
          is_active: boolean
          is_recurring: boolean
          last_paid_at: string | null
          name: string
          specific_month: string | null
          updated_at: string
          user_matricula: number
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          due_day: number
          id?: string
          is_active?: boolean
          is_recurring?: boolean
          last_paid_at?: string | null
          name: string
          specific_month?: string | null
          updated_at?: string
          user_matricula: number
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          due_day?: number
          id?: string
          is_active?: boolean
          is_recurring?: boolean
          last_paid_at?: string | null
          name?: string
          specific_month?: string | null
          updated_at?: string
          user_matricula?: number
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
          user_matricula: number | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
          user_matricula?: number | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
          user_matricula?: number | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          attachment_url: string | null
          created_at: string
          id: string
          message: string
          sender_matricula: number | null
          sender_type: string
          ticket_id: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          message: string
          sender_matricula?: number | null
          sender_type?: string
          ticket_id: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          message?: string
          sender_matricula?: number | null
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          category: string
          closed_at: string | null
          created_at: string
          id: string
          last_message_at: string | null
          last_message_by: string | null
          status: string
          subject: string
          ticket_number: number
          updated_at: string
          user_matricula: number
        }
        Insert: {
          category?: string
          closed_at?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_by?: string | null
          status?: string
          subject: string
          ticket_number?: number
          updated_at?: string
          user_matricula: number
        }
        Update: {
          category?: string
          closed_at?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_by?: string | null
          status?: string
          subject?: string
          ticket_number?: number
          updated_at?: string
          user_matricula?: number
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          payment_method: string | null
          synced: boolean | null
          type: string
          updated_at: string
          user_matricula: number
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          payment_method?: string | null
          synced?: boolean | null
          type: string
          updated_at?: string
          user_matricula: number
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          payment_method?: string | null
          synced?: boolean | null
          type?: string
          updated_at?: string
          user_matricula?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          id: string
          is_online: boolean
          last_activity: string
          session_end: string | null
          session_start: string
          user_matricula: number
          user_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_online?: boolean
          last_activity?: string
          session_end?: string | null
          session_start?: string
          user_matricula: number
          user_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_online?: boolean
          last_activity?: string
          session_end?: string | null
          session_start?: string
          user_matricula?: number
          user_name?: string | null
        }
        Relationships: []
      }
      user_voice_settings: {
        Row: {
          created_at: string
          eleven_api_key_encrypted: string | null
          id: string
          is_enabled: boolean
          updated_at: string
          user_matricula: number
          voice_id: string | null
          voice_name: string | null
        }
        Insert: {
          created_at?: string
          eleven_api_key_encrypted?: string | null
          id?: string
          is_enabled?: boolean
          updated_at?: string
          user_matricula: number
          voice_id?: string | null
          voice_name?: string | null
        }
        Update: {
          created_at?: string
          eleven_api_key_encrypted?: string | null
          id?: string
          is_enabled?: boolean
          updated_at?: string
          user_matricula?: number
          voice_id?: string | null
          voice_name?: string | null
        }
        Relationships: []
      }
      user_whatsapp_settings: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          name: string
          total_notifications_sent: number | null
          user_matricula: number
          whatsapp_number: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          name: string
          total_notifications_sent?: number | null
          user_matricula: number
          whatsapp_number: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          name?: string
          total_notifications_sent?: number | null
          user_matricula?: number
          whatsapp_number?: string
        }
        Relationships: []
      }
      users_matricula: {
        Row: {
          admin_affiliate_created_at: string | null
          admin_affiliate_link_code: string | null
          advance_amount: number | null
          advance_day: number | null
          affiliate_balance: number | null
          affiliate_code: string | null
          affiliate_deactivated_at: string | null
          auth_user_id: string | null
          birth_date: string | null
          blocked: boolean | null
          cpf: string | null
          created_at: string
          credit_available: number | null
          credit_due_day: number | null
          credit_limit: number | null
          credit_used: number | null
          email: string | null
          full_name: string | null
          ganho_total: number | null
          gasto_total: number | null
          has_credit_card: boolean | null
          id: string
          initial_balance: number | null
          is_admin_affiliate: boolean | null
          is_affiliate: boolean | null
          last_affiliate_sale_at: string | null
          matricula: number
          onboarding_completed: boolean | null
          onboarding_step: number | null
          payment_proof_url: string | null
          phone: string | null
          pix_key: string | null
          pix_key_type: string | null
          plan_type: string | null
          salary_amount: number | null
          salary_day: number | null
          saldo_atual: number | null
          subscription_end_date: string | null
          subscription_expires_at: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          subscription_type: string | null
          trial_started_at: string | null
          trial_voice_limit_at: string | null
          user_status: Database["public"]["Enums"]["user_status"]
        }
        Insert: {
          admin_affiliate_created_at?: string | null
          admin_affiliate_link_code?: string | null
          advance_amount?: number | null
          advance_day?: number | null
          affiliate_balance?: number | null
          affiliate_code?: string | null
          affiliate_deactivated_at?: string | null
          auth_user_id?: string | null
          birth_date?: string | null
          blocked?: boolean | null
          cpf?: string | null
          created_at?: string
          credit_available?: number | null
          credit_due_day?: number | null
          credit_limit?: number | null
          credit_used?: number | null
          email?: string | null
          full_name?: string | null
          ganho_total?: number | null
          gasto_total?: number | null
          has_credit_card?: boolean | null
          id?: string
          initial_balance?: number | null
          is_admin_affiliate?: boolean | null
          is_affiliate?: boolean | null
          last_affiliate_sale_at?: string | null
          matricula: number
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          payment_proof_url?: string | null
          phone?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          plan_type?: string | null
          salary_amount?: number | null
          salary_day?: number | null
          saldo_atual?: number | null
          subscription_end_date?: string | null
          subscription_expires_at?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_type?: string | null
          trial_started_at?: string | null
          trial_voice_limit_at?: string | null
          user_status?: Database["public"]["Enums"]["user_status"]
        }
        Update: {
          admin_affiliate_created_at?: string | null
          admin_affiliate_link_code?: string | null
          advance_amount?: number | null
          advance_day?: number | null
          affiliate_balance?: number | null
          affiliate_code?: string | null
          affiliate_deactivated_at?: string | null
          auth_user_id?: string | null
          birth_date?: string | null
          blocked?: boolean | null
          cpf?: string | null
          created_at?: string
          credit_available?: number | null
          credit_due_day?: number | null
          credit_limit?: number | null
          credit_used?: number | null
          email?: string | null
          full_name?: string | null
          ganho_total?: number | null
          gasto_total?: number | null
          has_credit_card?: boolean | null
          id?: string
          initial_balance?: number | null
          is_admin_affiliate?: boolean | null
          is_affiliate?: boolean | null
          last_affiliate_sale_at?: string | null
          matricula?: number
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          payment_proof_url?: string | null
          phone?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          plan_type?: string | null
          salary_amount?: number | null
          salary_day?: number | null
          saldo_atual?: number | null
          subscription_end_date?: string | null
          subscription_expires_at?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_type?: string | null
          trial_started_at?: string | null
          trial_voice_limit_at?: string | null
          user_status?: Database["public"]["Enums"]["user_status"]
        }
        Relationships: []
      }
      whatsapp_notifications_log: {
        Row: {
          created_at: string | null
          error: string | null
          id: string
          message: string
          notified_id: string | null
          notified_type: string | null
          phone: string
          status: string
          user_matricula: number
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          id?: string
          message: string
          notified_id?: string | null
          notified_type?: string | null
          phone: string
          status: string
          user_matricula: number
        }
        Update: {
          created_at?: string | null
          error?: string | null
          id?: string
          message?: string
          notified_id?: string | null
          notified_type?: string | null
          phone?: string
          status?: string
          user_matricula?: number
        }
        Relationships: []
      }
    }
    Views: {
      users_admin_view: {
        Row: {
          affiliate_balance: number | null
          affiliate_code: string | null
          blocked: boolean | null
          created_at: string | null
          credit_due_day: number | null
          credit_limit: number | null
          credit_used: number | null
          email: string | null
          full_name: string | null
          id: string | null
          initial_balance: number | null
          is_admin_affiliate: boolean | null
          is_affiliate: boolean | null
          matricula: number | null
          onboarding_completed: boolean | null
          phone: string | null
          plan_type: string | null
          salary_amount: number | null
          salary_day: number | null
          saldo_atual: number | null
          subscription_end_date: string | null
          subscription_expires_at: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          subscription_type: string | null
          user_status: Database["public"]["Enums"]["user_status"] | null
        }
        Insert: {
          affiliate_balance?: number | null
          affiliate_code?: string | null
          blocked?: boolean | null
          created_at?: string | null
          credit_due_day?: number | null
          credit_limit?: number | null
          credit_used?: number | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          initial_balance?: number | null
          is_admin_affiliate?: boolean | null
          is_affiliate?: boolean | null
          matricula?: number | null
          onboarding_completed?: boolean | null
          phone?: string | null
          plan_type?: string | null
          salary_amount?: number | null
          salary_day?: number | null
          saldo_atual?: number | null
          subscription_end_date?: string | null
          subscription_expires_at?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_type?: string | null
          user_status?: Database["public"]["Enums"]["user_status"] | null
        }
        Update: {
          affiliate_balance?: number | null
          affiliate_code?: string | null
          blocked?: boolean | null
          created_at?: string | null
          credit_due_day?: number | null
          credit_limit?: number | null
          credit_used?: number | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          initial_balance?: number | null
          is_admin_affiliate?: boolean | null
          is_affiliate?: boolean | null
          matricula?: number | null
          onboarding_completed?: boolean | null
          phone?: string | null
          plan_type?: string | null
          salary_amount?: number | null
          salary_day?: number | null
          saldo_atual?: number | null
          subscription_end_date?: string | null
          subscription_expires_at?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_type?: string | null
          user_status?: Database["public"]["Enums"]["user_status"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      user_status: "pending" | "approved" | "rejected"
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
      user_status: ["pending", "approved", "rejected"],
    },
  },
} as const
