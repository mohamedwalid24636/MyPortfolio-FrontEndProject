import { useCallback, useEffect, useState } from "react";

export interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  reload: () => void;
}

/**
 * Runs an abortable async task whenever `deps` (or a manual reload) change.
 *
 * The task receives an AbortSignal so in-flight requests are cancelled when the
 * component unmounts or the inputs change, avoiding state updates after unmount
 * and wasted network traffic while typing in search boxes.
 */
export function useAsync<T>(task: (signal: AbortSignal) => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    setIsLoading(true);
    setError(null);

    task(controller.signal)
      .then((result) => {
        if (!isActive) return;
        setData(result);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted || !isActive) return;
        setError(cause instanceof Error ? cause : new Error("Something went wrong."));
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return { data, error, isLoading, reload };
}
