import { SupabaseClient } from '@supabase/supabase-js';

// TEMPLATE: Replace with clinic-specific table names and schema
const DB_CONFIG = {
  consultationsTable: 'consultations',
  storageTable: 'files'
};

export interface StorageConfig {
  supabase: SupabaseClient;
}

export interface Consultation {
  id?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

let _supabase: SupabaseClient;

export function initialize(config: StorageConfig) {
  _supabase = config.supabase;
}

/**
 * Create a new consultation record
 */
export async function createConsultation(data: any): Promise<Consultation> {
  const { data: consultation, error } = await _supabase
    .from(DB_CONFIG.consultationsTable)
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return consultation;
}

/**
 * Update an existing consultation record
 */
export async function updateConsultation(id: number, data: any): Promise<Consultation> {
  const { data: consultation, error } = await _supabase
    .from(DB_CONFIG.consultationsTable)
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return consultation;
}

/**
 * Get a consultation by ID
 */
export async function getConsultationById(id: number): Promise<Consultation | null> {
  const { data: consultation, error } = await _supabase
    .from(DB_CONFIG.consultationsTable)
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return consultation;
}

/**
 * List consultations with pagination
 */
export async function listConsultations(page: number = 1, limit: number = 10): Promise<Consultation[]> {
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  const { data: consultations, error } = await _supabase
    .from(DB_CONFIG.consultationsTable)
    .select('*')
    .order('created_at', { ascending: false })
    .range(start, end);

  if (error) throw error;
  return consultations;
}

// Export all functions
export default {
  initialize,
  createConsultation,
  updateConsultation,
  getConsultationById,
  listConsultations
};