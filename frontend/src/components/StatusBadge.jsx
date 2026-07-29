const STATUS_STYLES = {
  Active: { bg: 'bg-signal-light', text: 'text-signal', dot: 'bg-signal' },
  Expired: { bg: 'bg-danger-light', text: 'text-danger', dot: 'bg-danger' },
  Frozen: { bg: 'bg-[#E5EEFF]', text: 'text-[#3B5BDB]', dot: 'bg-[#3B5BDB]' },
  Cancelled: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
  ExpiringSoon: { bg: 'bg-warn-light', text: 'text-warn', dot: 'bg-warn' },
};

export default function StatusBadge({ status, label }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.Cancelled;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
      <span className={`status-dot ${style.dot}`} />
      {label || status}
    </span>
  );
}

export function membershipDisplayStatus(membership) {
  if (!membership) return 'Expired';
  if (membership.status === 'Frozen') return 'Frozen';
  if (membership.status === 'Cancelled') return 'Cancelled';
  const end = new Date(membership.end_date);
  const now = new Date();
  const diffDays = Math.ceil((end - now) / 86400000);
  if (end < now) return 'Expired';
  if (diffDays <= 3) return 'ExpiringSoon';
  return 'Active';
}
