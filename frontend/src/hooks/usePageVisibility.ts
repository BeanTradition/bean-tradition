import { useEffect, useState } from 'react';

/**
 * Returns true while the tab is visible. Used to pause polling when the
 * staff/customer switches away, saving battery and mobile data.
 */
export function usePageVisibility(): boolean {
  const [visible, setVisible] = useState<boolean>(() =>
    typeof document === 'undefined' ? true : !document.hidden,
  );

  useEffect(() => {
    const handler = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  return visible;
}
