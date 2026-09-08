export type StandeeTheme = 
  | "luxury-dark" 
  | "clean-white" 
  | "vibrant-gradient" 
  | "warm-hospitality" 
  | "classic-google";

export interface QrStyleConfig {
  dot_color?: string;
  corner_color?: string;
  center_logo?: boolean;
}

export type QrTargetMode = 
  | "direct_google" 
  | "direct_whatsapp" 
  | "smart_filter" 
  | "custom_url";

export interface Standee {
  id: string;
  serial_code: string;
  business_name: string | null;
  google_review_url: string | null;
  whatsapp_number: string | null;
  is_active: boolean;
  scan_count: number;
  last_scanned_at: string | null;
  created_at: string;
  updated_at: string;

  // Custom Branding Suite Attributes
  logo_url?: string | null;
  theme?: StandeeTheme;
  primary_color?: string;
  accent_color?: string;
  background_color?: string;
  headline?: string;
  subheadline?: string;
  cta_text?: string;
  qr_style?: QrStyleConfig;
  qr_target_mode?: QrTargetMode;
  custom_qr_url?: string | null;
}

export interface ActivateStandeeInput {
  serial_code: string;
  pin: string;
  business_name: string;
  google_review_url: string;
  whatsapp_number: string;
}

export interface UpdateStandeeInput {
  serial_code: string;
  pin: string;
  business_name?: string;
  google_review_url?: string;
  whatsapp_number?: string;
}

export interface SaveShopDesignInput {
  pin?: string;
  serial_code: string;
  business_name: string;
  google_review_url: string;
  whatsapp_number: string;
  is_active?: boolean;
  logo_url?: string | null;
  theme?: StandeeTheme;
  primary_color?: string;
  accent_color?: string;
  background_color?: string;
  headline?: string;
  subheadline?: string;
  cta_text?: string;
  qr_target_mode?: QrTargetMode;
  custom_qr_url?: string | null;
}


export interface ActionResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

