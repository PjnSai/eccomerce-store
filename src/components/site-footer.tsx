import Link from "next/link";
import { site } from "@/lib/content";

const columns = [
  {
    title: "Client services",
    links: [
      { label: "Contact us", href: "/help/contact" },
      { label: "Shipping", href: "/help/shipping" },
      { label: "Returns", href: "/help/returns" },
      { label: "Care guide", href: "/help/care" },
    ],
  },
  {
    title: "The house",
    links: [
      { label: "About", href: "/about" },
      { label: "Journal", href: "/journal" },
      { label: "Boutiques", href: "/stores" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/legal/terms" },
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Accessibility", href: "/legal/accessibility" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line text-base">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:py-16">
        <div className="stack gap-4">
          <Link href="/" className="wordmark">
            {site.name}
          </Link>
          <p className="max-w-prose-sm text-muted">{site.tagline}</p>
        </div>
        {columns.map((column) => (
          <div key={column.title} className="stack gap-3">
            <h2 className="heading-section">{column.title}</h2>
            <ul className="stack gap-1.5 text-muted">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="link-plain hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container-page flex flex-col gap-2 border-t border-line-soft py-5 meta sm:flex-row sm:justify-between">
        <p>© 2026 {site.name}. Sample storefront.</p>
        <p>United States · USD $</p>
      </div>
    </footer>
  );
}
