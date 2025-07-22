import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          role: 'client' | 'admin' | 'root';
          balance_ils: number;
          first_name: string;
          last_name: string;
          phone: string | null;
          status: string;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          role?: 'client' | 'admin' | 'root';
          balance_ils?: number;
          first_name: string;
          last_name: string;
          phone?: string | null;
          status?: string;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          role?: 'client' | 'admin' | 'root';
          balance_ils?: number;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          status?: string;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      crypto_deposits: {
        Row: {
          id: string;
          user_id: string;
          crypto_type: 'BTC' | 'ETH' | 'USDT_ERC20' | 'USDT_TRC20';
          crypto_amount: number;
          wallet_address: string;
          transaction_hash: string | null;
          ils_amount: number;
          exchange_rate: number;
          status: 'pending' | 'confirmed' | 'rejected';
          validated_by: string | null;
          validated_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          crypto_type: 'BTC' | 'ETH' | 'USDT_ERC20' | 'USDT_TRC20';
          crypto_amount: number;
          wallet_address: string;
          transaction_hash?: string | null;
          ils_amount: number;
          exchange_rate: number;
          status?: 'pending' | 'confirmed' | 'rejected';
          validated_by?: string | null;
          validated_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          crypto_type?: 'BTC' | 'ETH' | 'USDT_ERC20' | 'USDT_TRC20';
          crypto_amount?: number;
          wallet_address?: string;
          transaction_hash?: string | null;
          ils_amount?: number;
          exchange_rate?: number;
          status?: 'pending' | 'confirmed' | 'rejected';
          validated_by?: string | null;
          validated_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      draws: {
        Row: {
          id: string;
          draw_date: string;
          winning_numbers: number[] | null;
          jackpot_amount: number;
          total_tickets: number;
          status: 'scheduled' | 'active' | 'completed' | 'cancelled';
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          draw_date: string;
          winning_numbers?: number[] | null;
          jackpot_amount?: number;
          total_tickets?: number;
          status?: 'scheduled' | 'active' | 'completed' | 'cancelled';
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          draw_date?: string;
          winning_numbers?: number[] | null;
          jackpot_amount?: number;
          total_tickets?: number;
          status?: 'scheduled' | 'active' | 'completed' | 'cancelled';
          created_by?: string | null;
          created_at?: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          user_id: string;
          draw_id: string;
          numbers: number[];
          cost_ils: number;
          matches: number;
          winning_amount: number;
          is_winner: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          draw_id: string;
          numbers: number[];
          cost_ils?: number;
          matches?: number;
          winning_amount?: number;
          is_winner?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          draw_id?: string;
          numbers?: number[];
          cost_ils?: number;
          matches?: number;
          winning_amount?: number;
          is_winner?: boolean;
          created_at?: string;
        };
      };
    };
  };
}