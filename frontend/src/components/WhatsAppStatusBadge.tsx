import type { MessageStatus } from '../types/order';

interface WhatsAppStatusBadgeProps {
  status: MessageStatus;
  label?: string;
  error?: string | null;
}

const STYLES: Record<MessageStatus, { text: string; cls: string }> = {
  NOT_SENT: { text: 'Not sent', cls: 'bg-latte text-mocha' },
  SEND_PENDING: { text: 'Sending…', cls: 'bg-preparing/20 text-preparing' },
  SENT: { text: 'Sent', cls: 'bg-received/15 text-received' },
  DELIVERED: { text: 'Delivered', cls: 'bg-ready/15 text-ready' },
  READ: { text: 'Read', cls: 'bg-ready/20 text-ready' },
  FAILED: { text: 'Failed', cls: 'bg-cancelled/15 text-cancelled' },
};

/** Compact WhatsApp delivery indicator used on order cards. */
export function WhatsAppStatusBadge({ status, label, error }: WhatsAppStatusBadgeProps) {
  const style = STYLES[status];
  const title = error ? `${label ? label + ': ' : ''}${error}` : label;
  return (
    <span className={`chip ${style.cls}`} title={title}>
      <span aria-hidden>✆</span>
      {label ? `${label}: ${style.text}` : style.text}
    </span>
  );
}

export default WhatsAppStatusBadge;
