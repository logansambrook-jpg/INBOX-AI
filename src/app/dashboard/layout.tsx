import { getDashboardContext } from "@/lib/dashboard-context";
import { NotOnboarded } from "@/components/dashboard/not-onboarded";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getDashboardContext();

  if (!ctx) {
    return <NotOnboarded />;
  }

  const { data: business } = await ctx.supabase
    .from("business_config")
    .select("name")
    .eq("id", ctx.businessId)
    .single();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <SidebarNav
        businessName={business?.name ?? "Your business"}
        userEmail={ctx.userEmail}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
