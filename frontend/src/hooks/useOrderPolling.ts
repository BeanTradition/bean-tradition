import { useCallback, useEffect, useRef, useState } from 'react';
import { getActiveOrders } from '../services/api';
import type { OrderPublic } from '../types/order';
import { ORDERS_POLL_INTERVAL_MS } from '../config/constants';
import { usePageVisibility } from './usePageVisibility';

export type ConnectionState = 'connecting' | 'connected' | 'interrupted';

export interface UseOrderPollingResult {
  orders: OrderPublic[];
  serverTime: string | null;
  lastUpdated: Date | null;
  connection: ConnectionState;
  /** Manual refetch (also used right after a mutation). */
  refetch: () => Promise<void>;
}

/**
 * Polls GET /api/orders/active with:
 *  - no overlapping requests (in-flight lock)
 *  - pause while the tab is hidden
 *  - automatic reconnect (interval keeps trying after a failure)
 */
export function useOrderPolling(
  intervalMs: number = ORDERS_POLL_INTERVAL_MS,
): UseOrderPollingResult {
  const [orders, setOrders] = useState<OrderPublic[]>([]);
  const [serverTime, setServerTime] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [connection, setConnection] = useState<ConnectionState>('connecting');

  const inFlight = useRef(false);
  const mounted = useRef(true);
  const visible = usePageVisibility();

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const tick = useCallback(async () => {
    if (inFlight.current) return; // No overlapping requests.
    inFlight.current = true;
    try {
      const data = await getActiveOrders();
      if (!mounted.current) return;
      setOrders(data.orders);
      setServerTime(data.server_time);
      setLastUpdated(new Date());
      setConnection('connected');
    } catch {
      if (!mounted.current) return;
      setConnection('interrupted');
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    // Fetch immediately on (re)gaining visibility, then on an interval.
    void tick();
    const id = window.setInterval(() => {
      void tick();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [visible, intervalMs, tick]);

  return { orders, serverTime, lastUpdated, connection, refetch: tick };
}
