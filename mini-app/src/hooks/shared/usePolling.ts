import { useState, useEffect, useRef } from 'react';

export function usePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs: number,
  enabled?: boolean,
): {
  data?: T;
  error?: string;
  isPolling: boolean;
} {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isPolling, setIsPolling] = useState(false);
  const savedFetcher = useRef(fetcher);

  // Keep the fetcher ref current without restarting the interval
  savedFetcher.current = fetcher;

  useEffect(() => {
    if (enabled === false) {
      setIsPolling(false);
      return;
    }

    const tick = async () => {
      try {
        const result = await savedFetcher.current();
        setData(result);
        setError(undefined);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'An unknown error occurred';
        setError(message);
      }
    };

    // Immediate first fetch
    tick();

    setIsPolling(true);
    const id = setInterval(tick, intervalMs);

    return () => {
      clearInterval(id);
      setIsPolling(false);
    };
  }, [intervalMs, enabled]);

  return { data, error, isPolling };
}
