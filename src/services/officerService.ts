import { supabase } from '../lib/supabase';
import type { Officer } from '../lib/supabase';

export class OfficerService {
  // Get all officers
  static async getOfficers(): Promise<Officer[]> {
    const { data, error } = await supabase
      .from('officers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching officers:', error);
      throw new Error('Failed to fetch officers');
    }

    return data || [];
  }

  // Get officer by ID
  static async getOfficerById(id: string): Promise<Officer | null> {
    const { data, error } = await supabase
      .from('officers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching officer:', error);
      return null;
    }

    return data;
  }

  // Create new officer
  static async createOfficer(officerData: Omit<Officer, 'id' | 'created_at' | 'updated_at'>): Promise<Officer> {
    const { data, error } = await supabase
      .from('officers')
      .insert([officerData])
      .select()
      .single();

    if (error) {
      console.error('Error creating officer:', error);
      throw new Error(error.message || 'Failed to create officer');
    }

    return data;
  }

  // Update officer
  static async updateOfficer(id: string, updates: Partial<Officer>): Promise<Officer> {
    const { data, error } = await supabase
      .from('officers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating officer:', error);
      throw new Error(error.message || 'Failed to update officer');
    }

    return data;
  }

  // Delete officer
  static async deleteOfficer(id: string): Promise<void> {
    const { error } = await supabase
      .from('officers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting officer:', error);
      throw new Error(error.message || 'Failed to delete officer');
    }
  }

  // Update officer status
  static async updateOfficerStatus(id: string, status: 'Active' | 'Suspended' | 'Inactive'): Promise<Officer> {
    return this.updateOfficer(id, { status });
  }

  // Get officers count by status
  static async getOfficersStats(): Promise<{
    total: number;
    active: number;
    suspended: number;
    inactive: number;
  }> {
    const { data, error } = await supabase
      .from('officers')
      .select('status');

    if (error) {
      console.error('Error fetching officer stats:', error);
      return { total: 0, active: 0, suspended: 0, inactive: 0 };
    }

    const stats = data.reduce((acc, officer) => {
      acc.total++;
      switch (officer.status) {
        case 'Active':
          acc.active++;
          break;
        case 'Suspended':
          acc.suspended++;
          break;
        case 'Inactive':
          acc.inactive++;
          break;
      }
      return acc;
    }, { total: 0, active: 0, suspended: 0, inactive: 0 });

    return stats;
  }
}