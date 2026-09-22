/** Hook for pipeline polling, triggering, and status management */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

export default function usePipeline() {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState({ is_running: false, stage: 'IDLE', run_id: null });
  const [lastRun, setLastRun] = useState(null);
  const [error, setError] = useState(null);

  // Poll status when running
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(async () => {
      try {
        const s = await api.pipelineStatus();
        setStatus(s);
        if (!s.is_running) {
          setIsRunning(false);
          // Fetch fresh run data
          const runs = await api.pipelineRuns({ limit: 1 });
          if (runs.length) setLastRun(runs[0]);
        }
      } catch (err) {
        console.error('Pipeline status poll failed:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const triggerRun = useCallback(async (simulateFailure = null) => {
    setError(null);
    setIsRunning(true);
    setStatus({ is_running: true, stage: 'INGESTING', run_id: null });

    try {
      const result = await api.pipelineRun(simulateFailure);
      setLastRun(result);
      setStatus({ is_running: false, stage: 'COMPLETE', run_id: result.run_id });
      return result;
    } catch (err) {
      setError(err.message || 'Pipeline run failed');
      setIsRunning(false);
      setStatus({ is_running: false, stage: 'FAILED', run_id: null });
      throw err;
    }
  }, []);

  const fetchRuns = useCallback(async (params = {}) => {
    return api.pipelineRuns(params);
  }, []);

  return {
    isRunning,
    status,
    lastRun,
    error,
    triggerRun,
    fetchRuns,
    setError,
  };
}