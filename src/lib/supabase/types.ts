export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: "BOARD" | "HOD" | "MEMBER" | "APPLICANT";
          department_id: string | null;
          avatar_url: string | null;
          bio: string | null;
          skills: Json;
          status: "ACTIVE" | "INACTIVE" | "ALUMNI";
          freelance_ready: boolean;
          join_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          role?: "BOARD" | "HOD" | "MEMBER" | "APPLICANT";
          department_id?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          skills?: Json;
          status?: "ACTIVE" | "INACTIVE" | "ALUMNI";
          freelance_ready?: boolean;
          join_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          role?: "BOARD" | "HOD" | "MEMBER" | "APPLICANT";
          department_id?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          skills?: Json;
          status?: "ACTIVE" | "INACTIVE" | "ALUMNI";
          freelance_ready?: boolean;
          join_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      departments: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          icon: string | null;
          hod_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description: string;
          icon?: string | null;
          hod_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string;
          icon?: string | null;
          hod_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      board_seats: {
        Row: {
          id: string;
          title: string;
          user_id: string;
          order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          user_id: string;
          order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          user_id?: string;
          order?: number;
          created_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          start_time: string;
          end_time: string;
          location: string;
          department_id: string | null;
          recurrence_rule: string | null;
          check_in_code: string;
          created_by_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          start_time: string;
          end_time: string;
          location: string;
          department_id?: string | null;
          recurrence_rule?: string | null;
          check_in_code?: string;
          created_by_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          start_time?: string;
          end_time?: string;
          location?: string;
          department_id?: string | null;
          recurrence_rule?: string | null;
          check_in_code?: string;
          created_by_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      rsvps: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          status: "GOING" | "MAYBE" | "DECLINED";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          status?: "GOING" | "MAYBE" | "DECLINED";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          status?: "GOING" | "MAYBE" | "DECLINED";
          created_at?: string;
          updated_at?: string;
        };
      };
      attendance_records: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          checked_in_at: string;
          method: "QR" | "CODE" | "MANUAL";
          status: "PRESENT" | "ABSENT" | "EXCUSED";
          justification: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          checked_in_at?: string;
          method?: "QR" | "CODE" | "MANUAL";
          status?: "PRESENT" | "ABSENT" | "EXCUSED";
          justification?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          checked_in_at?: string;
          method?: "QR" | "CODE" | "MANUAL";
          status?: "PRESENT" | "ABSENT" | "EXCUSED";
          justification?: string | null;
          created_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          department_id: string;
          assignee_id: string | null;
          created_by_id: string;
          status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
          priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          department_id: string;
          assignee_id?: string | null;
          created_by_id: string;
          status?: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
          priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          department_id?: string;
          assignee_id?: string | null;
          created_by_id?: string;
          status?: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
          priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      task_comments: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
          body?: string;
          created_at?: string;
        };
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          body: string;
          scope: "CLUB" | "DEPARTMENT";
          department_id: string | null;
          author_id: string;
          is_pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body: string;
          scope?: "CLUB" | "DEPARTMENT";
          department_id?: string | null;
          author_id: string;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          body?: string;
          scope?: "CLUB" | "DEPARTMENT";
          department_id?: string | null;
          author_id?: string;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      applications: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          department_preference: string;
          motivation: string;
          portfolio_link: string | null;
          status: "PENDING" | "ACCEPTED" | "REJECTED";
          reviewer_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          department_preference: string;
          motivation: string;
          portfolio_link?: string | null;
          status?: "PENDING" | "ACCEPTED" | "REJECTED";
          reviewer_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          department_preference?: string;
          motivation?: string;
          portfolio_link?: string | null;
          status?: "PENDING" | "ACCEPTED" | "REJECTED";
          reviewer_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          details: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          details: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          details?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_board: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
};
