import { useEffect, useState } from 'react';

interface ReadyAlertProps {
  /** Whether the customer's own order is currently READY. */
  isReady: boolean;
  orderNumber: string;
}

type PermissionValue = NotificationPermission | 'unsupported';

function currentPermission(): PermissionValue {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

/**
 * "Enable ready alert" button. Requests Notification permission only on an
 * explicit tap (never automatically). All APIs are feature-detected; WhatsApp
 * remains the primary channel, so this is purely a bonus.
 */
export function ReadyAlert({ isReady, orderNumber }: ReadyAlertProps) {
  const [permission, setPermission] = useState<PermissionValue>(() => currentPermission());

  useEffect(() => {
    setPermission(currentPermission());
  }, []);

  const request = async () => {
    if (typeof Notification === 'undefined') {
      setPermission('unsupported');
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } catch {
      setPermission(currentPermission());
    }
  };

  if (isReady) return null;
  if (permission === 'unsupported') return null;

  if (permission === 'granted') {
    return (
      <p className="text-center text-sm font-medium text-ready">
        Ready alerts are on. We will notify you when {orderNumber} is ready.
      </p>
    );
  }

  if (permission === 'denied') {
    return (
      <p className="text-center text-sm text-mocha">
        Notifications are blocked. Keep this page open. You will still get a WhatsApp message.
      </p>
    );
  }

  return (
    <button type="button" onClick={request} className="btn btn-secondary btn-lg w-full">
      Enable ready alert
    </button>
  );
}

export default ReadyAlert;
