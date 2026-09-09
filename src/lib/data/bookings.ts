import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Supabase = SupabaseClient<Database>;

export type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

/** All bookings for a business, soonest appointment first. */
export async function getUpcomingBookings(
  supabase: Supabase,
  businessId: string,
  limit = 200
) {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, client_name, contact, appointment_time, reminder_sent, confirmed, created_at"
    )
    .eq("business_id", businessId)
    .order("appointment_time", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data;
}

export type BookingWeekStats = {
  total: number;
  confirmed: number;
  reminderPending: number;
};

/** Counts bookings with an appointment_time in the next 7 days. */
export async function getBookingStatsNext7Days(
  supabase: Supabase,
  businessId: string
): Promise<BookingWeekStats> {
  const now = new Date().toISOString();
  const in7Days = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("bookings")
    .select("confirmed, reminder_sent")
    .eq("business_id", businessId)
    .gte("appointment_time", now)
    .lte("appointment_time", in7Days);

  if (error) throw error;

  return {
    total: data.length,
    confirmed: data.filter((b) => b.confirmed).length,
    reminderPending: data.filter((b) => !b.reminder_sent).length,
  };
}
