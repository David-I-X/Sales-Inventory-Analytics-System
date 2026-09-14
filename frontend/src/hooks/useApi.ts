import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useApi<T>(endpoint: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!endpoint);

  const fetchData = useCallback(async () => {
    if (!endpoint) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await api.get<T>(endpoint);
      setData(result);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (endpoint !== null) {
      fetchData();
    }
  }, [fetchData, endpoint]);

  return {
    data,
    error,
    isLoading,
    refetch: fetchData,
  };
}
