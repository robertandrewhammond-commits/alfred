import Link from "next/link";

const links = [
  { href: "/home", label: "Home" },
  { href: "/inbox", label: "Inbox" },
  { href: "/projects", label: "Projects" },
  { href: "/people", label: "People" },
  { href: "/search", label: "Search" },
];

export default function Shell({
  active,
  children,
}: {
  active: string;
  children: React.ReactNode;
}) {
  return (
    <div className="shell">
      <div className="sidebar">
        <div className="brand">Alfred</div>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`nav-link ${active === l.href ? "active" : ""}`}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div className="main">{children}</div>
    </div>
  );
}
