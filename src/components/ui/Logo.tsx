import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="group inline-flex items-baseline gap-2 rounded-md text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
    >
      <span className="font-mono text-subheading font-semibold tracking-[-0.04em] transition-transform duration-300 group-hover:-translate-y-px">
        StoicType
      </span>
    </Link>
  );
}
