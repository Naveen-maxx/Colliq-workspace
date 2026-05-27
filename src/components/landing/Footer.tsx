import colliqLogo from "@/assets/landing/colliq-logo.png";

function LogoMark() {
  return <img src={colliqLogo} alt="Colliq" className="h-12 w-12 object-contain" />;
}

const links = [
  { label: "Features", href: "#features" },
  { label: "Templates", href: "#templates" },
  { label: "Why Colliq", href: "#why" },
  { label: "Testimonials", href: "#testimonials" },
];

export function Footer() {
  return (
    <footer className="border-t border-border-soft bg-surface-muted/30 py-14">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <LogoMark />
          <div>
            <p className="font-display text-base font-semibold tracking-tight">Colliq</p>
            <p className="text-[12.5px] text-muted-foreground">Work Together. Instantly.</p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-white hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <p className="text-[12.5px] text-muted-foreground">
          © {new Date().getFullYear()} Colliq Workspace
        </p>
      </div>
    </footer>
  );
}
