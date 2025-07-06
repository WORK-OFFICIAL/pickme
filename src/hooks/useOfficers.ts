import { useState, useEffect } from 'react';
import { OfficerService } from '../services/officerService';
import { useAuth } from '../contexts/AuthContext';
import type { Officer } from '../lib/supabase';

// Mock data for demo purposes
const generateMockOfficers = (): Officer[] => {
  return [
    {
      id: 'demo-1',
      name: 'Inspector Ramesh Kumar',
      mobile: '+91 9791103607',
      telegram_id: '@rameshcop',
      status: 'Active',
      registered_on: '2025-06-20',
      last_active: '2025-06-28 15:22',
      credits_remaining: 32,
      total_credits: 50,
      total_queries: 146,
      pro_access_enabled: true,
      rate_limit_per_hour: 100,
      created_at: '2025-06-20T00:00:00Z',
      updated_at: '2025-06-28T15:22:00Z'
    },
    {
      id: 'demo-2',
      name: 'ASI Priya Sharma',
      mobile: '+91 9876543210',
      telegram_id: '@priyacop',
      status: 'Active',
      registered_on: '2025-06-15',
      last_active: '2025-06-28 14:45',
      credits_remaining: 45,
      total_credits: 50,
      total_queries: 89,
      pro_access_enabled: true,
      rate_limit_per_hour: 100,
      created_at: '2025-06-15T00:00:00Z',
      updated_at: '2025-06-28T14:45:00Z'
    },
    {
      id: 'demo-3',
      name: 'SI Rajesh Patel',
      mobile: '+91 9123456789',
      telegram_id: '@rajeshcop',
      status: 'Suspended',
      registered_on: '2025-06-10',
      last_active: '2025-06-25 10:30',
      credits_remaining: 12,
      total_credits: 50,
      total_queries: 203,
      pro_access_enabled: true,
      rate_limit_per_hour: 100,
      created_at: '2025-06-10T00:00:00Z',
      updated_at: '2025-06-25T10:30:00Z'
    },
    {
      id: 'demo-4',
      name: 'Constable Anita Singh',
      mobile: '+91 9987654321',
      telegram_id: '@anitacop',
      status: 'Active',
      registered_on: '2025-06-22',
      last_active: '2025-06-28 16:10',
      credits_remaining: 38,
      total_credits: 50,
      total_queries: 67,
      pro_access_enabled: true,
      rate_limit_per_hour: 100,
      created_at: '2025-06-22T00:00:00Z',
      updated_at: '2025-06-28T16:10:00Z'
    }
  ];
};

export const useOfficers = () => {
  const { isAuthenticated } = useAuth();
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOfficers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (isAuthenticated) {
        // Fetch real data from database
        const data = await OfficerService.getOfficers();
        
        // If no real data exists, show demo data
        if (data.length === 0) {
          setOfficers(generateMockOfficers());
        } else {
          setOfficers(data);
        }
      } else {
        // Show demo data for non-authenticated users
        setOfficers(generateMockOfficers());
      }
    } catch (err) {
      console.error('Error fetching officers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch officers');
      // Fallback to demo data on error
      setOfficers(generateMockOfficers());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, [isAuthenticated]);

  const addOfficer = async (officerData: Omit<Officer, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (isAuthenticated) {
        // Add to database
        const newOfficer = await OfficerService.createOfficer(officerData);
        setOfficers(prev => [newOfficer, ...prev]);
        return newOfficer;
      } else {
        // Add to demo data
        const newOfficer: Officer = {
          ...officerData,
          id: `demo-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setOfficers(prev => [newOfficer, ...prev]);
        return newOfficer;
      }
    } catch (err) {
      console.error('Error adding officer:', err);
      throw err;
    }
  };

  const updateOfficer = async (id: string, updates: Partial<Officer>) => {
    try {
      if (isAuthenticated) {
        // Update in database
        const updatedOfficer = await OfficerService.updateOfficer(id, updates);
        setOfficers(prev => prev.map(officer => 
          officer.id === id ? updatedOfficer : officer
        ));
        return updatedOfficer;
      } else {
        // Update demo data
        const updatedOfficer = { ...officers.find(o => o.id === id)!, ...updates };
        setOfficers(prev => prev.map(officer => 
          officer.id === id ? updatedOfficer : officer
        ));
        return updatedOfficer;
      }
    } catch (err) {
      console.error('Error updating officer:', err);
      throw err;
    }
  };

  const deleteOfficer = async (id: string) => {
    try {
      if (isAuthenticated) {
        // Delete from database
        await OfficerService.deleteOfficer(id);
      }
      // Remove from local state (works for both real and demo data)
      setOfficers(prev => prev.filter(officer => officer.id !== id));
    } catch (err) {
      console.error('Error deleting officer:', err);
      throw err;
    }
  };

  const updateOfficerStatus = async (id: string, status: 'Active' | 'Suspended' | 'Inactive') => {
    return updateOfficer(id, { status });
  };

  return {
    officers,
    isLoading,
    error,
    addOfficer,
    updateOfficer,
    deleteOfficer,
    updateOfficerStatus,
    refetch: fetchOfficers
  };
};