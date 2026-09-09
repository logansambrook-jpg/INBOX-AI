export function ReminderBadge({ sent }: { sent: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        sent
          ? "bg-status-sent text-brand-fg"
          : "bg-status-new-tint text-status-new"
      }`}
    >
      {sent ? "Reminder sent" : "Reminder pending"}
    </span>
  );
}

export function ConfirmedBadge({ confirmed }: { confirmed: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        confirmed
          ? "bg-brand-tint text-brand"
          : "bg-status-new-tint text-status-new"
      }`}
    >
      {confirmed ? "Confirmed" : "Unconfirmed"}
    </span>
  );
}
