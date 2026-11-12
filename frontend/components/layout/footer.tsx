import { siteConfig } from "@/lib/site";

export function Footer() {
  return (
    <footer className="bg-navy-dark text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Footer content goes here (links, contact info, social icons, etc.) */}
        <div className="min-h-24" />
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-5 text-center text-xs tracking-wide text-white/60 sm:px-6 lg:px-8">
          &copy; {new Date().getFullYear()} {siteConfig.name}. All rights
          reserved.
        </div>
      </div>
    </footer>
  );
}