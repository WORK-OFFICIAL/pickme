import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Officer {
  id: string;
  name: string;
  mobile: string;
  telegram_id?: string;
  whatsapp_id?: string;
  email?: string;
  status: 'Active' | 'Suspended' | 'Inactive';
  department?: string;
  rank?: string;
  badge_number?: string;
  registered_on: string;
  last_active?: string;
  credits_remaining: number;
  total_credits: number;
  total_queries: number;
  pro_access_enabled: boolean;
  rate_limit_per_hour: number;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface QueryRequest {
  id: string;
  officer_id: string;
  type: 'OSINT' | 'PRO';
  input: string;
  source: string;
  result_summary?: string;
  credits_used: number;
  status: 'Pending' | 'Processing' | 'Success' | 'Failed';
  response_time_ms?: number;
  error_message?: string;
  session_id?: string;
  platform?: 'telegram' | 'whatsapp' | 'api';
  created_at: string;
  completed_at?: string;
}

export interface CreditTransaction {
  id: string;
  officer_id: string;
  action: 'Renewal' | 'Deduction' | 'Top-up' | 'Refund' | 'Adjustment';
  credits: number;
  previous_balance: number;
  new_balance: number;
  payment_mode?: string;
  payment_reference?: string;
  remarks?: string;
  processed_by?: string;
  created_at: string;
}

export interface OfficerRegistrationRequest {
  id: string;
  name: string;
  email: string;
  mobile: string;
  station: string;
  department?: string;
  rank?: string;
  badge_number?: string;
  additional_info?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}