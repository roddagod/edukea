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
      admin_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          published_at: string | null
          school_id: string
          target_id: string | null
          target_type: string
          title: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          published_at?: string | null
          school_id: string
          target_id?: string | null
          target_type: string
          title: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          published_at?: string | null
          school_id?: string
          target_id?: string | null
          target_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
        ]
      }
      appreciation_templates: {
        Row: {
          created_at: string
          id: string
          label: string
          order: number
          school_id: string | null
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          order?: number
          school_id?: string | null
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          order?: number
          school_id?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "appreciation_templates_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appreciation_templates_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          classroom_id: string
          created_at: string
          date: string
          id: string
          is_justified: boolean
          reason: string | null
          student_id: string
          type: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
          date: string
          id?: string
          is_justified?: boolean
          reason?: string | null
          student_id: string
          type: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
          date?: string
          id?: string
          is_justified?: boolean
          reason?: string | null
          student_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_period_closure_overview"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "attendance_records_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_class_summary"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "attendance_records_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_students"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_recent_ledger_payments"
            referencedColumns: ["student_id"]
          },
        ]
      }
      bulletin_subjects: {
        Row: {
          average: number | null
          bulletin_id: string
          class_average: number | null
          id: string
          max_average: number | null
          min_average: number | null
          rank: number | null
          subject_id: string
          teacher_appreciation: string | null
        }
        Insert: {
          average?: number | null
          bulletin_id: string
          class_average?: number | null
          id?: string
          max_average?: number | null
          min_average?: number | null
          rank?: number | null
          subject_id: string
          teacher_appreciation?: string | null
        }
        Update: {
          average?: number | null
          bulletin_id?: string
          class_average?: number | null
          id?: string
          max_average?: number | null
          min_average?: number | null
          rank?: number | null
          subject_id?: string
          teacher_appreciation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bulletin_subjects_bulletin_id_fkey"
            columns: ["bulletin_id"]
            isOneToOne: false
            referencedRelation: "bulletins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulletin_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      bulletin_versions: {
        Row: {
          bulletin_id: string
          id: string
          published_at: string
          published_by: string | null
          reason_for_edit: string | null
          snapshot: Json
          version_number: number
        }
        Insert: {
          bulletin_id: string
          id?: string
          published_at?: string
          published_by?: string | null
          reason_for_edit?: string | null
          snapshot: Json
          version_number: number
        }
        Update: {
          bulletin_id?: string
          id?: string
          published_at?: string
          published_by?: string | null
          reason_for_edit?: string | null
          snapshot?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "bulletin_versions_bulletin_id_fkey"
            columns: ["bulletin_id"]
            isOneToOne: false
            referencedRelation: "bulletins"
            referencedColumns: ["id"]
          },
        ]
      }
      bulletins: {
        Row: {
          annual_average: number | null
          average: number | null
          classroom_id: string
          created_at: string
          current_version: number
          finalized_at: string | null
          finalized_by: string | null
          general_appreciation: string | null
          id: string
          is_published: boolean
          periode_id: string
          principal_appreciation: string | null
          published_at: string | null
          published_by: string | null
          rank: number | null
          status: string
          student_id: string
          total_students: number | null
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          annual_average?: number | null
          average?: number | null
          classroom_id: string
          created_at?: string
          current_version?: number
          finalized_at?: string | null
          finalized_by?: string | null
          general_appreciation?: string | null
          id?: string
          is_published?: boolean
          periode_id: string
          principal_appreciation?: string | null
          published_at?: string | null
          published_by?: string | null
          rank?: number | null
          status?: string
          student_id: string
          total_students?: number | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          annual_average?: number | null
          average?: number | null
          classroom_id?: string
          created_at?: string
          current_version?: number
          finalized_at?: string | null
          finalized_by?: string | null
          general_appreciation?: string | null
          id?: string
          is_published?: boolean
          periode_id?: string
          principal_appreciation?: string | null
          published_at?: string | null
          published_by?: string | null
          rank?: number | null
          status?: string
          student_id?: string
          total_students?: number | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bulletins_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulletins_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_period_closure_overview"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "bulletins_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_class_summary"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "bulletins_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_students"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "bulletins_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "periodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulletins_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "v_bulletin_history"
            referencedColumns: ["periode_id"]
          },
          {
            foreignKeyName: "bulletins_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "v_period_closure_overview"
            referencedColumns: ["periode_id"]
          },
          {
            foreignKeyName: "bulletins_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulletins_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_recent_ledger_payments"
            referencedColumns: ["student_id"]
          },
        ]
      }
      classroom_fee_installments: {
        Row: {
          amount: number
          category: string
          classroom_id: string
          created_at: string
          due_date: string
          due_month: number
          due_year_offset: number
          id: string
          label: string
          order: number
          overrides_level_installment_id: string | null
          student_type_id: string
        }
        Insert: {
          amount: number
          category: string
          classroom_id: string
          created_at?: string
          due_date: string
          due_month: number
          due_year_offset?: number
          id?: string
          label: string
          order: number
          overrides_level_installment_id?: string | null
          student_type_id: string
        }
        Update: {
          amount?: number
          category?: string
          classroom_id?: string
          created_at?: string
          due_date?: string
          due_month?: number
          due_year_offset?: number
          id?: string
          label?: string
          order?: number
          overrides_level_installment_id?: string | null
          student_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_fee_installments_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_fee_installments_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_period_closure_overview"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "classroom_fee_installments_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_class_summary"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "classroom_fee_installments_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_students"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "classroom_fee_installments_overrides_level_installment_id_fkey"
            columns: ["overrides_level_installment_id"]
            isOneToOne: false
            referencedRelation: "level_fee_installments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_fee_installments_student_type_id_fkey"
            columns: ["student_type_id"]
            isOneToOne: false
            referencedRelation: "student_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_fee_installments_student_type_id_fkey"
            columns: ["student_type_id"]
            isOneToOne: false
            referencedRelation: "v_fees_overview_matrix"
            referencedColumns: ["student_type_id"]
          },
        ]
      }
      classroom_fee_lines: {
        Row: {
          amount: number
          category: string
          classroom_id: string
          created_at: string
          id: string
          label: string
          order: number
          overrides_level_line_id: string | null
          student_type_id: string
        }
        Insert: {
          amount?: number
          category: string
          classroom_id: string
          created_at?: string
          id?: string
          label: string
          order?: number
          overrides_level_line_id?: string | null
          student_type_id: string
        }
        Update: {
          amount?: number
          category?: string
          classroom_id?: string
          created_at?: string
          id?: string
          label?: string
          order?: number
          overrides_level_line_id?: string | null
          student_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_fee_lines_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_fee_lines_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_period_closure_overview"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "classroom_fee_lines_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_class_summary"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "classroom_fee_lines_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_students"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "classroom_fee_lines_overrides_level_line_id_fkey"
            columns: ["overrides_level_line_id"]
            isOneToOne: false
            referencedRelation: "level_fee_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_fee_lines_student_type_id_fkey"
            columns: ["student_type_id"]
            isOneToOne: false
            referencedRelation: "student_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_fee_lines_student_type_id_fkey"
            columns: ["student_type_id"]
            isOneToOne: false
            referencedRelation: "v_fees_overview_matrix"
            referencedColumns: ["student_type_id"]
          },
        ]
      }
      classroom_periode_status: {
        Row: {
          actual_end_date: string | null
          classroom_id: string
          closure_wizard_run_id: string | null
          created_at: string
          id: string
          locked_at: string | null
          locked_by: string | null
          notes_locked: boolean
          periode_id: string
        }
        Insert: {
          actual_end_date?: string | null
          classroom_id: string
          closure_wizard_run_id?: string | null
          created_at?: string
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          notes_locked?: boolean
          periode_id: string
        }
        Update: {
          actual_end_date?: string | null
          classroom_id?: string
          closure_wizard_run_id?: string | null
          created_at?: string
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          notes_locked?: boolean
          periode_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_periode_status_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_periode_status_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_period_closure_overview"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "classroom_periode_status_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_class_summary"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "classroom_periode_status_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_students"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "classroom_periode_status_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "periodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_periode_status_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "v_bulletin_history"
            referencedColumns: ["periode_id"]
          },
          {
            foreignKeyName: "classroom_periode_status_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "v_period_closure_overview"
            referencedColumns: ["periode_id"]
          },
        ]
      }
      classroom_school_fees: {
        Row: {
          additionnal_fees: string | null
          classroom_id: string | null
          created_at: string | null
          created_by: number | null
          deleted_at: string | null
          id: string
          name: string | null
          registration_fees: string | null
          school_fees: string | null
          school_fees_discount: string | null
          school_fees_net: string | null
          school_id: string | null
          school_year_id: string | null
          total_paiement_part: string | null
          type_student_id: string | null
          updated_at: string | null
        }
        Insert: {
          additionnal_fees?: string | null
          classroom_id?: string | null
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          id: string
          name?: string | null
          registration_fees?: string | null
          school_fees?: string | null
          school_fees_discount?: string | null
          school_fees_net?: string | null
          school_id?: string | null
          school_year_id?: string | null
          total_paiement_part?: string | null
          type_student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          additionnal_fees?: string | null
          classroom_id?: string | null
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          id?: string
          name?: string | null
          registration_fees?: string | null
          school_fees?: string | null
          school_fees_discount?: string | null
          school_fees_net?: string | null
          school_id?: string | null
          school_year_id?: string | null
          total_paiement_part?: string | null
          type_student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classroom_school_fees_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_school_fees_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_period_closure_overview"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "classroom_school_fees_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_class_summary"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "classroom_school_fees_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_students"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "classroom_school_fees_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_school_fees_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "classroom_school_fees_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_school_fees_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_year_id"]
          },
          {
            foreignKeyName: "classroom_school_fees_type_student_id_fkey"
            columns: ["type_student_id"]
            isOneToOne: false
            referencedRelation: "type_students"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_school_fees_by_parts: {
        Row: {
          amount: number | null
          created_at: string | null
          deleted_at: string | null
          due_date: string | null
          id: string
          name: string | null
          order: number | null
          school_fees_id: string | null
          type_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          deleted_at?: string | null
          due_date?: string | null
          id: string
          name?: string | null
          order?: number | null
          school_fees_id?: string | null
          type_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          deleted_at?: string | null
          due_date?: string | null
          id?: string
          name?: string | null
          order?: number | null
          school_fees_id?: string | null
          type_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classroom_school_fees_by_parts_school_fees_id_fkey"
            columns: ["school_fees_id"]
            isOneToOne: false
            referencedRelation: "classroom_school_fees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_school_fees_by_parts_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "type_paiements"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_subjects: {
        Row: {
          classroom_id: string
          coefficient_override: number | null
          created_at: string
          id: string
          subject_id: string
          teacher_id: string | null
        }
        Insert: {
          classroom_id: string
          coefficient_override?: number | null
          created_at?: string
          id?: string
          subject_id: string
          teacher_id?: string | null
        }
        Update: {
          classroom_id?: string
          coefficient_override?: number | null
          created_at?: string
          id?: string
          subject_id?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classroom_subjects_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_subjects_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_period_closure_overview"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "classroom_subjects_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_class_summary"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "classroom_subjects_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_students"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "classroom_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_types: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          name: string | null
          order_by: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id: string
          name?: string | null
          order_by?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          name?: string | null
          order_by?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      classrooms: {
        Row: {
          created_at: string | null
          created_by: number | null
          created_natively: boolean
          deleted_at: string | null
          id: string
          level_id: string | null
          name: string
          order_by: number | null
          principal_teacher_id: string | null
          school_id: string | null
          school_year_id: string | null
          type_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: number | null
          created_natively?: boolean
          deleted_at?: string | null
          id: string
          level_id?: string | null
          name: string
          order_by?: number | null
          principal_teacher_id?: string | null
          school_id?: string | null
          school_year_id?: string | null
          type_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: number | null
          created_natively?: boolean
          deleted_at?: string | null
          id?: string
          level_id?: string | null
          name?: string
          order_by?: number | null
          principal_teacher_id?: string | null
          school_id?: string | null
          school_year_id?: string | null
          type_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classrooms_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classrooms_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "v_fees_overview_matrix"
            referencedColumns: ["level_id"]
          },
          {
            foreignKeyName: "classrooms_principal_teacher_id_fkey"
            columns: ["principal_teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classrooms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classrooms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "classrooms_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classrooms_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_year_id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          last_read_at: string | null
          role: string
          unread_count: number
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          last_read_at?: string | null
          role: string
          unread_count?: number
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          last_read_at?: string | null
          role?: string
          unread_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          is_broadcast: boolean
          last_message_at: string | null
          school_id: string
          student_id: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_broadcast?: boolean
          last_message_at?: string | null
          school_id: string
          student_id?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_broadcast?: boolean
          last_message_at?: string | null
          school_id?: string
          student_id?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "conversations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_recent_ledger_payments"
            referencedColumns: ["student_id"]
          },
        ]
      }
      cycles: {
        Row: {
          created_at: string | null
          created_natively: boolean
          deleted_at: string | null
          id: string
          name: string
          order_by: number | null
          school_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_natively?: boolean
          deleted_at?: string | null
          id: string
          name: string
          order_by?: number | null
          school_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_natively?: boolean
          deleted_at?: string | null
          id?: string
          name?: string
          order_by?: number | null
          school_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      enrollment_drafts: {
        Row: {
          created_at: string
          id: string
          payload: Json
          school_id: string
          school_year_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload: Json
          school_id: string
          school_year_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          school_id?: string
          school_year_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_drafts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_drafts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "enrollment_drafts_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_drafts_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_year_id"]
          },
        ]
      }
      enrollment_transitions: {
        Row: {
          decided_at: string
          decided_by: string | null
          decision: string
          from_classroom_id: string | null
          from_ssyl_id: string | null
          from_year_id: string | null
          id: string
          note: string | null
          student_id: string
          to_classroom_id: string | null
          to_ssyl_id: string | null
          to_year_id: string | null
        }
        Insert: {
          decided_at?: string
          decided_by?: string | null
          decision: string
          from_classroom_id?: string | null
          from_ssyl_id?: string | null
          from_year_id?: string | null
          id?: string
          note?: string | null
          student_id: string
          to_classroom_id?: string | null
          to_ssyl_id?: string | null
          to_year_id?: string | null
        }
        Update: {
          decided_at?: string
          decided_by?: string | null
          decision?: string
          from_classroom_id?: string | null
          from_ssyl_id?: string | null
          from_year_id?: string | null
          id?: string
          note?: string | null
          student_id?: string
          to_classroom_id?: string | null
          to_ssyl_id?: string | null
          to_year_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_transitions_from_classroom_id_fkey"
            columns: ["from_classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_transitions_from_classroom_id_fkey"
            columns: ["from_classroom_id"]
            isOneToOne: false
            referencedRelation: "v_period_closure_overview"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "enrollment_transitions_from_classroom_id_fkey"
            columns: ["from_classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_class_summary"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "enrollment_transitions_from_classroom_id_fkey"
            columns: ["from_classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_students"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "enrollment_transitions_from_ssyl_id_fkey"
            columns: ["from_ssyl_id"]
            isOneToOne: false
            referencedRelation: "student_school_year_loggings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_transitions_from_ssyl_id_fkey"
            columns: ["from_ssyl_id"]
            isOneToOne: false
            referencedRelation: "v_recent_enrollments"
            referencedColumns: ["ssyl_id"]
          },
          {
            foreignKeyName: "enrollment_transitions_from_ssyl_id_fkey"
            columns: ["from_ssyl_id"]
            isOneToOne: false
            referencedRelation: "v_recent_ledger_payments"
            referencedColumns: ["ssyl_id"]
          },
          {
            foreignKeyName: "enrollment_transitions_from_ssyl_id_fkey"
            columns: ["from_ssyl_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_students"
            referencedColumns: ["ssyl_id"]
          },
          {
            foreignKeyName: "enrollment_transitions_from_ssyl_id_fkey"
            columns: ["from_ssyl_id"]
            isOneToOne: false
            referencedRelation: "v_ssyl_installment_status"
            referencedColumns: ["ssyl_id"]
          },
          {
            foreignKeyName: "enrollment_transitions_from_ssyl_id_fkey"
            columns: ["from_ssyl_id"]
            isOneToOne: false
            referencedRelation: "v_year_advancement_preview"
            referencedColumns: ["from_ssyl_id"]
          },
          {
            foreignKeyName: "enrollment_transitions_from_year_id_fkey"
            columns: ["from_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_transitions_from_year_id_fkey"
            columns: ["from_year_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_year_id"]
          },
          {
            foreignKeyName: "enrollment_transitions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_transitions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_recent_ledger_payments"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "enrollment_transitions_to_classroom_id_fkey"
            columns: ["to_classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_transitions_to_classroom_id_fkey"
            columns: ["to_classroom_id"]
            isOneToOne: false
            referencedRelation: "v_period_closure_overview"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "enrollment_transitions_to_classroom_id_fkey"
            columns: ["to_classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_class_summary"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "enrollment_transitions_to_classroom_id_fkey"
            columns: ["to_classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_students"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "enrollment_transitions_to_ssyl_id_fkey"
            columns: ["to_ssyl_id"]
            isOneToOne: false
            referencedRelation: "student_school_year_loggings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_transitions_to_ssyl_id_fkey"
            columns: ["to_ssyl_id"]
            isOneToOne: false
            referencedRelation: "v_recent_enrollments"
            referencedColumns: ["ssyl_id"]
          },
          {
            foreignKeyName: "enrollment_transitions_to_ssyl_id_fkey"
            columns: ["to_ssyl_id"]
            isOneToOne: false
            referencedRelation: "v_recent_ledger_payments"
            referencedColumns: ["ssyl_id"]
          },
          {
            foreignKeyName: "enrollment_transitions_to_ssyl_id_fkey"
            columns: ["to_ssyl_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_students"
            referencedColumns: ["ssyl_id"]
          },
          {
            foreignKeyName: "enrollment_transitions_to_ssyl_id_fkey"
            columns: ["to_ssyl_id"]
            isOneToOne: false
            referencedRelation: "v_ssyl_installment_status"
            referencedColumns: ["ssyl_id"]
          },
          {
            foreignKeyName: "enrollment_transitions_to_ssyl_id_fkey"
            columns: ["to_ssyl_id"]
            isOneToOne: false
            referencedRelation: "v_year_advancement_preview"
            referencedColumns: ["from_ssyl_id"]
          },
          {
            foreignKeyName: "enrollment_transitions_to_year_id_fkey"
            columns: ["to_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_transitions_to_year_id_fkey"
            columns: ["to_year_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_year_id"]
          },
        ]
      }
      evaluations: {
        Row: {
          classroom_subject_id: string
          created_at: string
          date: string
          id: string
          is_published: boolean
          max_score: number
          name: string
          periode_id: string
          type: string
          weight: number
        }
        Insert: {
          classroom_subject_id: string
          created_at?: string
          date: string
          id?: string
          is_published?: boolean
          max_score?: number
          name: string
          periode_id: string
          type: string
          weight?: number
        }
        Update: {
          classroom_subject_id?: string
          created_at?: string
          date?: string
          id?: string
          is_published?: boolean
          max_score?: number
          name?: string
          periode_id?: string
          type?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_classroom_subject_id_fkey"
            columns: ["classroom_subject_id"]
            isOneToOne: false
            referencedRelation: "classroom_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "periodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "v_bulletin_history"
            referencedColumns: ["periode_id"]
          },
          {
            foreignKeyName: "evaluations_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "v_period_closure_overview"
            referencedColumns: ["periode_id"]
          },
        ]
      }
      families: {
        Row: {
          address: string | null
          code: string | null
          created_at: string | null
          created_by: number | null
          deleted_at: string | null
          email: string | null
          firstname: string | null
          id: string
          job: string | null
          lastname: string | null
          level: number | null
          phone: string | null
          residence: string | null
          school_id: string | null
          type_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          code?: string | null
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          email?: string | null
          firstname?: string | null
          id: string
          job?: string | null
          lastname?: string | null
          level?: number | null
          phone?: string | null
          residence?: string | null
          school_id?: string | null
          type_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          code?: string | null
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          email?: string | null
          firstname?: string | null
          id?: string
          job?: string | null
          lastname?: string | null
          level?: number | null
          phone?: string | null
          residence?: string | null
          school_id?: string | null
          type_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "families_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "families_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "families_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "type_families"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_accounts: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["ledger_account_kind"]
          name: string
          school_id: string | null
          school_year_id: string | null
          student_ssyl_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["ledger_account_kind"]
          name: string
          school_id?: string | null
          school_year_id?: string | null
          student_ssyl_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["ledger_account_kind"]
          name?: string
          school_id?: string | null
          school_year_id?: string | null
          student_ssyl_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_accounts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_accounts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "ledger_accounts_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_accounts_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_year_id"]
          },
          {
            foreignKeyName: "ledger_accounts_student_ssyl_id_fkey"
            columns: ["student_ssyl_id"]
            isOneToOne: false
            referencedRelation: "student_school_year_loggings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_accounts_student_ssyl_id_fkey"
            columns: ["student_ssyl_id"]
            isOneToOne: false
            referencedRelation: "v_recent_enrollments"
            referencedColumns: ["ssyl_id"]
          },
          {
            foreignKeyName: "ledger_accounts_student_ssyl_id_fkey"
            columns: ["student_ssyl_id"]
            isOneToOne: false
            referencedRelation: "v_recent_ledger_payments"
            referencedColumns: ["ssyl_id"]
          },
          {
            foreignKeyName: "ledger_accounts_student_ssyl_id_fkey"
            columns: ["student_ssyl_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_students"
            referencedColumns: ["ssyl_id"]
          },
          {
            foreignKeyName: "ledger_accounts_student_ssyl_id_fkey"
            columns: ["student_ssyl_id"]
            isOneToOne: false
            referencedRelation: "v_ssyl_installment_status"
            referencedColumns: ["ssyl_id"]
          },
          {
            foreignKeyName: "ledger_accounts_student_ssyl_id_fkey"
            columns: ["student_ssyl_id"]
            isOneToOne: false
            referencedRelation: "v_year_advancement_preview"
            referencedColumns: ["from_ssyl_id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          currency: string
          direction: Database["public"]["Enums"]["ledger_direction"]
          id: string
          occurred_at: string
          school_id: string
          transaction_id: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          currency?: string
          direction: Database["public"]["Enums"]["ledger_direction"]
          id?: string
          occurred_at: string
          school_id: string
          transaction_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          currency?: string
          direction?: Database["public"]["Enums"]["ledger_direction"]
          id?: string
          occurred_at?: string
          school_id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ledger_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_ledger_account_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "ledger_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_students"
            referencedColumns: ["receivable_account_id"]
          },
          {
            foreignKeyName: "ledger_entries_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "ledger_entries_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "ledger_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "v_recent_ledger_payments"
            referencedColumns: ["tx_id"]
          },
        ]
      }
      ledger_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          external_ref: string | null
          id: string
          memo: string | null
          occurred_at: string
          posted_at: string | null
          ref_id: string | null
          ref_type: string | null
          reversal_of: string | null
          reversed_by: string | null
          school_id: string
          school_year_id: string | null
          source: Database["public"]["Enums"]["ledger_source"]
          status: Database["public"]["Enums"]["ledger_tx_status"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          external_ref?: string | null
          id?: string
          memo?: string | null
          occurred_at?: string
          posted_at?: string | null
          ref_id?: string | null
          ref_type?: string | null
          reversal_of?: string | null
          reversed_by?: string | null
          school_id: string
          school_year_id?: string | null
          source: Database["public"]["Enums"]["ledger_source"]
          status?: Database["public"]["Enums"]["ledger_tx_status"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          external_ref?: string | null
          id?: string
          memo?: string | null
          occurred_at?: string
          posted_at?: string | null
          ref_id?: string | null
          ref_type?: string | null
          reversal_of?: string | null
          reversed_by?: string | null
          school_id?: string
          school_year_id?: string | null
          source?: Database["public"]["Enums"]["ledger_source"]
          status?: Database["public"]["Enums"]["ledger_tx_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ledger_transactions_reversal_of_fkey"
            columns: ["reversal_of"]
            isOneToOne: false
            referencedRelation: "ledger_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_transactions_reversal_of_fkey"
            columns: ["reversal_of"]
            isOneToOne: false
            referencedRelation: "v_recent_ledger_payments"
            referencedColumns: ["tx_id"]
          },
          {
            foreignKeyName: "ledger_transactions_reversed_by_fkey"
            columns: ["reversed_by"]
            isOneToOne: false
            referencedRelation: "ledger_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_transactions_reversed_by_fkey"
            columns: ["reversed_by"]
            isOneToOne: false
            referencedRelation: "v_recent_ledger_payments"
            referencedColumns: ["tx_id"]
          },
          {
            foreignKeyName: "ledger_transactions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_transactions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "ledger_transactions_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_transactions_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_year_id"]
          },
        ]
      }
      level_fee_installments: {
        Row: {
          amount: number | null
          amount_percentage: number | null
          category: string
          created_at: string
          due_month: number
          due_year_offset: number
          id: string
          label: string
          level_id: string
          order: number
          student_type_id: string
        }
        Insert: {
          amount?: number | null
          amount_percentage?: number | null
          category: string
          created_at?: string
          due_month: number
          due_year_offset?: number
          id?: string
          label: string
          level_id: string
          order: number
          student_type_id: string
        }
        Update: {
          amount?: number | null
          amount_percentage?: number | null
          category?: string
          created_at?: string
          due_month?: number
          due_year_offset?: number
          id?: string
          label?: string
          level_id?: string
          order?: number
          student_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "level_fee_installments_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "level_fee_installments_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "v_fees_overview_matrix"
            referencedColumns: ["level_id"]
          },
          {
            foreignKeyName: "level_fee_installments_student_type_id_fkey"
            columns: ["student_type_id"]
            isOneToOne: false
            referencedRelation: "student_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "level_fee_installments_student_type_id_fkey"
            columns: ["student_type_id"]
            isOneToOne: false
            referencedRelation: "v_fees_overview_matrix"
            referencedColumns: ["student_type_id"]
          },
        ]
      }
      level_fee_lines: {
        Row: {
          amount: number
          category: string
          created_at: string
          id: string
          is_optional: boolean
          label: string
          level_id: string
          order: number
          student_type_id: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          id?: string
          is_optional?: boolean
          label: string
          level_id: string
          order?: number
          student_type_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          id?: string
          is_optional?: boolean
          label?: string
          level_id?: string
          order?: number
          student_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "level_fee_lines_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "level_fee_lines_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "v_fees_overview_matrix"
            referencedColumns: ["level_id"]
          },
          {
            foreignKeyName: "level_fee_lines_student_type_id_fkey"
            columns: ["student_type_id"]
            isOneToOne: false
            referencedRelation: "student_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "level_fee_lines_student_type_id_fkey"
            columns: ["student_type_id"]
            isOneToOne: false
            referencedRelation: "v_fees_overview_matrix"
            referencedColumns: ["student_type_id"]
          },
        ]
      }
      levels: {
        Row: {
          created_at: string | null
          created_natively: boolean
          cycle_id: string | null
          deleted_at: string | null
          id: string
          name: string
          order_by: number | null
          school_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_natively?: boolean
          cycle_id?: string | null
          deleted_at?: string | null
          id: string
          name: string
          order_by?: number | null
          school_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_natively?: boolean
          cycle_id?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          order_by?: number | null
          school_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "levels_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "levels_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_cycle_summary"
            referencedColumns: ["cycle_id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          comment: string | null
          created_at: string
          evaluation_id: string
          id: string
          is_absent: boolean
          is_exempted: boolean
          score: number | null
          student_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          evaluation_id: string
          id?: string
          is_absent?: boolean
          is_exempted?: boolean
          score?: number | null
          student_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          evaluation_id?: string
          id?: string
          is_absent?: boolean
          is_exempted?: boolean
          score?: number | null
          student_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_recent_ledger_payments"
            referencedColumns: ["student_id"]
          },
        ]
      }
      notes_audit: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_is_absent: boolean | null
          new_is_exempted: boolean | null
          new_score: number | null
          note_id: string
          old_is_absent: boolean | null
          old_is_exempted: boolean | null
          old_score: number | null
          reason: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_is_absent?: boolean | null
          new_is_exempted?: boolean | null
          new_score?: number | null
          note_id: string
          old_is_absent?: boolean | null
          old_is_exempted?: boolean | null
          old_score?: number | null
          reason?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_is_absent?: boolean | null
          new_is_exempted?: boolean | null
          new_score?: number | null
          note_id?: string
          old_is_absent?: boolean | null
          old_is_exempted?: boolean | null
          old_score?: number | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_audit_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      paiements: {
        Row: {
          amount: number | null
          created_at: string | null
          created_by: number | null
          deleted_at: string | null
          id: string
          is_discount: number | null
          paiement_type: string | null
          school_id: string | null
          student_school_year_logging_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          id: string
          is_discount?: number | null
          paiement_type?: string | null
          school_id?: string | null
          student_school_year_logging_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          id?: string
          is_discount?: number | null
          paiement_type?: string | null
          school_id?: string | null
          student_school_year_logging_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paiements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "paiements_student_school_year_logging_id_fkey"
            columns: ["student_school_year_logging_id"]
            isOneToOne: false
            referencedRelation: "student_school_year_loggings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiements_student_school_year_logging_id_fkey"
            columns: ["student_school_year_logging_id"]
            isOneToOne: false
            referencedRelation: "v_recent_enrollments"
            referencedColumns: ["ssyl_id"]
          },
          {
            foreignKeyName: "paiements_student_school_year_logging_id_fkey"
            columns: ["student_school_year_logging_id"]
            isOneToOne: false
            referencedRelation: "v_recent_ledger_payments"
            referencedColumns: ["ssyl_id"]
          },
          {
            foreignKeyName: "paiements_student_school_year_logging_id_fkey"
            columns: ["student_school_year_logging_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_students"
            referencedColumns: ["ssyl_id"]
          },
          {
            foreignKeyName: "paiements_student_school_year_logging_id_fkey"
            columns: ["student_school_year_logging_id"]
            isOneToOne: false
            referencedRelation: "v_ssyl_installment_status"
            referencedColumns: ["ssyl_id"]
          },
          {
            foreignKeyName: "paiements_student_school_year_logging_id_fkey"
            columns: ["student_school_year_logging_id"]
            isOneToOne: false
            referencedRelation: "v_year_advancement_preview"
            referencedColumns: ["from_ssyl_id"]
          },
        ]
      }
      parent_profiles: {
        Row: {
          created_at: string
          father_id: string | null
          id: string
          mother_id: string | null
          phone: string | null
          push_token: string | null
          school_id: string
          student_id: string | null
          tutor_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          father_id?: string | null
          id?: string
          mother_id?: string | null
          phone?: string | null
          push_token?: string | null
          school_id: string
          student_id?: string | null
          tutor_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          father_id?: string | null
          id?: string
          mother_id?: string | null
          phone?: string | null
          push_token?: string | null
          school_id?: string
          student_id?: string | null
          tutor_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_profiles_father_id_fkey"
            columns: ["father_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_profiles_mother_id_fkey"
            columns: ["mother_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "parent_profiles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_profiles_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_recent_ledger_payments"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "parent_profiles_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_allocations: {
        Row: {
          allocated_amount: number
          allocated_at: string
          fee_installment_id: string | null
          id: string
          payment_tx_id: string
        }
        Insert: {
          allocated_amount: number
          allocated_at?: string
          fee_installment_id?: string | null
          id?: string
          payment_tx_id: string
        }
        Update: {
          allocated_amount?: number
          allocated_at?: string
          fee_installment_id?: string | null
          id?: string
          payment_tx_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_fee_installment_id_fkey"
            columns: ["fee_installment_id"]
            isOneToOne: false
            referencedRelation: "classroom_fee_installments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_fee_installment_id_fkey"
            columns: ["fee_installment_id"]
            isOneToOne: false
            referencedRelation: "v_ssyl_installment_status"
            referencedColumns: ["installment_id"]
          },
          {
            foreignKeyName: "payment_allocations_payment_tx_id_fkey"
            columns: ["payment_tx_id"]
            isOneToOne: false
            referencedRelation: "ledger_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_payment_tx_id_fkey"
            columns: ["payment_tx_id"]
            isOneToOne: false
            referencedRelation: "v_recent_ledger_payments"
            referencedColumns: ["tx_id"]
          },
        ]
      }
      periodes: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_published: boolean
          name: string
          order: number
          school_id: string
          school_year_id: string
          start_date: string
          type: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_published?: boolean
          name: string
          order: number
          school_id: string
          school_year_id: string
          start_date: string
          type: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_published?: boolean
          name?: string
          order?: number
          school_id?: string
          school_year_id?: string
          start_date?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "periodes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "periodes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "periodes_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "periodes_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_year_id"]
          },
        ]
      }
      school_staff_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          role: string
          school_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
          school_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
          school_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_staff_profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_staff_profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
        ]
      }
      school_years: {
        Row: {
          created_at: string | null
          created_by: number | null
          date_end: string | null
          date_start: string | null
          deleted_at: string | null
          id: string
          name: string
          periode_type: string | null
          school_id: string | null
          school_year_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: number | null
          date_end?: string | null
          date_start?: string | null
          deleted_at?: string | null
          id: string
          name: string
          periode_type?: string | null
          school_id?: string | null
          school_year_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: number | null
          date_end?: string | null
          date_start?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          periode_type?: string | null
          school_id?: string | null
          school_year_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_years_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_years_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
        ]
      }
      schools: {
        Row: {
          accent_color: string
          accreditation_number: string | null
          address: string | null
          adress: string | null
          bp: string | null
          bulletin_config: Json
          cinet_pay_api_key: string | null
          cinet_pay_site_id: string | null
          created_at: string | null
          created_by: number | null
          default_fee_template: Json
          default_max_score: number
          deleted_at: string | null
          director_signature_url: string | null
          display_name: string | null
          email: string | null
          id: string
          logo_id: number | null
          logo_url: string | null
          matricule_prefix: string | null
          motto: string | null
          name: string
          phone: string | null
          postal_address: string | null
          slogan: string | null
          stamp_url: string | null
          structure_seeded_from: string | null
          updated_at: string | null
        }
        Insert: {
          accent_color?: string
          accreditation_number?: string | null
          address?: string | null
          adress?: string | null
          bp?: string | null
          bulletin_config?: Json
          cinet_pay_api_key?: string | null
          cinet_pay_site_id?: string | null
          created_at?: string | null
          created_by?: number | null
          default_fee_template?: Json
          default_max_score?: number
          deleted_at?: string | null
          director_signature_url?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          logo_id?: number | null
          logo_url?: string | null
          matricule_prefix?: string | null
          motto?: string | null
          name: string
          phone?: string | null
          postal_address?: string | null
          slogan?: string | null
          stamp_url?: string | null
          structure_seeded_from?: string | null
          updated_at?: string | null
        }
        Update: {
          accent_color?: string
          accreditation_number?: string | null
          address?: string | null
          adress?: string | null
          bp?: string | null
          bulletin_config?: Json
          cinet_pay_api_key?: string | null
          cinet_pay_site_id?: string | null
          created_at?: string | null
          created_by?: number | null
          default_fee_template?: Json
          default_max_score?: number
          deleted_at?: string | null
          director_signature_url?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          logo_id?: number | null
          logo_url?: string | null
          matricule_prefix?: string | null
          motto?: string | null
          name?: string
          phone?: string | null
          postal_address?: string | null
          slogan?: string | null
          stamp_url?: string | null
          structure_seeded_from?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      structure_templates: {
        Row: {
          cycle_code: string
          cycle_name: string
          id: string
          level_code: string
          level_name: string
          level_order: number
          template_key: string
        }
        Insert: {
          cycle_code: string
          cycle_name: string
          id?: string
          level_code: string
          level_name: string
          level_order: number
          template_key: string
        }
        Update: {
          cycle_code?: string
          cycle_name?: string
          id?: string
          level_code?: string
          level_name?: string
          level_order?: number
          template_key?: string
        }
        Relationships: []
      }
      student_paiement_by_parts: {
        Row: {
          amount: number | null
          created_at: string | null
          deleted_at: string | null
          id: string
          is_discount: number | null
          paiement_id: string | null
          part_id: string | null
          pay_state: number | null
          student_school_year_logging_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          deleted_at?: string | null
          id: string
          is_discount?: number | null
          paiement_id?: string | null
          part_id?: string | null
          pay_state?: number | null
          student_school_year_logging_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_discount?: number | null
          paiement_id?: string | null
          part_id?: string | null
          pay_state?: number | null
          student_school_year_logging_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_paiement_by_parts_paiement_id_fkey"
            columns: ["paiement_id"]
            isOneToOne: false
            referencedRelation: "paiements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_paiement_by_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "classroom_school_fees_by_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_paiement_by_parts_student_school_year_logging_id_fkey"
            columns: ["student_school_year_logging_id"]
            isOneToOne: false
            referencedRelation: "student_school_year_loggings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_paiement_by_parts_student_school_year_logging_id_fkey"
            columns: ["student_school_year_logging_id"]
            isOneToOne: false
            referencedRelation: "v_recent_enrollments"
            referencedColumns: ["ssyl_id"]
          },
          {
            foreignKeyName: "student_paiement_by_parts_student_school_year_logging_id_fkey"
            columns: ["student_school_year_logging_id"]
            isOneToOne: false
            referencedRelation: "v_recent_ledger_payments"
            referencedColumns: ["ssyl_id"]
          },
          {
            foreignKeyName: "student_paiement_by_parts_student_school_year_logging_id_fkey"
            columns: ["student_school_year_logging_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_students"
            referencedColumns: ["ssyl_id"]
          },
          {
            foreignKeyName: "student_paiement_by_parts_student_school_year_logging_id_fkey"
            columns: ["student_school_year_logging_id"]
            isOneToOne: false
            referencedRelation: "v_ssyl_installment_status"
            referencedColumns: ["ssyl_id"]
          },
          {
            foreignKeyName: "student_paiement_by_parts_student_school_year_logging_id_fkey"
            columns: ["student_school_year_logging_id"]
            isOneToOne: false
            referencedRelation: "v_year_advancement_preview"
            referencedColumns: ["from_ssyl_id"]
          },
        ]
      }
      student_school_year_loggings: {
        Row: {
          additionnal_fees_pay: number | null
          classroom_id: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          discount: number | null
          eps: number | null
          eps_exemption: boolean
          id: string
          is_first_register: number | null
          is_not_register: number | null
          is_redoublant: boolean
          is_transfer: number | null
          lv2_id: string | null
          lv2_subject_id: string | null
          mat_secondaire_subject_id: string | null
          paiement_status: string | null
          permonth_amount_due_date: string | null
          permonth_amount_received: number | null
          permonth_amount_tobe_received: number | null
          profil_id: string | null
          registration_date: string | null
          registration_fees_pay: number | null
          remaining_balance_transfer: number | null
          repeating: number | null
          school_fees_id: string | null
          school_fees_paid: number | null
          school_fees_pay: number | null
          school_fees_total: number | null
          school_id: string | null
          school_year_id: string | null
          secondary_subject_id: string | null
          solde_register: number | null
          student_id: string | null
          type_student_id: string | null
          updated_at: string | null
        }
        Insert: {
          additionnal_fees_pay?: number | null
          classroom_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          discount?: number | null
          eps?: number | null
          eps_exemption?: boolean
          id: string
          is_first_register?: number | null
          is_not_register?: number | null
          is_redoublant?: boolean
          is_transfer?: number | null
          lv2_id?: string | null
          lv2_subject_id?: string | null
          mat_secondaire_subject_id?: string | null
          paiement_status?: string | null
          permonth_amount_due_date?: string | null
          permonth_amount_received?: number | null
          permonth_amount_tobe_received?: number | null
          profil_id?: string | null
          registration_date?: string | null
          registration_fees_pay?: number | null
          remaining_balance_transfer?: number | null
          repeating?: number | null
          school_fees_id?: string | null
          school_fees_paid?: number | null
          school_fees_pay?: number | null
          school_fees_total?: number | null
          school_id?: string | null
          school_year_id?: string | null
          secondary_subject_id?: string | null
          solde_register?: number | null
          student_id?: string | null
          type_student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          additionnal_fees_pay?: number | null
          classroom_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          discount?: number | null
          eps?: number | null
          eps_exemption?: boolean
          id?: string
          is_first_register?: number | null
          is_not_register?: number | null
          is_redoublant?: boolean
          is_transfer?: number | null
          lv2_id?: string | null
          lv2_subject_id?: string | null
          mat_secondaire_subject_id?: string | null
          paiement_status?: string | null
          permonth_amount_due_date?: string | null
          permonth_amount_received?: number | null
          permonth_amount_tobe_received?: number | null
          profil_id?: string | null
          registration_date?: string | null
          registration_fees_pay?: number | null
          remaining_balance_transfer?: number | null
          repeating?: number | null
          school_fees_id?: string | null
          school_fees_paid?: number | null
          school_fees_pay?: number | null
          school_fees_total?: number | null
          school_id?: string | null
          school_year_id?: string | null
          secondary_subject_id?: string | null
          solde_register?: number | null
          student_id?: string | null
          type_student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_school_year_loggings_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_period_closure_overview"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_class_summary"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_students"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_lv2_subject_id_fkey"
            columns: ["lv2_subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_mat_secondaire_subject_id_fkey"
            columns: ["mat_secondaire_subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_fees_id_fkey"
            columns: ["school_fees_id"]
            isOneToOne: false
            referencedRelation: "classroom_school_fees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_year_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_recent_ledger_payments"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_type_student_id_fkey"
            columns: ["type_student_id"]
            isOneToOne: false
            referencedRelation: "type_students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_types: {
        Row: {
          code: string
          created_at: string
          id: string
          is_default: boolean
          label: string
          order: number
          school_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_default?: boolean
          label: string
          order?: number
          school_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          order?: number
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_types_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_types_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
        ]
      }
      students: {
        Row: {
          birth_certificate_number: string | null
          created_at: string | null
          date_of_birth: string | null
          deleted_at: string | null
          email: string | null
          father_id: string | null
          firstname: string
          id: string
          is_registration: number | null
          lastname: string
          matricule: string | null
          mother_id: string | null
          nationality: string | null
          place_of_birth: string | null
          profil_id: string | null
          school_id: string | null
          sex: string | null
          student_type_id: string | null
          tutor_id: string | null
          type_id: string | null
          updated_at: string | null
        }
        Insert: {
          birth_certificate_number?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          father_id?: string | null
          firstname: string
          id: string
          is_registration?: number | null
          lastname: string
          matricule?: string | null
          mother_id?: string | null
          nationality?: string | null
          place_of_birth?: string | null
          profil_id?: string | null
          school_id?: string | null
          sex?: string | null
          student_type_id?: string | null
          tutor_id?: string | null
          type_id?: string | null
          updated_at?: string | null
        }
        Update: {
          birth_certificate_number?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          father_id?: string | null
          firstname?: string
          id?: string
          is_registration?: number | null
          lastname?: string
          matricule?: string | null
          mother_id?: string | null
          nationality?: string | null
          place_of_birth?: string | null
          profil_id?: string | null
          school_id?: string | null
          sex?: string | null
          student_type_id?: string | null
          tutor_id?: string | null
          type_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_father_id_fkey"
            columns: ["father_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_mother_id_fkey"
            columns: ["mother_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "students_student_type_id_fkey"
            columns: ["student_type_id"]
            isOneToOne: false
            referencedRelation: "student_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_student_type_id_fkey"
            columns: ["student_type_id"]
            isOneToOne: false
            referencedRelation: "v_fees_overview_matrix"
            referencedColumns: ["student_type_id"]
          },
          {
            foreignKeyName: "students_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "type_students"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_groups: {
        Row: {
          id: string
          name: string
          order: number
          school_id: string
        }
        Insert: {
          id?: string
          name: string
          order?: number
          school_id: string
        }
        Update: {
          id?: string
          name?: string
          order?: number
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_groups_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_groups_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
        ]
      }
      subject_school_year_availability: {
        Row: {
          created_at: string
          id: string
          is_available: boolean
          school_year_id: string
          subject_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_available?: boolean
          school_year_id: string
          subject_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_available?: boolean
          school_year_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_school_year_availability_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_school_year_availability_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_year_id"]
          },
          {
            foreignKeyName: "subject_school_year_availability_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_templates: {
        Row: {
          cycle_code: string
          default_coefficient: number
          default_group_name: string
          id: string
          is_secondary: boolean
          name: string
          order: number
        }
        Insert: {
          cycle_code: string
          default_coefficient?: number
          default_group_name?: string
          id?: string
          is_secondary?: boolean
          name: string
          order?: number
        }
        Update: {
          cycle_code?: string
          default_coefficient?: number
          default_group_name?: string
          id?: string
          is_secondary?: boolean
          name?: string
          order?: number
        }
        Relationships: []
      }
      subjects: {
        Row: {
          coefficient: number
          created_at: string
          group_id: string
          id: string
          max_score: number
          name: string
          school_id: string
        }
        Insert: {
          coefficient?: number
          created_at?: string
          group_id: string
          id?: string
          max_score?: number
          name: string
          school_id: string
        }
        Update: {
          coefficient?: number
          created_at?: string
          group_id?: string
          id?: string
          max_score?: number
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "subject_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
        ]
      }
      teacher_invitations: {
        Row: {
          accepted_at: string | null
          email: string
          expires_at: string
          id: string
          invited_at: string
          invited_by: string | null
          school_id: string
          token: string | null
        }
        Insert: {
          accepted_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          school_id: string
          token?: string | null
        }
        Update: {
          accepted_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          school_id?: string
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_invitations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_invitations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
        ]
      }
      teacher_profiles: {
        Row: {
          created_at: string
          id: string
          personel_id: string | null
          school_id: string
          signature_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          personel_id?: string | null
          school_id: string
          signature_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          personel_id?: string | null
          school_id?: string
          signature_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
        ]
      }
      timetable_slots: {
        Row: {
          classroom_id: string
          classroom_subject_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          room: string | null
          start_time: string
        }
        Insert: {
          classroom_id: string
          classroom_subject_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          room?: string | null
          start_time: string
        }
        Update: {
          classroom_id?: string
          classroom_subject_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          room?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_slots_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_slots_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_period_closure_overview"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "timetable_slots_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_class_summary"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "timetable_slots_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_students"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "timetable_slots_classroom_subject_id_fkey"
            columns: ["classroom_subject_id"]
            isOneToOne: false
            referencedRelation: "classroom_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      type_families: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          name: string
          order_by: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id: string
          name: string
          order_by?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          order_by?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      type_paiements: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          name: string
          order_by: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id: string
          name: string
          order_by?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          order_by?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      type_students: {
        Row: {
          created_at: string | null
          created_by: number | null
          deleted_at: string | null
          id: string
          name: string
          school_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          id: string
          name: string
          school_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: number | null
          deleted_at?: string | null
          id?: string
          name?: string
          school_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "type_students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "type_students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
        ]
      }
    }
    Views: {
      v_bulletin_history: {
        Row: {
          classroom_id: string | null
          current_version: number | null
          general_average: number | null
          periode_id: string | null
          periode_name: string | null
          periode_order: number | null
          rank: number | null
          school_year_id: string | null
          status: string | null
          student_id: string | null
          subject_average: number | null
          subject_id: string | null
          subject_rank: number | null
          total_students: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bulletin_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulletins_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulletins_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_period_closure_overview"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "bulletins_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_class_summary"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "bulletins_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_students"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "bulletins_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulletins_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_recent_ledger_payments"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "periodes_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "periodes_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_year_id"]
          },
        ]
      }
      v_class_statistics: {
        Row: {
          class_average: number | null
          classroom_id: string | null
          max_average: number | null
          median: number | null
          min_average: number | null
          periode_id: string | null
          q1: number | null
          q3: number | null
          student_count: number | null
          subject_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bulletin_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulletins_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulletins_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_period_closure_overview"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "bulletins_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_class_summary"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "bulletins_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_students"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "bulletins_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "periodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulletins_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "v_bulletin_history"
            referencedColumns: ["periode_id"]
          },
          {
            foreignKeyName: "bulletins_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "v_period_closure_overview"
            referencedColumns: ["periode_id"]
          },
        ]
      }
      v_classroom_effective_fees: {
        Row: {
          amount: number | null
          category: string | null
          classroom_id: string | null
          label: string | null
          order: number | null
          source: string | null
          student_type_id: string | null
        }
        Relationships: []
      }
      v_classroom_effective_installments: {
        Row: {
          amount: number | null
          category: string | null
          classroom_id: string | null
          due_date: string | null
          label: string | null
          order: number | null
          source: string | null
          student_type_id: string | null
        }
        Relationships: []
      }
      v_enrollment_stats: {
        Row: {
          new_enrollments: number | null
          not_reenrolled_previous: number | null
          reenrollments: number | null
          school_id: string | null
          school_year_id: string | null
          total_enrolled: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_school_year_loggings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_year_id"]
          },
        ]
      }
      v_fees_overview_matrix: {
        Row: {
          installments_count: number | null
          level_id: string | null
          level_name: string | null
          level_order: number | null
          lines_count: number | null
          school_id: string | null
          student_type_code: string | null
          student_type_id: string | null
          student_type_label: string | null
          student_type_order: number | null
          total_mandatory: number | null
          total_with_options: number | null
        }
        Relationships: []
      }
      v_ledger_account_balance: {
        Row: {
          account_id: string | null
          balance: number | null
          currency: string | null
          kind: Database["public"]["Enums"]["ledger_account_kind"] | null
          school_id: string | null
          school_year_id: string | null
          student_ssyl_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_accounts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_accounts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "ledger_accounts_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_accounts_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_year_id"]
          },
          {
            foreignKeyName: "ledger_accounts_student_ssyl_id_fkey"
            columns: ["student_ssyl_id"]
            isOneToOne: false
            referencedRelation: "student_school_year_loggings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_accounts_student_ssyl_id_fkey"
            columns: ["student_ssyl_id"]
            isOneToOne: false
            referencedRelation: "v_recent_enrollments"
            referencedColumns: ["ssyl_id"]
          },
          {
            foreignKeyName: "ledger_accounts_student_ssyl_id_fkey"
            columns: ["student_ssyl_id"]
            isOneToOne: false
            referencedRelation: "v_recent_ledger_payments"
            referencedColumns: ["ssyl_id"]
          },
          {
            foreignKeyName: "ledger_accounts_student_ssyl_id_fkey"
            columns: ["student_ssyl_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_students"
            referencedColumns: ["ssyl_id"]
          },
          {
            foreignKeyName: "ledger_accounts_student_ssyl_id_fkey"
            columns: ["student_ssyl_id"]
            isOneToOne: false
            referencedRelation: "v_ssyl_installment_status"
            referencedColumns: ["ssyl_id"]
          },
          {
            foreignKeyName: "ledger_accounts_student_ssyl_id_fkey"
            columns: ["student_ssyl_id"]
            isOneToOne: false
            referencedRelation: "v_year_advancement_preview"
            referencedColumns: ["from_ssyl_id"]
          },
        ]
      }
      v_note_entry_progress: {
        Row: {
          classroom_id: string | null
          periode_id: string | null
          published_evaluations: number | null
          students_with_notes: number | null
          subject_id: string | null
          total_evaluations: number | null
          total_students: number | null
        }
        Relationships: [
          {
            foreignKeyName: "classroom_subjects_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_subjects_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_period_closure_overview"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "classroom_subjects_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_class_summary"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "classroom_subjects_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_students"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "classroom_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "periodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "v_bulletin_history"
            referencedColumns: ["periode_id"]
          },
          {
            foreignKeyName: "evaluations_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "v_period_closure_overview"
            referencedColumns: ["periode_id"]
          },
        ]
      }
      v_passage_progress_by_class: {
        Row: {
          classroom_id: string | null
          classroom_name: string | null
          cycle_name: string | null
          from_year_id: string | null
          level_name: string | null
          level_order: number | null
          n_advance: number | null
          n_decided: number | null
          n_leave: number | null
          n_pending: number | null
          n_repeat: number | null
          n_students: number | null
          school_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_school_year_loggings_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_period_closure_overview"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_class_summary"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_students"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_year_id_fkey"
            columns: ["from_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_year_id_fkey"
            columns: ["from_year_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_year_id"]
          },
        ]
      }
      v_pedagogy_setup_status: {
        Row: {
          classroom_subjects_with_teacher_count: number | null
          classrooms_count: number | null
          classrooms_with_principal_count: number | null
          fee_lines_count: number | null
          latest_school_year_name: string | null
          levels_count: number | null
          periode_type: string | null
          periodes_count: number | null
          school_id: string | null
          school_year_id: string | null
          school_year_name: string | null
          step_bulletin_customized: boolean | null
          step_grading_done: boolean | null
          step_year_done: boolean | null
          student_types_count: number | null
          subjects_count: number | null
          teachers_count: number | null
        }
        Relationships: []
      }
      v_period_closure_overview: {
        Row: {
          actual_end_date: string | null
          bulletins_draft: number | null
          bulletins_published: number | null
          bulletins_ready_censeur: number | null
          bulletins_ready_director: number | null
          classroom_id: string | null
          classroom_name: string | null
          level_name: string | null
          notes_locked: boolean | null
          periode_id: string | null
          periode_name: string | null
          school_id: string | null
          total_students: number | null
        }
        Relationships: [
          {
            foreignKeyName: "periodes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "periodes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
        ]
      }
      v_provisional_averages: {
        Row: {
          classroom_id: string | null
          coefficient: number | null
          latest_note_date: string | null
          notes_count: number | null
          periode_id: string | null
          provisional_subject_avg: number | null
          student_id: string | null
          subject_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classroom_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "periodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "v_bulletin_history"
            referencedColumns: ["periode_id"]
          },
          {
            foreignKeyName: "evaluations_periode_id_fkey"
            columns: ["periode_id"]
            isOneToOne: false
            referencedRelation: "v_period_closure_overview"
            referencedColumns: ["periode_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_period_closure_overview"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_class_summary"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_students"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_recent_ledger_payments"
            referencedColumns: ["student_id"]
          },
        ]
      }
      v_recent_enrollments: {
        Row: {
          billed_total: number | null
          classroom_name: string | null
          created_at: string | null
          enrollment_type: string | null
          is_first_register: number | null
          matricule: string | null
          school_id: string | null
          school_year_id: string | null
          ssyl_id: string | null
          student_id: string | null
          student_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_school_year_loggings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_year_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_recent_ledger_payments"
            referencedColumns: ["student_id"]
          },
        ]
      }
      v_recent_ledger_payments: {
        Row: {
          amount: number | null
          classroom_name: string | null
          debit_kind: Database["public"]["Enums"]["ledger_account_kind"] | null
          is_discount: boolean | null
          matricule: string | null
          memo: string | null
          occurred_at: string | null
          paiement_type: string | null
          receivable_balance: number | null
          ref_id: string | null
          ref_type: string | null
          school_fees_total: number | null
          school_id: string | null
          school_year_id: string | null
          source: Database["public"]["Enums"]["ledger_source"] | null
          ssyl_id: string | null
          status: string | null
          student_id: string | null
          student_name: string | null
          tx_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_transactions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_transactions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "ledger_transactions_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_transactions_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_year_id"]
          },
        ]
      }
      v_recovery_class_summary: {
        Row: {
          billed_total: number | null
          classroom_id: string | null
          classroom_name: string | null
          collected_total: number | null
          cycle_id: string | null
          cycle_name: string | null
          debute_count: number | null
          impaye_count: number | null
          level_id: string | null
          level_name: string | null
          n_students: number | null
          remaining_total: number | null
          school_id: string | null
          school_year_id: string | null
          solde_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "classrooms_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classrooms_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "v_fees_overview_matrix"
            referencedColumns: ["level_id"]
          },
          {
            foreignKeyName: "levels_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "levels_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_cycle_summary"
            referencedColumns: ["cycle_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_year_id"]
          },
        ]
      }
      v_recovery_cycle_summary: {
        Row: {
          billed_total: number | null
          collected_total: number | null
          cycle_id: string | null
          cycle_name: string | null
          cycle_order: number | null
          debute_count: number | null
          impaye_count: number | null
          n_classrooms: number | null
          n_levels: number | null
          n_students: number | null
          remaining_total: number | null
          school_id: string | null
          school_year_id: string | null
          solde_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_school_year_loggings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_year_id"]
          },
        ]
      }
      v_recovery_level_summary: {
        Row: {
          billed_total: number | null
          collected_total: number | null
          cycle_name: string | null
          debute_count: number | null
          impaye_count: number | null
          level_id: string | null
          level_name: string | null
          level_order: number | null
          n_classrooms: number | null
          n_students: number | null
          remaining_total: number | null
          school_id: string | null
          school_year_id: string | null
          solde_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "classrooms_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classrooms_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "v_fees_overview_matrix"
            referencedColumns: ["level_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_year_id"]
          },
        ]
      }
      v_recovery_students: {
        Row: {
          billed_initial: number | null
          classroom_id: string | null
          classroom_name: string | null
          collected: number | null
          created_at: string | null
          cycle_name: string | null
          level_name: string | null
          matricule: string | null
          receivable_account_id: string | null
          registration_date: string | null
          remaining: number | null
          school_id: string | null
          school_year_id: string | null
          ssyl_id: string | null
          status: string | null
          student_firstname: string | null
          student_id: string | null
          student_lastname: string | null
          student_name: string | null
          student_sex: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_school_year_loggings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_year_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_recent_ledger_payments"
            referencedColumns: ["student_id"]
          },
        ]
      }
      v_school_recovery: {
        Row: {
          billed_total: number | null
          collected_total: number | null
          debute_count: number | null
          impaye_count: number | null
          recovery_pct: number | null
          remaining_total: number | null
          school_id: string | null
          school_year_id: string | null
          solde_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_accounts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_accounts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "ledger_accounts_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_accounts_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_year_id"]
          },
        ]
      }
      v_school_treasury: {
        Row: {
          bank_balance: number | null
          cash_balance: number | null
          currency: string | null
          momo_pending_balance: number | null
          momo_settled_balance: number | null
          school_id: string | null
          total_treasury: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_accounts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_accounts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
        ]
      }
      v_school_treasury_by_year: {
        Row: {
          bank_collected: number | null
          cash_collected: number | null
          momo_pending_collected: number | null
          momo_settled_collected: number | null
          school_id: string | null
          school_year_id: string | null
          total_collected: number | null
          tx_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_transactions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_transactions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "ledger_transactions_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_transactions_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_year_id"]
          },
        ]
      }
      v_ssyl_installment_status: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          category: string | null
          due_date: string | null
          installment_id: string | null
          label: string | null
          ssyl_id: string | null
          status: string | null
        }
        Relationships: []
      }
      v_student_receivable: {
        Row: {
          currency: string | null
          receivable_balance: number | null
          school_id: string | null
          school_year_id: string | null
          student_ssyl_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_accounts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_accounts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "ledger_accounts_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_accounts_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_year_id"]
          },
          {
            foreignKeyName: "ledger_accounts_student_ssyl_id_fkey"
            columns: ["student_ssyl_id"]
            isOneToOne: false
            referencedRelation: "student_school_year_loggings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_accounts_student_ssyl_id_fkey"
            columns: ["student_ssyl_id"]
            isOneToOne: false
            referencedRelation: "v_recent_enrollments"
            referencedColumns: ["ssyl_id"]
          },
          {
            foreignKeyName: "ledger_accounts_student_ssyl_id_fkey"
            columns: ["student_ssyl_id"]
            isOneToOne: false
            referencedRelation: "v_recent_ledger_payments"
            referencedColumns: ["ssyl_id"]
          },
          {
            foreignKeyName: "ledger_accounts_student_ssyl_id_fkey"
            columns: ["student_ssyl_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_students"
            referencedColumns: ["ssyl_id"]
          },
          {
            foreignKeyName: "ledger_accounts_student_ssyl_id_fkey"
            columns: ["student_ssyl_id"]
            isOneToOne: false
            referencedRelation: "v_ssyl_installment_status"
            referencedColumns: ["ssyl_id"]
          },
          {
            foreignKeyName: "ledger_accounts_student_ssyl_id_fkey"
            columns: ["student_ssyl_id"]
            isOneToOne: false
            referencedRelation: "v_year_advancement_preview"
            referencedColumns: ["from_ssyl_id"]
          },
        ]
      }
      v_year_advancement_preview: {
        Row: {
          avg_yearly_grade: number | null
          from_classroom_id: string | null
          from_classroom_name: string | null
          from_level_id: string | null
          from_level_name: string | null
          from_level_order: number | null
          from_ssyl_id: string | null
          from_year_id: string | null
          matricule: string | null
          school_id: string | null
          student_id: string | null
          student_name: string | null
          suggested_level_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classrooms_level_id_fkey"
            columns: ["from_level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classrooms_level_id_fkey"
            columns: ["from_level_id"]
            isOneToOne: false
            referencedRelation: "v_fees_overview_matrix"
            referencedColumns: ["level_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_classroom_id_fkey"
            columns: ["from_classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_classroom_id_fkey"
            columns: ["from_classroom_id"]
            isOneToOne: false
            referencedRelation: "v_period_closure_overview"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_classroom_id_fkey"
            columns: ["from_classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_class_summary"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_classroom_id_fkey"
            columns: ["from_classroom_id"]
            isOneToOne: false
            referencedRelation: "v_recovery_students"
            referencedColumns: ["classroom_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_year_id_fkey"
            columns: ["from_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_school_year_id_fkey"
            columns: ["from_year_id"]
            isOneToOne: false
            referencedRelation: "v_pedagogy_setup_status"
            referencedColumns: ["school_year_id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_year_loggings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_recent_ledger_payments"
            referencedColumns: ["student_id"]
          },
        ]
      }
    }
    Functions: {
      advance_bulletin_status: {
        Args: {
          p_actor_id: string
          p_bulletin_id: string
          p_reason?: string
          p_target_status: string
        }
        Returns: string
      }
      allocate_payment_to_installments: {
        Args: { p_amount: number; p_payment_tx_id: string; p_ssyl_id: string }
        Returns: Json
      }
      apply_level_fees_to_classrooms: {
        Args: { p_level_id: string; p_student_type_id?: string }
        Returns: number
      }
      bulk_advance_year: { Args: { payload: Json }; Returns: Json }
      close_period_for_classrooms: {
        Args: {
          p_actor_id: string
          p_classroom_ids: string[]
          p_end_date?: string
          p_periode_id: string
        }
        Returns: number
      }
      compute_annual_average: {
        Args: { p_bulletin_id: string }
        Returns: number
      }
      compute_bulletin:
        | {
            Args: { p_classroom_id: number; p_periode_id: string }
            Returns: undefined
          }
        | {
            Args: { p_classroom_id: string; p_periode_id: string }
            Returns: undefined
          }
      copy_fees_between_student_types: {
        Args: {
          p_level_id: string
          p_source_type_id: string
          p_target_type_id: string
        }
        Returns: number
      }
      enroll_new_student: { Args: { payload: Json }; Returns: Json }
      finalize_year_advancement: {
        Args: {
          p_from_year_id: string
          p_school_id: string
          p_to_year_id: string
        }
        Returns: Json
      }
      generate_default_periodes: {
        Args: { p_school_year_id: string }
        Returns: number
      }
      get_parent_family_ids: { Args: never; Returns: string[] }
      get_parent_school_id: { Args: never; Returns: string }
      get_parent_student_ids: { Args: never; Returns: string[] }
      get_school_staff_school_id: { Args: never; Returns: string }
      get_user_school_context: {
        Args: { p_requested_school_id?: string; p_requested_year_id?: string }
        Returns: Json
      }
      hydrate_fees_from_school_template: {
        Args: { p_school_id: string }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      is_school_staff: { Args: never; Returns: boolean }
      ledger_is_balanced: { Args: { p_tx: string }; Returns: boolean }
      ledger_post_transaction: {
        Args: {
          p_entries: Json
          p_external_ref: string
          p_memo: string
          p_occurred_at: string
          p_ref_id: string
          p_ref_type: string
          p_school_id: string
          p_school_year_id: string
          p_source: Database["public"]["Enums"]["ledger_source"]
        }
        Returns: string
      }
      ledger_reverse_transaction: {
        Args: { p_memo: string; p_tx_id: string }
        Returns: string
      }
      next_matricule: {
        Args: { p_school_id: string; p_school_year_id: string }
        Returns: string
      }
      record_student_payment: {
        Args: {
          p_amount: number
          p_memo?: string
          p_occurred_at?: string
          p_source: Database["public"]["Enums"]["ledger_source"]
          p_ssyl_id: string
        }
        Returns: string
      }
      reenroll_student: { Args: { payload: Json }; Returns: Json }
      save_class_transitions: {
        Args: {
          p_entries: Json
          p_from_year_id: string
          p_school_id: string
          p_to_year_id: string
        }
        Returns: Json
      }
      seed_pedagogy_for_school: {
        Args: { p_cycle_code: string; p_school_id: string }
        Returns: number
      }
      seed_structure_for_school: {
        Args: { p_school_id: string; p_template_key: string }
        Returns: number
      }
    }
    Enums: {
      ledger_account_kind:
        | "student_receivable"
        | "school_cash"
        | "school_bank"
        | "momo_pending"
        | "momo_settled"
        | "revenue_registration"
        | "revenue_school_fees"
        | "revenue_annex"
        | "discount"
        | "commission_lambano"
        | "commission_payable"
        | "writeoff"
      ledger_direction: "debit" | "credit"
      ledger_source:
        | "cash"
        | "momo"
        | "bank_transfer"
        | "internal"
        | "reversal"
        | "opening_balance"
      ledger_tx_status: "draft" | "posted"
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
      ledger_account_kind: [
        "student_receivable",
        "school_cash",
        "school_bank",
        "momo_pending",
        "momo_settled",
        "revenue_registration",
        "revenue_school_fees",
        "revenue_annex",
        "discount",
        "commission_lambano",
        "commission_payable",
        "writeoff",
      ],
      ledger_direction: ["debit", "credit"],
      ledger_source: [
        "cash",
        "momo",
        "bank_transfer",
        "internal",
        "reversal",
        "opening_balance",
      ],
      ledger_tx_status: ["draft", "posted"],
    },
  },
} as const
