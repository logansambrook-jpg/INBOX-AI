import { redirect } from "next/navigation";
import { getDashboardContext } from "@/lib/dashboard-context";
import { getUpcomingBookings } from "@/lib/data/bookings";
import {
  ConfirmedBadge,
  ReminderBadge,
} from "@/components/dashboard/booking-badges";
import { formatDateTime } from "@/lib/format";

export default async function BookingsPage() {
  const ctx = await getDashboardContext();
  if (!ctx) redirect("/login");

  const bookings = await getUpcomingBookings(ctx.supabase, ctx.businessId);

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
          Bookings
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {bookings.length} appointment{bookings.length === 1 ? "" : "s"} on
          file, soonest first.
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong bg-surface-muted/50 px-6 py-16 text-center">
          <p className="text-sm font-medium text-ink">No bookings yet</p>
          <p className="mt-1 text-sm text-ink-muted">
            Once bookings are added, the reminder job will text or email
            clients before their appointment automatically.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <table className="hidden w-full text-left text-sm md:table">
            <thead>
              <tr className="border-b border-border bg-surface-muted text-xs font-semibold uppercase tracking-wider text-ink-faint">
                <th className="px-4 py-3">Client</th>
                <th className="px-3 py-3">Contact</th>
                <th className="px-3 py-3">Appointment</th>
                <th className="px-3 py-3">Confirmation</th>
                <th className="px-3 py-3">Reminder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-surface-muted/60">
                  <td className="px-4 py-3.5 font-medium text-ink">
                    {booking.client_name}
                  </td>
                  <td className="px-3 py-3.5 text-ink-muted">
                    {booking.contact}
                  </td>
                  <td className="px-3 py-3.5 whitespace-nowrap text-ink-muted">
                    {formatDateTime(booking.appointment_time)}
                  </td>
                  <td className="px-3 py-3.5">
                    <ConfirmedBadge confirmed={booking.confirmed} />
                  </td>
                  <td className="px-3 py-3.5">
                    <ReminderBadge sent={booking.reminder_sent} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="divide-y divide-border md:hidden">
            {bookings.map((booking) => (
              <li key={booking.id} className="space-y-2 px-4 py-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-ink">{booking.client_name}</p>
                  <ConfirmedBadge confirmed={booking.confirmed} />
                </div>
                <p className="text-sm text-ink-muted">{booking.contact}</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-ink-muted">
                    {formatDateTime(booking.appointment_time)}
                  </p>
                  <ReminderBadge sent={booking.reminder_sent} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
