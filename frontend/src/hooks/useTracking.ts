import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, getTracking } from '../services/api';
import type { TrackResponse } from '../types/order';
import { TRACKING_POLL_INTERVAL_MS } from '../config/constants';
import { usePageVisibility } from './usePageVisibility';
import type { ConnectionState } from './useOrderPolling';

export interface UseTrackingResult {
  data: TrackResponse | null;
  connection: ConnectionState;
  lastUpdated: Date | null;
  /** True when the backend returned 404 (invalid tracking link). */
  invalid: boolean;
}

/**
 * Polls GET /api/track/{token} every ~3s with no-overlap, visibility-pause and
 * auto-reconnect. Stops permanently once the link is found to be invalid (404).
 */
export function useTracking(
  token: string,
  intervalMs: number = TRACKING_POLL_INTERVAL_MS,
): UseTrackingResult {
  const [data, setData] = useState<TrackResponse | null>(null);
  const [connection, setConnection] = useState<ConnectionState>('connecting');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [invalid, setInvalid] = useState(false);

  const inFlight = useRef(false);
  const invalidRef = useRef(false);
  const mounted = useRef(true);
  const visible = usePageVisibility();

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const tick = useCallback(async () => {
    if (inFlight.current || invalidRef.current || !token) return;
    inFlight.current = true;
    try {
      const res = await getTracking(token);
      if (!mounted.current) return;
      setData(res);
      setLastUpdated(new Date());
      setConnection('connected');
    } catch (err) {
      if (!mounted.current) return;
      if (err instanceof ApiError && err.status === 404) {
        invalidRef.current = true;
        setInvalid(true);
        setConnection('connected');
      } else {
        setConnection('interrupted');
      }
    } finally {
      inFlight.current = false;
    }
  }, [token]);

  useEffect(() => {
    if (!visible || invalid) return;
    void tick();
    const id = window.setInterval(() => {
      void tick();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [visible, invalid, intervalMs, tick]);

  return { data, connection, lastUpdated, invalid };
}
