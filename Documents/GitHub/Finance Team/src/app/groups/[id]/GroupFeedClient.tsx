"use client";

import { useEffect, useState, useCallback } from "react";
import { TradeWithUser } from "@/lib/types";
import FeedCard from "@/components/FeedCard";
import TradeModal from "@/components/TradeModal";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

interface GroupFeedClientProps {
  groupId: string;
}

interface GroupInfo {
  id: string;
  name: string;
  invite_code: string;
  role: string;
  member_count: number;
}

export default function GroupFeedClient({ groupId }: GroupFeedClientProps) {
  const [trades, setTrades] = useState<TradeWithUser[]>([]);
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [feedRes, groupRes] = await Promise.all([
        fetch(`/api/groups/${groupId}/feed`),
        fetch(`/api/groups/${groupId}`),
      ]);
      const feedData = await feedRes.json();
      const groupData = await groupRes.json();
      setTrades(feedData.trades ?? []);
      if (groupData.group) setGroup(groupData.group);
    } catch {
      toast({ title: "Failed to load group feed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [groupId, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const copyInvite = () => {
    if (!group) return;
    navigator.clipboard.writeText(`${window.location.origin}/groups/join/${group.invite_code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/groups">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{group?.name ?? "Group Feed"}</h1>
            {group && (
              <p className="text-xs text-muted-foreground">{group.member_count} member{group.member_count !== 1 ? "s" : ""}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyInvite} className="gap-1.5">
            {copied
              ? <><Check className="h-3 w-3" /> Copied</>
              : <><Copy className="h-3 w-3" /> Copy Invite</>}
          </Button>
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Log Trade
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : trades.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground space-y-2">
          <p className="text-lg">No trades in this group yet.</p>
          <Button variant="outline" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Log the first trade
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {trades.map((trade) => (
            <FeedCard key={trade.id} trade={trade} isOwnTrade={false} />
          ))}
        </div>
      )}

      <TradeModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={() => { setIsModalOpen(false); fetchData(); toast({ title: "Trade logged!" }); }}
      />
    </>
  );
}
