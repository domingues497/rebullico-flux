// Local types to override outdated Supabase types until they are regenerated

export interface Settings {
  id: string;
  created_at: string;
  updated_at: string;
  store_name: string;
  store_cnpj: string | null;
  store_address: string | null;
  store_phone: string | null;
  store_email: string | null;
  enable_rounding_to_05: boolean | null;
  allow_price_edit_seller: boolean | null;
  auto_print_receipt: boolean | null;
  receipt_footer: string | null;
  default_tax_rate: number | null;
  currency_symbol: string | null;
  low_stock_alert: boolean | null;
  low_stock_threshold: number | null;
  auto_update_stock: boolean | null;
  track_inventory: boolean | null;
  auto_backup: boolean | null;
  backup_frequency_days: number | null;
  theme: string | null;
  language: string | null;
}

export type SettingsUpdate = Partial<Omit<Settings, 'id' | 'created_at' | 'updated_at'>>;
