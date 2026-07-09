import { useState, useEffect, useCallback } from 'react';

export type AsyncState<T> = {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: T;
  error?: string;
};

export function useAsyncState<T>(
  fetcher: () => Promise<T>,
  immediate?: boolean,
): {
  state: AsyncState<T>;
  execute: () => Promise<void>;
  reset: () => void;
} {
  const [state, setState] = useState<AsyncState<T>>({ status: 'idle' });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, status: 'loading' }));
    try {
      const data = await fetcher();
      setState({ status: 'success', data });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unknown error occurred';
      setState({ status: 'error', error: message });
    }
  }, [fetcher]);

  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return { state, execute, reset };
}
