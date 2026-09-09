import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Every query below is explicitly scoped to business_id even though Row
  // Level Security already enforces the same boundary at the database
  // level — defense in depth, per the project's non-negotiable data
  // isolation rule.
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id, full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Almost there</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Your account isn&apos;t linked to a business yet. Ask an admin to
          finish onboarding (see{" "}
          <code className="rounded bg-neutral-100 px-1">
            supabase/seed.example.sql
          </code>
          ), then refresh this page.
        </p>
        <div className="mt-6">
          <SignOutButton />
        </div>
      </main>
    );
  }

  const { data: business } = await supabase
    .from("business_config")
    .select("id, name")
    .eq("id", profile.business_id)
    .single();

  const { data: leads } = await supabase
    .from("leads")
    .select("id, channel, status, classification, intent_summary, created_at")
    .eq("business_id", profile.business_id)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, client_name, appointment_time, reminder_sent, confirmed")
    .eq("business_id", profile.business_id)
    .order("appointment_time", { ascending: true })
    .limit(50);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {business?.name ?? "Dashboard"}
          </h1>
          <p className="text-sm text-neutral-500">
            Signed in as {user.email} · {profile.role}
          </p>
        </div>
        <SignOutButton />
      </header>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Leads ({leads?.length ?? 0})
        </h2>
        {!leads || leads.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No leads yet. Once an inbox is connected (step 2), new messages
            will show up here automatically.
          </p>
        ) : (
          <div className="overflow-hidden rounded-md border border-neutral-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Channel</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Classification</th>
                  <th className="px-3 py-2 font-medium">Intent</th>
                  <th className="px-3 py-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="px-3 py-2">{lead.channel}</td>
                    <td className="px-3 py-2">{lead.status}</td>
                    <td className="px-3 py-2">
                      {lead.classification ?? "—"}
                    </td>
                    <td className="px-3 py-2">{lead.intent_summary ?? "—"}</td>
                    <td className="px-3 py-2 text-neutral-500">
                      {new Date(lead.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Upcoming bookings ({bookings?.length ?? 0})
        </h2>
        {!bookings || bookings.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No bookings yet. Once added, the daily reminder job (step 6) will
            text or email clients before their appointment.
          </p>
        ) : (
          <div className="overflow-hidden rounded-md border border-neutral-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Client</th>
                  <th className="px-3 py-2 font-medium">Appointment</th>
                  <th className="px-3 py-2 font-medium">Reminder sent</th>
                  <th className="px-3 py-2 font-medium">Confirmed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-3 py-2">{booking.client_name}</td>
                    <td className="px-3 py-2">
                      {new Date(booking.appointment_time).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      {booking.reminder_sent ? "Yes" : "No"}
                    </td>
                    <td className="px-3 py-2">
                      {booking.confirmed ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
