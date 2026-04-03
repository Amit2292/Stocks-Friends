import { auth } from "@/lib/auth";
import FeedClient from "./FeedClient";

export default async function FeedPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "dev-user-001";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black tracking-tighter text-white italic">TRADING FLOOR</h1>
        <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-medium">Alpha Friends · Live trades</p>
      </div>
      <FeedClient currentUserId={userId} />
    </div>
  );
}
