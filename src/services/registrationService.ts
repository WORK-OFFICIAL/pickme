import { supabase } from '../lib/supabase';
import type { OfficerRegistrationRequest } from '../lib/supabase';

export class RegistrationService {
  // Get all registration requests
  static async getRegistrationRequests(): Promise<OfficerRegistrationRequest[]> {
    const { data, error } = await supabase
      .from('officer_registration_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching registration requests:', error);
      throw new Error('Failed to fetch registration requests');
    }

    return data || [];
  }

  // Create new registration request
  static async createRegistrationRequest(
    requestData: Omit<OfficerRegistrationRequest, 'id' | 'status' | 'created_at' | 'updated_at'>
  ): Promise<OfficerRegistrationRequest> {
    const { data, error } = await supabase
      .from('officer_registration_requests')
      .insert([requestData])
      .select()
      .single();

    if (error) {
      console.error('Error creating registration request:', error);
      throw new Error(error.message || 'Failed to create registration request');
    }

    return data;
  }

  // Approve registration request
  static async approveRegistration(id: string, approvedBy: string): Promise<OfficerRegistrationRequest> {
    const { data, error } = await supabase
      .from('officer_registration_requests')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error approving registration:', error);
      throw new Error(error.message || 'Failed to approve registration');
    }

    return data;
  }

  // Reject registration request
  static async rejectRegistration(
    id: string, 
    rejectedBy: string, 
    rejectionReason: string
  ): Promise<OfficerRegistrationRequest> {
    const { data, error } = await supabase
      .from('officer_registration_requests')
      .update({
        status: 'rejected',
        rejected_by: rejectedBy,
        rejected_at: new Date().toISOString(),
        rejection_reason: rejectionReason
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error rejecting registration:', error);
      throw new Error(error.message || 'Failed to reject registration');
    }

    return data;
  }

  // Get registration stats
  static async getRegistrationStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    const { data, error } = await supabase
      .from('officer_registration_requests')
      .select('status');

    if (error) {
      console.error('Error fetching registration stats:', error);
      return { total: 0, pending: 0, approved: 0, rejected: 0 };
    }

    const stats = data.reduce((acc, request) => {
      acc.total++;
      switch (request.status) {
        case 'pending':
          acc.pending++;
          break;
        case 'approved':
          acc.approved++;
          break;
        case 'rejected':
          acc.rejected++;
          break;
      }
      return acc;
    }, { total: 0, pending: 0, approved: 0, rejected: 0 });

    return stats;
  }
}