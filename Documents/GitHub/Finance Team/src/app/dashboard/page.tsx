import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black tracking-tighter text-white italic">PORTFOLIO OVERVIEW</h1>
        <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-medium">Real-time positions & P&L</p>
      </div>
      <DashboardClient userName="Alpha Friend" />
    </div>
  );
}
