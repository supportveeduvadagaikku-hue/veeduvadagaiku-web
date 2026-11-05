import { useQuery } from '@tanstack/react-query';
import { propertyService } from '../services/property.service';
import { PropertyFilters } from '../types';
import { CHENNAI_LOCALITIES } from '../utils/chennaiLocalities';

export const useProperties = (filters: PropertyFilters = {}) => {
  return useQuery({
    queryKey: ['properties', filters],
    queryFn: () => propertyService.getProperties(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes freshness: instant rendering on back-navigation
    gcTime: 30 * 60 * 1000,    // 30 minutes cache retention
    refetchOnWindowFocus: false, // Don't trigger slow re-renders when tapping outside browser
    refetchOnMount: false,       // Don't refetch if data is already in cache
    placeholderData: (previousData) => previousData, // Never show blank screen while refreshing
  });
};

export const useProperty = (id: string) => {
  return useQuery({
    queryKey: ['property', id],
    queryFn: () => propertyService.getPropertyById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useLocalities = () => {
  return useQuery<string[]>({
    queryKey: ['localities'],
    queryFn: async () => {
      try {
        const res = await propertyService.getLocalities();
        const data = res?.data;
        if (Array.isArray(data) && data.length > 0) {
          // Normalize any en-dash to hyphen
          return data.map((item) => item.replace(/\s*–\s*/g, ' - '));
        }
      } catch (err) {
        console.warn('Using local CHENNAI_LOCALITIES fallback:', err);
      }
      return CHENNAI_LOCALITIES;
    },
    initialData: CHENNAI_LOCALITIES,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
};
