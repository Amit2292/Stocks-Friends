import FeedClient from "./FeedClient";

const DEV_USER_ID = "dev-user-001";

export default async function FeedPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black tracking-tighter text-white italic">TRADING FLOOR</h1>
        <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-medium">Alpha Friends · Live trades</p>
      </div>
      <FeedClient currentUserId={DEV_USER_ID} />
    </div>
  );
}
