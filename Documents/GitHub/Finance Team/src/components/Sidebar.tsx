"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/feed",      label: "Trading Floor", icon: "query_stats" },
  { href: "/dashboard", label: "Portfolio",      icon: "pie_chart" },
  { href: "/groups",    label: "Groups",         icon: "group" },
  { href: "/settings",  label: "Settings",       icon: "settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-zinc-900 border-r border-zinc-800/50 fixed left-0 top-8 bottom-0 z-50 overflow-y-auto">
      {/* Logo */}
      <div className="px-6 py-8">
        <Link href="/" className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-blue-600 rounded flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-lg"
              style={{ fontVariationSettings: "'FILL' 1" }}>
              account_tree
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-blue-500 text-base leading-none italic tracking-tight">
              ALPHA FRIENDS
            </span>
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">
              The Pulse of Precision
            </span>
          </div>
        </Link>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-r-full transition-all duration-200 text-sm font-medium",
                  active ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40"
                )}>
                <span className={cn("material-symbols-outlined text-[20px]", active && "text-blue-500")}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom */}
      <div className="mt-auto p-6 border-t border-zinc-800/50 space-y-2">
        <Link href="/feed"
          className="block w-full text-center py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg mb-2 transition-all active:scale-[0.98]">
          Quick Trade
        </Link>
        <a href="/api/auth/signout"
          className="flex items-center gap-3 px-4 py-2 text-zinc-500 hover:text-zinc-200 text-sm transition-colors">
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Sign Out
        </a>
      </div>
    </aside>
  );
}
