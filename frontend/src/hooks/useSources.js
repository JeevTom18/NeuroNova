/** Hook for source health polling */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

export default function useSources(pollInterval = 8000) {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSources = useCallback(async () => {
    try {
      const data = await api.sources();
      setSources(data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch sources');
      console.error('Sources fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
    const interval = setInterval(fetchSources, pollInterval);
    return () => clearInterval(interval);
  }, [fetchSources, pollInterval]);

  const getSource = useCallback((name) => {
    return sources.find(s => s.source_name === name) || null;
  }, [sources]);

  return { sources, loading, error, refetch: fetchSources, getSource };
}