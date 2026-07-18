export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          bp: string | null;
          adress: string | null;
          slogan: string | null;
          logo_id: number | null;
          created_by: number | null;
          cinet_pay_api_key: string | null;
          cinet_pay_site_id: string | null;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: Database['public']['Tables']['schools']['Row'];
        Update: Partial<Database['public']['Tables']['schools']['Row']>;
      };
      school_years: {
        Row: {
          id: string;
          name: string;
          date_start: string | null;
          date_end: string | null;
          created_by: number | null;
          school_id: string | null;
          school_year_id: string | null;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: Database['public']['Tables']['school_years']['Row'];
        Update: Partial<Database['public']['Tables']['school_years']['Row']>;
      };
      cycles: {
        Row: {
          id: string;
          name: string;
          order_by: number;
          school_id: string | null;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: Database['public']['Tables']['cycles']['Row'];
        Update: Partial<Database['public']['Tables']['cycles']['Row']>;
      };
      levels: {
        Row: {
          id: string;
          name: string;
          order_by: number;
          cycle_id: string | null;
          school_id: string | null;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: Database['public']['Tables']['levels']['Row'];
        Update: Partial<Database['public']['Tables']['levels']['Row']>;
      };
      classroom_types: {
        Row: {
          id: string;
          name: string | null;
          order_by: number;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: Database['public']['Tables']['classroom_types']['Row'];
        Update: Partial<Database['public']['Tables']['classroom_types']['Row']>;
      };
      classrooms: {
        Row: {
          id: string;
          name: string;
          order_by: number;
          created_by: number | null;
          level_id: string | null;
          school_id: string | null;
          school_year_id: string | null;
          type_id: string | null;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: Database['public']['Tables']['classrooms']['Row'];
        Update: Partial<Database['public']['Tables']['classrooms']['Row']>;
      };
      type_families: {
        Row: {
          id: string;
          name: string;
          order_by: number;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: Database['public']['Tables']['type_families']['Row'];
        Update: Partial<Database['public']['Tables']['type_families']['Row']>;
      };
      families: {
        Row: {
          id: string;
          code: string | null;
          firstname: string | null;
          lastname: string | null;
          address: string | null;
          email: string | null;
          job: string | null;
          phone: string | null;
          residence: string | null;
          level: number | null;
          created_by: number | null;
          school_id: string | null;
          type_id: string | null;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: Database['public']['Tables']['families']['Row'];
        Update: Partial<Database['public']['Tables']['families']['Row']>;
      };
      type_students: {
        Row: {
          id: string;
          name: string;
          created_by: number | null;
          school_id: string | null;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: Database['public']['Tables']['type_students']['Row'];
        Update: Partial<Database['public']['Tables']['type_students']['Row']>;
      };
      students: {
        Row: {
          id: string;
          matricule: string | null;
          firstname: string;
          lastname: string;
          date_of_birth: string | null;
          place_of_birth: string | null;
          sex: string | null;
          nationality: string | null;
          email: string | null;
          birth_certificate_number: string | null;
          is_registration: number;
          profil_id: string | null;
          school_id: string | null;
          father_id: string | null;
          mother_id: string | null;
          tutor_id: string | null;
          type_id: string | null;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: Database['public']['Tables']['students']['Row'];
        Update: Partial<Database['public']['Tables']['students']['Row']>;
      };
      type_paiements: {
        Row: {
          id: string;
          name: string;
          order_by: number;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: Database['public']['Tables']['type_paiements']['Row'];
        Update: Partial<Database['public']['Tables']['type_paiements']['Row']>;
      };
      classroom_school_fees: {
        Row: {
          id: string;
          name: string | null;
          registration_fees: string | null;
          additionnal_fees: string | null;
          school_fees: string | null;
          school_fees_discount: string | null;
          school_fees_net: string | null;
          total_paiement_part: string | null;
          created_by: number | null;
          classroom_id: string | null;
          school_id: string | null;
          school_year_id: string | null;
          type_student_id: string | null;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: Database['public']['Tables']['classroom_school_fees']['Row'];
        Update: Partial<Database['public']['Tables']['classroom_school_fees']['Row']>;
      };
      classroom_school_fees_by_parts: {
        Row: {
          id: string;
          name: string | null;
          amount: number;
          due_date: string | null;
          order: number;
          school_fees_id: string | null;
          type_id: string | null;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: Database['public']['Tables']['classroom_school_fees_by_parts']['Row'];
        Update: Partial<Database['public']['Tables']['classroom_school_fees_by_parts']['Row']>;
      };
      student_school_year_loggings: {
        Row: {
          id: string;
          is_first_register: number;
          repeating: number;
          paiement_status: string | null;
          eps: number;
          discount: number;
          school_fees_total: number;
          school_fees_paid: number;
          registration_fees_pay: number;
          additionnal_fees_pay: number;
          school_fees_pay: number;
          classroom_id: string | null;
          type_student_id: string | null;
          school_fees_id: string | null;
          lv2_id: string | null;
          secondary_subject_id: string | null;
          school_year_id: string | null;
          student_id: string | null;
          school_id: string | null;
          created_by: string | null;
          profil_id: string | null;
          is_not_register: number;
          solde_register: number;
          registration_date: string | null;
          is_transfer: number;
          remaining_balance_transfer: number;
          permonth_amount_tobe_received: number;
          permonth_amount_received: number;
          permonth_amount_due_date: string | null;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: Database['public']['Tables']['student_school_year_loggings']['Row'];
        Update: Partial<Database['public']['Tables']['student_school_year_loggings']['Row']>;
      };
      paiements: {
        Row: {
          id: string;
          amount: number;
          created_by: number | null;
          school_id: string | null;
          student_school_year_logging_id: string | null;
          is_discount: number;
          paiement_type: string | null;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: Database['public']['Tables']['paiements']['Row'];
        Update: Partial<Database['public']['Tables']['paiements']['Row']>;
      };
      student_paiement_by_parts: {
        Row: {
          id: string;
          pay_state: number;
          amount: number;
          part_id: string | null;
          paiement_id: string | null;
          student_school_year_logging_id: string | null;
          is_discount: number;
          created_at: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: Database['public']['Tables']['student_paiement_by_parts']['Row'];
        Update: Partial<Database['public']['Tables']['student_paiement_by_parts']['Row']>;
      };
      parent_profiles: {
        Row: {
          id: string;
          user_id: string;
          school_id: string;
          student_id: string | null;
          father_id: string | null;
          mother_id: string | null;
          tutor_id: string | null;
          phone: string | null;
          push_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['parent_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['parent_profiles']['Insert']>;
      };
      periodes: {
        Row: {
          id: string;
          school_id: string;
          school_year_id: string;
          name: string;
          type: 'trimestre' | 'semestre';
          order: number;
          start_date: string;
          end_date: string;
          is_published: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['periodes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['periodes']['Insert']>;
      };
      subject_groups: {
        Row: {
          id: string;
          school_id: string;
          name: string;
          order: number;
        };
        Insert: Omit<Database['public']['Tables']['subject_groups']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['subject_groups']['Insert']>;
      };
      subjects: {
        Row: {
          id: string;
          school_id: string;
          group_id: string;
          name: string;
          coefficient: number;
          max_score: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['subjects']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['subjects']['Insert']>;
      };
      classroom_subjects: {
        Row: {
          id: string;
          classroom_id: string;
          subject_id: string;
          teacher_id: string | null;
          coefficient_override: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['classroom_subjects']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['classroom_subjects']['Insert']>;
      };
      teacher_profiles: {
        Row: {
          id: string;
          user_id: string;
          personel_id: string | null;
          school_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['teacher_profiles']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['teacher_profiles']['Insert']>;
      };
      evaluations: {
        Row: {
          id: string;
          classroom_subject_id: string;
          periode_id: string;
          name: string;
          type: 'devoir' | 'composition' | 'examen';
          max_score: number;
          weight: number;
          date: string;
          is_published: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['evaluations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['evaluations']['Insert']>;
      };
      notes: {
        Row: {
          id: string;
          evaluation_id: string;
          student_id: string;
          score: number | null;
          is_absent: boolean;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notes']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['notes']['Insert']>;
      };
      bulletins: {
        Row: {
          id: string;
          student_id: string;
          periode_id: string;
          classroom_id: string;
          average: number | null;
          rank: number | null;
          total_students: number | null;
          general_appreciation: string | null;
          principal_appreciation: string | null;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['bulletins']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['bulletins']['Insert']>;
      };
      bulletin_subjects: {
        Row: {
          id: string;
          bulletin_id: string;
          subject_id: string;
          average: number | null;
          rank: number | null;
          min_average: number | null;
          max_average: number | null;
          class_average: number | null;
          teacher_appreciation: string | null;
        };
        Insert: Omit<Database['public']['Tables']['bulletin_subjects']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['bulletin_subjects']['Insert']>;
      };
      conversations: {
        Row: {
          id: string;
          school_id: string;
          student_id: string | null;
          is_broadcast: boolean;
          subject: string | null;
          last_message_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>;
      };
      conversation_participants: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: 'parent' | 'teacher' | 'admin';
          unread_count: number;
          last_read_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['conversation_participants']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['conversation_participants']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          file_url: string | null;
          file_name: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      timetable_slots: {
        Row: {
          id: string;
          classroom_id: string;
          classroom_subject_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          room: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['timetable_slots']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['timetable_slots']['Insert']>;
      };
      attendance_records: {
        Row: {
          id: string;
          student_id: string;
          classroom_id: string;
          date: string;
          type: 'absence' | 'retard';
          is_justified: boolean;
          reason: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['attendance_records']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['attendance_records']['Insert']>;
      };
      announcements: {
        Row: {
          id: string;
          school_id: string;
          title: string;
          content: string;
          target_type: 'school' | 'level' | 'classroom';
          target_id: string | null;
          author_id: string;
          published_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['announcements']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['announcements']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          is_read: boolean;
          data: Json | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      admin_profiles: {
        Row: {
          id: string;
          user_id: string;
          role: 'admin' | 'superadmin';
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['admin_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['admin_profiles']['Insert']>;
      };
    };
    Functions: {
      get_parent_school_id: { Args: Record<string, never>; Returns: string };
      get_parent_student_ids: { Args: Record<string, never>; Returns: string[] };
      get_parent_family_ids: { Args: Record<string, never>; Returns: string[] };
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
