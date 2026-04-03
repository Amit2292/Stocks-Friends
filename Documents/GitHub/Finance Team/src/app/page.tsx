import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[80vh] overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#d22348]/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 text-center space-y-6 max-w-xl px-4">
        <div className="flex justify-center mb-6">
          <span className="italic font-black text-3xl tracking-tighter text-white">ALPHA FRIENDS</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
          The Inner Circle<br />
          <span className="text-blue-500">of Alpha</span>
        </h1>

        <p className="text-zinc-400 text-sm font-medium tracking-wide max-w-sm mx-auto">
          A private group for elite trading insights. Track your portfolio, follow the team, and stay ahead.
        </p>

        {isLoggedIn ? (
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href="/feed"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm transition-all active:scale-[0.98] shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)]">
              Trading Floor
            </Link>
            <Link href="/dashboard"
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-lg text-sm transition-all">
              Portfolio
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 pt-2">
            <a href="/api/auth/signin/github"
              className="flex items-center gap-3 px-8 py-3.5 bg-white hover:bg-zinc-100 text-zinc-900 font-bold rounded-lg text-sm transition-all active:scale-[0.98] shadow-lg">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              Sign in with GitHub
            </a>
            <p className="text-[11px] font-bold text-zinc-600 uppercase tracking-[0.25em]">
              Invite only · Admin approval required
            </p>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3 pt-4">
          {[
            { icon: "query_stats", label: "Social Trading Feed" },
            { icon: "pie_chart",   label: "Live Portfolio" },
            { icon: "campaign",    label: "TASE Announcements" },
            { icon: "group",       label: "Private Groups" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800/50 rounded-lg text-xs text-zinc-400">
              <span className="material-symbols-outlined text-blue-500 text-[16px]">{icon}</span>
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(#c3c6d7 1px, transparent 1px), linear-gradient(90deg, #c3c6d7 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
    </div>
  );
}
