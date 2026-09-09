export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-[18px] w-[18px]"
          aria-hidden
        >
          <path
            d="M3 7.5 12 13l9-5.5"
            stroke="#12211b"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect
            x="3"
            y="5.5"
            width="18"
            height="13"
            rx="2.2"
            stroke="#12211b"
            strokeWidth="1.8"
          />
        </svg>
      </div>
      <span
        className={`font-display text-lg font-semibold leading-none ${
          dark ? "text-sidebar-fg" : "text-ink"
        }`}
      >
        Inbox<span className="text-gold"> AI</span>
      </span>
    </div>
  );
}
