import type { ConnectionState } from '../hooks/useOrderPolling';
import { formatClock } from '../utils/format';

interface ConnectionStatusProps {
  connection: ConnectionState;
  lastUpdated: Date | null;
}

/**
 * Shows live polling health: "Last updated hh:mm:ss" when connected, or a
 * reconnecting notice when the connection is interrupted.
 */
export function ConnectionStatus({ connection, lastUpdated }: ConnectionStatusProps) {
  if (connection === 'interrupted') {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-cancelled">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cancelled" />
        Connection interrupted. Reconnecting…
      </span>
    );
  }

  if (connection === 'connecting' && !lastUpdated) {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-mocha">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-preparing" />
        Connecting…
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-mocha">
      <span className="h-2.5 w-2.5 rounded-full bg-ready" />
      Last updated {lastUpdated ? formatClock(lastUpdated) : '--'}
    </span>
  );
}

export default ConnectionStatus;
