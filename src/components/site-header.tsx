"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navigation, site } from "@/lib/content";
import { BagIcon, CloseIcon, MenuIcon, SearchIcon, UserIcon } from "./icons";

export function SiteHeader() {
  const pathname = usePathname();
  const overHero = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!overHero) return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overHero]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const transparent = overHero && !scrolled && !menuOpen;

  return (
    <>
      <header
        className={[
          "inset-x-0 top-0 z-40 transition-colors duration-300",
          overHero ? "fixed" : "sticky",
          transparent
            ? "bg-transparent text-paper"
            : "border-b border-line bg-paper text-ink",
        ].join(" ")}
      >
        <div className="container-page grid h-header grid-cols-[1fr_auto_1fr] items-center">
          {/* Left: menu button (mobile) / primary nav (desktop) */}
          <div className="flex items-center">
            <button
              type="button"
              className="btn-icon -ml-3 lg:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
            <nav aria-label="Primary" className="hidden lg:block">
              <ul className="cluster gap-x-7">
                {navigation.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="link-nav">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <Link href="/" className="wordmark" aria-label={`${site.name} home`}>
            {site.name}
          </Link>

          {/* Right: utilities */}
          <div className="-mr-3 flex items-center justify-end">
            <Link href="/search" className="btn-icon" aria-label="Search">
              <SearchIcon />
            </Link>
            <Link href="/account" className="btn-icon hidden sm:inline-flex" aria-label="Account">
              <UserIcon />
            </Link>
            <Link href="/cart" className="btn-icon relative" aria-label="Shopping bag, 0 items">
              <BagIcon />
              <span className="absolute right-1.5 top-1.5 text-xs leading-none">0</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile menu drawer */}
      <div
        id="mobile-menu"
        className={[
          "fixed inset-x-0 bottom-0 top-header z-30 bg-paper transition-[opacity,transform] duration-500 ease-drawer lg:hidden",
          menuOpen ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-4 opacity-0",
        ].join(" ")}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <nav aria-label="Mobile" className="container-page stack h-full justify-between py-8">
          <ul className="stack gap-5">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="link-plain text-2xl"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="stack gap-3 border-t border-line pt-6 text-base text-muted">
            <li>
              <Link href="/account" className="link-plain" onClick={() => setMenuOpen(false)}>
                Account
              </Link>
            </li>
            <li>
              <Link href="/stores" className="link-plain" onClick={() => setMenuOpen(false)}>
                Boutiques
              </Link>
            </li>
            <li>
              <Link href="/help" className="link-plain" onClick={() => setMenuOpen(false)}>
                Client services
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
}
