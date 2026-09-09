/**
 * Hand-written types mirroring supabase/migrations/0001_init.sql.
 *
 * Once a real Supabase project exists, prefer regenerating this file with:
 *   npx supabase gen types typescript --project-id <project-ref> > src/types/database.ts
 * and reconcile any drift with this file.
 */

export type InboxProvider = "gmail" | "outlook";
export type LeadChannel = "email" | "form" | "sms";
export type LeadStatus = "new" | "drafted" | "approved" | "sent";
export type LeadClassification = "hot" | "warm" | "cold";
export type ProfileRole = "owner" | "member";

export interface Database {
  public: {
    Tables: {
      business_config: {
        Relationships: [];
        Row: {
          id: string;
          name: string;
          tone_notes: string | null;
          service_menu: string | null;
          faqs: string | null;
          inbox_provider: InboxProvider | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          tone_notes?: string | null;
          service_menu?: string | null;
          faqs?: string | null;
          inbox_provider?: InboxProvider | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["business_config"]["Insert"]>;
      };
      profiles: {
        Relationships: [
          {
            foreignKeyName: "profiles_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "business_config";
            referencedColumns: ["id"];
          },
        ];
        Row: {
          id: string;
          business_id: string;
          full_name: string | null;
          role: ProfileRole;
          created_at: string;
        };
        Insert: {
          id: string;
          business_id: string;
          full_name?: string | null;
          role?: ProfileRole;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      inbox_connections: {
        Relationships: [
          {
            foreignKeyName: "inbox_connections_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "business_config";
            referencedColumns: ["id"];
          },
        ];
        Row: {
          id: string;
          business_id: string;
          provider: InboxProvider;
          connected_email: string | null;
          encrypted_tokens: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          provider: InboxProvider;
          connected_email?: string | null;
          encrypted_tokens: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["inbox_connections"]["Insert"]>;
      };
      leads: {
        Relationships: [
          {
            foreignKeyName: "leads_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "business_config";
            referencedColumns: ["id"];
          },
        ];
        Row: {
          id: string;
          business_id: string;
          raw_message: string;
          channel: LeadChannel;
          status: LeadStatus;
          classification: LeadClassification | null;
          intent_summary: string | null;
          draft_text: string | null;
          contact: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          raw_message: string;
          channel?: LeadChannel;
          status?: LeadStatus;
          classification?: LeadClassification | null;
          intent_summary?: string | null;
          draft_text?: string | null;
          contact?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
      };
      bookings: {
        Relationships: [
          {
            foreignKeyName: "bookings_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "business_config";
            referencedColumns: ["id"];
          },
        ];
        Row: {
          id: string;
          business_id: string;
          client_name: string;
          contact: string;
          appointment_time: string;
          reminder_sent: boolean;
          confirmed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          client_name: string;
          contact: string;
          appointment_time: string;
          reminder_sent?: boolean;
          confirmed?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_my_business_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
