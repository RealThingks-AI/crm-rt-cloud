export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      contacts: {
        Row: {
          annual_revenue: number | null
          city: string | null
          company_name: string | null
          contact_name: string
          contact_owner: string | null
          contact_source: string | null
          country: string | null
          created_by: string | null
          created_time: string | null
          description: string | null
          email: string | null
          id: string
          industry: string | null
          lead_status: string | null
          linkedin: string | null
          mobile_no: string | null
          modified_by: string | null
          modified_time: string | null
          no_of_employees: number | null
          phone_no: string | null
          position: string | null
          state: string | null
          website: string | null
        }
        Insert: {
          annual_revenue?: number | null
          city?: string | null
          company_name?: string | null
          contact_name: string
          contact_owner?: string | null
          contact_source?: string | null
          country?: string | null
          created_by?: string | null
          created_time?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          lead_status?: string | null
          linkedin?: string | null
          mobile_no?: string | null
          modified_by?: string | null
          modified_time?: string | null
          no_of_employees?: number | null
          phone_no?: string | null
          position?: string | null
          state?: string | null
          website?: string | null
        }
        Update: {
          annual_revenue?: number | null
          city?: string | null
          company_name?: string | null
          contact_name?: string
          contact_owner?: string | null
          contact_source?: string | null
          country?: string | null
          created_by?: string | null
          created_time?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          lead_status?: string | null
          linkedin?: string | null
          mobile_no?: string | null
          modified_by?: string | null
          modified_time?: string | null
          no_of_employees?: number | null
          phone_no?: string | null
          position?: string | null
          state?: string | null
          website?: string | null
        }
        Relationships: []
      }
      dashboard_preferences: {
        Row: {
          card_order: Json | null
          created_at: string | null
          id: string
          layout_view: string | null
          updated_at: string | null
          user_id: string
          visible_widgets: Json | null
        }
        Insert: {
          card_order?: Json | null
          created_at?: string | null
          id?: string
          layout_view?: string | null
          updated_at?: string | null
          user_id: string
          visible_widgets?: Json | null
        }
        Update: {
          card_order?: Json | null
          created_at?: string | null
          id?: string
          layout_view?: string | null
          updated_at?: string | null
          user_id?: string
          visible_widgets?: Json | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          action_items: string | null
          amount: number | null
          begin_execution_date: string | null
          budget: string | null
          budget_confirmed: string | null
          budget_holder: string | null
          business_value: string | null
          closing_date: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          currency_type: string | null
          current_status: string | null
          customer_agreed_on_need: string | null
          customer_challenges: string | null
          customer_name: string | null
          customer_need: string | null
          customer_need_identified: boolean | null
          deal_name: string
          decision_expected_date: string | null
          decision_maker_level: string | null
          decision_maker_present: boolean | null
          decision_makers: string | null
          description: string | null
          drop_reason: string | null
          duration: number | null
          end_date: string | null
          execution_started: boolean | null
          expected_closing_date: string | null
          expected_deal_timeline_end: string | null
          expected_deal_timeline_start: string | null
          id: string
          internal_comment: string | null
          internal_notes: string | null
          is_recurring: boolean | null
          lead_name: string | null
          lead_owner: string | null
          loss_reason: string | null
          lost_reason: string | null
          modified_at: string | null
          modified_by: string | null
          nda_signed: boolean | null
          need_improvement: string | null
          need_summary: string | null
          negotiation_notes: string | null
          negotiation_status: string | null
          priority: number | null
          probability: number | null
          product_service_scope: string | null
          project_name: string | null
          project_type: string | null
          proposal_sent_date: string | null
          region: string | null
          related_lead_id: string | null
          related_meeting_id: string | null
          relationship_strength: string | null
          revenue: number | null
          rfq_confirmation_note: string | null
          rfq_document_url: string | null
          rfq_value: number | null
          stage: string
          start_date: string | null
          supplier_portal_access: string | null
          supplier_portal_required: boolean | null
          timeline: string | null
          win_reason: string | null
          won_reason: string | null
        }
        Insert: {
          action_items?: string | null
          amount?: number | null
          begin_execution_date?: string | null
          budget?: string | null
          budget_confirmed?: string | null
          budget_holder?: string | null
          business_value?: string | null
          closing_date?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          currency_type?: string | null
          current_status?: string | null
          customer_agreed_on_need?: string | null
          customer_challenges?: string | null
          customer_name?: string | null
          customer_need?: string | null
          customer_need_identified?: boolean | null
          deal_name: string
          decision_expected_date?: string | null
          decision_maker_level?: string | null
          decision_maker_present?: boolean | null
          decision_makers?: string | null
          description?: string | null
          drop_reason?: string | null
          duration?: number | null
          end_date?: string | null
          execution_started?: boolean | null
          expected_closing_date?: string | null
          expected_deal_timeline_end?: string | null
          expected_deal_timeline_start?: string | null
          id?: string
          internal_comment?: string | null
          internal_notes?: string | null
          is_recurring?: boolean | null
          lead_name?: string | null
          lead_owner?: string | null
          loss_reason?: string | null
          lost_reason?: string | null
          modified_at?: string | null
          modified_by?: string | null
          nda_signed?: boolean | null
          need_improvement?: string | null
          need_summary?: string | null
          negotiation_notes?: string | null
          negotiation_status?: string | null
          priority?: number | null
          probability?: number | null
          product_service_scope?: string | null
          project_name?: string | null
          project_type?: string | null
          proposal_sent_date?: string | null
          region?: string | null
          related_lead_id?: string | null
          related_meeting_id?: string | null
          relationship_strength?: string | null
          revenue?: number | null
          rfq_confirmation_note?: string | null
          rfq_document_url?: string | null
          rfq_value?: number | null
          stage?: string
          start_date?: string | null
          supplier_portal_access?: string | null
          supplier_portal_required?: boolean | null
          timeline?: string | null
          win_reason?: string | null
          won_reason?: string | null
        }
        Update: {
          action_items?: string | null
          amount?: number | null
          begin_execution_date?: string | null
          budget?: string | null
          budget_confirmed?: string | null
          budget_holder?: string | null
          business_value?: string | null
          closing_date?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          currency_type?: string | null
          current_status?: string | null
          customer_agreed_on_need?: string | null
          customer_challenges?: string | null
          customer_name?: string | null
          customer_need?: string | null
          customer_need_identified?: boolean | null
          deal_name?: string
          decision_expected_date?: string | null
          decision_maker_level?: string | null
          decision_maker_present?: boolean | null
          decision_makers?: string | null
          description?: string | null
          drop_reason?: string | null
          duration?: number | null
          end_date?: string | null
          execution_started?: boolean | null
          expected_closing_date?: string | null
          expected_deal_timeline_end?: string | null
          expected_deal_timeline_start?: string | null
          id?: string
          internal_comment?: string | null
          internal_notes?: string | null
          is_recurring?: boolean | null
          lead_name?: string | null
          lead_owner?: string | null
          loss_reason?: string | null
          lost_reason?: string | null
          modified_at?: string | null
          modified_by?: string | null
          nda_signed?: boolean | null
          need_improvement?: string | null
          need_summary?: string | null
          negotiation_notes?: string | null
          negotiation_status?: string | null
          priority?: number | null
          probability?: number | null
          product_service_scope?: string | null
          project_name?: string | null
          project_type?: string | null
          proposal_sent_date?: string | null
          region?: string | null
          related_lead_id?: string | null
          related_meeting_id?: string | null
          relationship_strength?: string | null
          revenue?: number | null
          rfq_confirmation_note?: string | null
          rfq_document_url?: string | null
          rfq_value?: number | null
          stage?: string
          start_date?: string | null
          supplier_portal_access?: string | null
          supplier_portal_required?: boolean | null
          timeline?: string | null
          win_reason?: string | null
          won_reason?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          city: string | null
          company_name: string | null
          contact_owner: string | null
          contact_source: string | null
          country: string | null
          created_by: string | null
          created_time: string | null
          description: string | null
          email: string | null
          id: string
          industry: string | null
          lead_name: string
          lead_status: string | null
          linkedin: string | null
          mobile_no: string | null
          modified_by: string | null
          modified_time: string | null
          phone_no: string | null
          position: string | null
          website: string | null
        }
        Insert: {
          city?: string | null
          company_name?: string | null
          contact_owner?: string | null
          contact_source?: string | null
          country?: string | null
          created_by?: string | null
          created_time?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          lead_name: string
          lead_status?: string | null
          linkedin?: string | null
          mobile_no?: string | null
          modified_by?: string | null
          modified_time?: string | null
          phone_no?: string | null
          position?: string | null
          website?: string | null
        }
        Update: {
          city?: string | null
          company_name?: string | null
          contact_owner?: string | null
          contact_source?: string | null
          country?: string | null
          created_by?: string | null
          created_time?: string | null
          description?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          lead_name?: string
          lead_status?: string | null
          linkedin?: string | null
          mobile_no?: string | null
          modified_by?: string | null
          modified_time?: string | null
          phone_no?: string | null
          position?: string | null
          website?: string | null
        }
        Relationships: []
      }
      meeting_outcomes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          interested_in_deal: boolean
          meeting_id: string
          next_steps: string | null
          outcome_type: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          interested_in_deal?: boolean
          meeting_id: string
          next_steps?: string | null
          outcome_type: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          interested_in_deal?: boolean
          meeting_id?: string
          next_steps?: string | null
          outcome_type?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      meetings: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string
          description: string | null
          duration: string | null
          id: string
          location: string | null
          meeting_id: string | null
          meeting_title: string
          participants: string[] | null
          start_time: string
          teams_link: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date: string
          description?: string | null
          duration?: string | null
          id?: string
          location?: string | null
          meeting_id?: string | null
          meeting_title: string
          participants?: string[] | null
          start_time: string
          teams_link?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string | null
          duration?: string | null
          id?: string
          location?: string | null
          meeting_id?: string | null
          meeting_title?: string
          participants?: string[] | null
          start_time?: string
          teams_link?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          "Email ID": string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          "Email ID"?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          "Email ID"?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never