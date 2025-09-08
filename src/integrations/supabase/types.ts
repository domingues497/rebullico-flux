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
      acquirer_fees: {
        Row: {
          bandeira: string | null
          created_at: string
          id: string
          parcelas: number
          taxa_fixa: number | null
          taxa_percentual: number | null
        }
        Insert: {
          bandeira?: string | null
          created_at?: string
          id?: string
          parcelas?: number
          taxa_fixa?: number | null
          taxa_percentual?: number | null
        }
        Update: {
          bandeira?: string | null
          created_at?: string
          id?: string
          parcelas?: number
          taxa_fixa?: number | null
          taxa_percentual?: number | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          acao: string
          created_at: string
          entidade: string
          entidade_id: string | null
          id: string
          payload: Json | null
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          entidade: string
          entidade_id?: string | null
          id?: string
          payload?: Json | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          entidade?: string
          entidade_id?: string | null
          id?: string
          payload?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      customer_groups: {
        Row: {
          created_at: string
          desconto_percentual: number | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          desconto_percentual?: number | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          desconto_percentual?: number | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          aceita_mensagens: boolean | null
          aniversario: string | null
          cpf: string | null
          created_at: string
          endereco: Json | null
          grupo_pessoas_id: string | null
          grupos_whatsapp: string | null
          id: string
          nome: string
          telefone: string | null
          whatsapp: string | null
        }
        Insert: {
          aceita_mensagens?: boolean | null
          aniversario?: string | null
          cpf?: string | null
          created_at?: string
          endereco?: Json | null
          grupo_pessoas_id?: string | null
          grupos_whatsapp?: string | null
          id?: string
          nome: string
          telefone?: string | null
          whatsapp?: string | null
        }
        Update: {
          aceita_mensagens?: boolean | null
          aniversario?: string | null
          cpf?: string | null
          created_at?: string
          endereco?: Json | null
          grupo_pessoas_id?: string | null
          grupos_whatsapp?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_grupo_pessoas_id_fkey"
            columns: ["grupo_pessoas_id"]
            isOneToOne: false
            referencedRelation: "customer_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      payables: {
        Row: {
          created_at: string
          descricao: string | null
          entry_id: string | null
          id: string
          status: Database["public"]["Enums"]["payable_status"] | null
          supplier_id: string | null
          valor: number
          vencimento: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          entry_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["payable_status"] | null
          supplier_id?: string | null
          valor: number
          vencimento: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          entry_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["payable_status"] | null
          supplier_id?: string | null
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "payables_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "stock_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payables_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          bandeira: string | null
          created_at: string
          id: string
          parcelas: number | null
          sale_id: string
          tipo: Database["public"]["Enums"]["payment_type"]
          valor: number
        }
        Insert: {
          bandeira?: string | null
          created_at?: string
          id?: string
          parcelas?: number | null
          sale_id: string
          tipo: Database["public"]["Enums"]["payment_type"]
          valor: number
        }
        Update: {
          bandeira?: string | null
          created_at?: string
          id?: string
          parcelas?: number | null
          sale_id?: string
          tipo?: Database["public"]["Enums"]["payment_type"]
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      product_groups: {
        Row: {
          created_at: string
          estoque_minimo_default: number | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          estoque_minimo_default?: number | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          estoque_minimo_default?: number | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          principal: boolean | null
          product_id: string
          url: string | null
          url_link: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          principal?: boolean | null
          product_id: string
          url?: string | null
          url_link?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          principal?: boolean | null
          product_id?: string
          url?: string | null
          url_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          cor: string | null
          created_at: string
          ean: string | null
          estoque_atual: number
          estoque_minimo: number | null
          id: string
          preco_base: number
          product_id: string
          sku: string
          tamanho: string | null
        }
        Insert: {
          cor?: string | null
          created_at?: string
          ean?: string | null
          estoque_atual?: number
          estoque_minimo?: number | null
          id?: string
          preco_base?: number
          product_id: string
          sku: string
          tamanho?: string | null
        }
        Update: {
          cor?: string | null
          created_at?: string
          ean?: string | null
          estoque_atual?: number
          estoque_minimo?: number | null
          id?: string
          preco_base?: number
          product_id?: string
          sku?: string
          tamanho?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          cod_fabricante: string | null
          cod_interno: string
          created_at: string
          descricao: string | null
          ean_default: string | null
          grupo_id: string | null
          id: string
          nome: string
        }
        Insert: {
          cod_fabricante?: string | null
          cod_interno: string
          created_at?: string
          descricao?: string | null
          ean_default?: string | null
          grupo_id?: string | null
          id?: string
          nome: string
        }
        Update: {
          cod_fabricante?: string | null
          cod_interno?: string
          created_at?: string
          descricao?: string | null
          ean_default?: string | null
          grupo_id?: string | null
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "product_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string | null
          role_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          phone?: string | null
          role_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          role_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      sale_costs: {
        Row: {
          created_at: string
          id: string
          sale_id: string
          taxa_financeira: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          sale_id: string
          taxa_financeira?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          sale_id?: string
          taxa_financeira?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_costs_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string
          desconto_item: number | null
          id: string
          preco_unit: number
          product_variant_id: string
          quantidade: number
          sale_id: string
        }
        Insert: {
          created_at?: string
          desconto_item?: number | null
          id?: string
          preco_unit: number
          product_variant_id: string
          quantidade: number
          sale_id: string
        }
        Update: {
          created_at?: string
          desconto_item?: number | null
          id?: string
          preco_unit?: number
          product_variant_id?: string
          quantidade?: number
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "v_stock_balance"
            referencedColumns: ["variant_id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          customer_id: string | null
          data: string
          desconto_total: number | null
          id: string
          observacoes: string | null
          total_bruto: number
          total_liquido: number
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          data?: string
          desconto_total?: number | null
          id?: string
          observacoes?: string | null
          total_bruto?: number
          total_liquido?: number
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          data?: string
          desconto_total?: number | null
          id?: string
          observacoes?: string | null
          total_bruto?: number
          total_liquido?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          chave: string
          created_at: string
          id: string
          updated_at: string
          valor: Json
        }
        Insert: {
          chave: string
          created_at?: string
          id?: string
          updated_at?: string
          valor: Json
        }
        Update: {
          chave?: string
          created_at?: string
          id?: string
          updated_at?: string
          valor?: Json
        }
        Relationships: []
      }
      stock_entries: {
        Row: {
          anexo_url: string | null
          created_at: string
          data: string
          id: string
          numero_nota: string | null
          supplier_id: string | null
          total: number
        }
        Insert: {
          anexo_url?: string | null
          created_at?: string
          data?: string
          id?: string
          numero_nota?: string | null
          supplier_id?: string | null
          total?: number
        }
        Update: {
          anexo_url?: string | null
          created_at?: string
          data?: string
          id?: string
          numero_nota?: string | null
          supplier_id?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_entries_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_entry_items: {
        Row: {
          created_at: string
          custo_unit: number
          entry_id: string
          id: string
          product_variant_id: string
          quantidade: number
        }
        Insert: {
          created_at?: string
          custo_unit: number
          entry_id: string
          id?: string
          product_variant_id: string
          quantidade: number
        }
        Update: {
          created_at?: string
          custo_unit?: number
          entry_id?: string
          id?: string
          product_variant_id?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_entry_items_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "stock_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_entry_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_entry_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "v_stock_balance"
            referencedColumns: ["variant_id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          observacoes: string | null
          product_variant_id: string
          quantidade: number
          tipo_movimento: Database["public"]["Enums"]["movement_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          observacoes?: string | null
          product_variant_id: string
          quantidade: number
          tipo_movimento: Database["public"]["Enums"]["movement_type"]
        }
        Update: {
          created_at?: string
          id?: string
          observacoes?: string | null
          product_variant_id?: string
          quantidade?: number
          tipo_movimento?: Database["public"]["Enums"]["movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "v_stock_balance"
            referencedColumns: ["variant_id"]
          },
        ]
      }
      suppliers: {
        Row: {
          cnpj_cpf: string | null
          contato: Json | null
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          cnpj_cpf?: string | null
          contato?: Json | null
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          cnpj_cpf?: string | null
          contato?: Json | null
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_stock_balance: {
        Row: {
          cor: string | null
          ean: string | null
          estoque_atual: number | null
          estoque_minimo: number | null
          is_low_stock: boolean | null
          preco_base: number | null
          product_name: string | null
          sku: string | null
          tamanho: string | null
          variant_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_product_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      update_stock_on_entry: {
        Args: { p_quantity: number; p_variant_id: string }
        Returns: undefined
      }
      update_stock_on_sale: {
        Args: { p_quantity: number; p_variant_id: string }
        Returns: undefined
      }
    }
    Enums: {
      movement_type: "entrada" | "saida" | "ajuste"
      payable_status: "ABERTO" | "PAGO" | "VENCIDO"
      payment_type: "PIX" | "DINHEIRO" | "CREDITO" | "DEBITO"
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
      movement_type: ["entrada", "saida", "ajuste"],
      payable_status: ["ABERTO", "PAGO", "VENCIDO"],
      payment_type: ["PIX", "DINHEIRO", "CREDITO", "DEBITO"],
    },
  },
} as const
