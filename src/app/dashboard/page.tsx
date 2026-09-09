import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardContext } from "@/lib/dashboard-context";
import { getLeadStatsThisWeek, getLeads, hasAnyLeads } from "@/lib/data/leads";
import {
  getBookingStatsNext7Days,
  getUpcomingBookings,
} from "@/lib/data/bookings";
import { StatCard } from "@/components/dashboard/stat-card";
import { LeadsTable } from "@/components/dashboard/leads-table";
import { ReminderBadge } from "@/components/dashboard/booking-badges";
import { formatDateTime } from "@/lib/format";
import { ArrowRight, Sparkles } from "lucide-react";

export default async function OverviewPage() {
  const ctx = await getDashboardContext();
  if (!ctx) redirect("/login");

  const { supabase, businessId } = ctx;

  const [weekStats, bookingStats, recentLeads, upcomingBookings, anyLeads] =
    await Promise.all([
      getLeadStatsThisWeek(supabase, businessId),
      getBookingStatsNext7Days(supabase, businessId),
      getLeads(supabase, businessId, { sort: "desc", limit: 5 }),
      getUpcomingBookings(supabase, businessId, 5),
      hasAnyLeads(supabase, businessId),
    ]);

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
          Overview
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          What&apos;s come in and what&apos;s coming up.
        </p>
      </div>

      {!anyLeads && (
        <div className="flex items-start gap-3 rounded-xl border border-gold/40 bg-gold-tint px-5 py-4">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <p className="text-sm text-ink">
            No leads yet. Once an inbox is connected, new messages will show
            up here — classified and ready to draft — within a minute.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Leads this week"
          value={weekStats.total}
          accent="brand"
          detail={<span>Last 7 days</span>}
        />
        <StatCard
          label="Hot"
          value={weekStats.hot}
          accent="hot"
          detail={<span className="text-hot">Needs a fast reply</span>}
        />
        <StatCard label="Warm" value={weekStats.warm} accent="warm" />
        <StatCard label="Cold" value={weekStats.cold} accent="cold" />
        <StatCard
          label="Upcoming bookings"
          value={bookingStats.total}
          accent="gold"
          detail={<span>Next 7 days · {bookingStats.confirmed} confirmed</span>}
        />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">
            Recent leads
          </h2>
          <Link
            href="/dashboard/leads"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <LeadsTable
          leads={recentLeads}
          basePath="/dashboard/leads"
          status="all"
          classification="all"
          sort="desc"
        />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">
            Upcoming bookings
          </h2>
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {upcomingBookings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong bg-surface-muted/50 px-6 py-10 text-center text-sm text-ink-muted">
            No bookings yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
            <ul className="divide-y divide-border">
              {upcomingBookings.map((booking) => (
                <li
                  key={booking.id}
                  className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {booking.client_name}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {formatDateTime(booking.appointment_time)}
                    </p>
                  </div>
                  <ReminderBadge sent={booking.reminder_sent} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
