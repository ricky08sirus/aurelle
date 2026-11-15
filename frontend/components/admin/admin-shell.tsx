"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";

const nav = [{ label: "Products", href: "/admin/products" }];

/** Shows admin pages only to logged-in admins. The backend checks this too. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return <p className="mx-auto max-w-7xl px-4 py-16 text-sm text-neutral-500">Checking access…</p>;
  }

  if (!user || !user.is_admin) {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-heading text-3xl text-navy">Admin access only</h1>
        <p className="mt-3 text-sm text-neutral-600">
          {user
            ? "Your account doesn't have admin rights. Ask the site owner to enable them."
            : "Log in with an admin account to manage products."}
        </p>
        {!user && (
          <Link
            href="/login"
            className="mt-6 inline-flex h-10 items-center rounded-lg bg-navy px-5 text-sm font-medium text-white hover:bg-navy-dark"
          >
            Log in
          </Link>
        )}
      </main>
    );
  }

  return (
    <div className="min-h-[70vh] bg-neutral-50">
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-12 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          <span className="text-sm font-semibold text-navy">Admin</span>
          <nav aria-label="Admin">
            <ul className="flex gap-4 text-sm">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={pathname.startsWith(item.href) ? "page" : undefined}
                    className={pathname.startsWith(item.href) ? "font-medium text-neutral-900" : "text-neutral-500 hover:text-neutral-900"}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}