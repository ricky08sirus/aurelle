"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  CircleUser,
  LogOut,
  Menu,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "About Us", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact Us", href: "/contact" },
];

export function Header() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const chevron = (
    <ChevronDown
      className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
    />
  );

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto grid h-20 max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 md:h-28 md:grid-cols-[1fr_auto_1fr] lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          aria-label="Aurelle home"
          className="flex items-center justify-self-start"
        >
          <Image
            src="/logo.png"
            alt="Aurelle"
            width={716}
            height={284}
            priority
            className="h-12 w-auto md:h-16"
          />
        </Link>

        {/* Main menu (desktop) */}
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-8 lg:gap-10">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={`border-b pb-1 text-xs font-medium tracking-[0.15em] uppercase transition ${
                    isActive(link.href)
                      ? "border-navy text-navy"
                      : "border-transparent text-neutral-600 hover:text-navy"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Account + mobile menu button */}
        <div className="flex items-center justify-self-end gap-4">
          <nav aria-label="Account" ref={ref} className="relative">
            {loading ? (
              <div className="h-5 w-24" />
            ) : user ? (
              <button
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="flex items-center gap-2 text-sm font-medium text-navy transition hover:opacity-80"
              >
                <CircleUser className="size-5" />
                <span>{user.name.split(" ")[0]}</span>
                {chevron}
              </button>
            ) : (
              <div className="flex items-center gap-2 text-sm font-medium text-navy">
                <Link
                  href="/login"
                  className="flex items-center gap-2 transition hover:opacity-80"
                >
                  <CircleUser className="size-5" />
                  <span>Login</span>
                </Link>
                <button
                  onClick={() => setOpen((v) => !v)}
                  aria-expanded={open}
                  aria-label="Open account menu"
                  className="transition hover:opacity-80"
                >
                  {chevron}
                </button>
              </div>
            )}

            {open && !loading && (
              <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
                {user ? (
                  <>
                    <Link
                      href="/account"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3 text-sm text-neutral-700 transition hover:bg-neutral-50"
                    >
                      <UserRound className="size-4" />
                      Account
                    </Link>
                    <button
                      onClick={async () => {
                        await logout();
                        setOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-neutral-700 transition hover:bg-neutral-50"
                    >
                      <LogOut className="size-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-neutral-500">New Customer?</span>
                    <Link
                      href="/register"
                      onClick={() => setOpen(false)}
                      className="font-semibold text-navy hover:underline"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            )}
          </nav>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label="Toggle menu"
            className="text-navy md:hidden"
          >
            {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Main menu (mobile) */}
      {mobileOpen && (
        <nav
          aria-label="Main mobile"
          className="border-t border-neutral-100 bg-white md:hidden"
        >
          <ul className="px-4 py-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={`block py-3 text-xs font-medium tracking-[0.15em] uppercase ${
                    isActive(link.href) ? "text-navy" : "text-neutral-600"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}