"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { NAV_ITEMS } from "@/components/dashboard/nav-items";
import { Logo } from "@/components/dashboard/logo";
import { createClient } from "@/lib/supabase/client";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-sidebar-active-bg text-sidebar-fg"
                : "text-sidebar-fg-muted hover:bg-sidebar-active-bg hover:text-sidebar-fg"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
                active ? "bg-gold" : "bg-transparent"
              }`}
              aria-hidden
            />
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SignOut({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();

  async function handleSignOut() {
    onNavigate?.();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-fg-muted transition-colors hover:bg-sidebar-active-bg hover:text-sidebar-fg"
    >
      <LogOut className="h-4 w-4" strokeWidth={2} />
      Sign out
    </button>
  );
}

export function SidebarNav({
  businessName,
  userEmail,
}: {
  businessName: string;
  userEmail: string | null;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar-bg md:flex">
        <div className="px-5 py-6">
          <Logo dark />
        </div>
        <NavLinks />
        <div className="mt-auto space-y-1 border-t border-sidebar-border px-3 py-4">
          <div className="px-3 py-1.5">
            <p className="truncate text-sm font-semibold text-sidebar-fg">
              {businessName}
            </p>
            {userEmail && (
              <p className="truncate text-xs text-sidebar-fg-muted">
                {userEmail}
              </p>
            )}
          </div>
          <SignOut />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <Logo />
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-ink"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-sidebar-bg shadow-lg animate-fade-up">
            <div className="flex items-center justify-between px-5 py-6">
              <Logo dark />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-fg-muted hover:text-sidebar-fg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setMobileOpen(false)} />
            <div className="mt-auto space-y-1 border-t border-sidebar-border px-3 py-4">
              <div className="px-3 py-1.5">
                <p className="truncate text-sm font-semibold text-sidebar-fg">
                  {businessName}
                </p>
                {userEmail && (
                  <p className="truncate text-xs text-sidebar-fg-muted">
                    {userEmail}
                  </p>
                )}
              </div>
              <SignOut onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
