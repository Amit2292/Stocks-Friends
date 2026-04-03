"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Plus, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Invite {
  id: string;
  code: string;
  created_at: string;
  used_at: string | null;
  used_by_name: string | null;
}

export default function SettingsClient() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchInvites = async () => {
    const res = await fetch("/api/invite");
    const data = await res.json();
    setInvites(data.invites ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchInvites(); }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/invite", { method: "POST" });
      if (!res.ok) throw new Error();
      await fetchInvites();
      toast({ title: "Invite link created!" });
    } catch {
      toast({ title: "Failed to generate invite", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = (invite: Invite) => {
    const url = `${window.location.origin}/invite/${invite.code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Invite Links
        </CardTitle>
        <CardDescription>
          Only people with your invite link can join Finance Team.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={generate} disabled={generating} className="gap-2">
          <Plus className="h-4 w-4" />
          {generating ? "Generating..." : "Generate Invite Link"}
        </Button>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
          </div>
        ) : invites.length === 0 ? (
          <p className="text-sm text-muted-foreground">No invite links yet. Generate one above.</p>
        ) : (
          <div className="space-y-2">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/30"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-medium truncate">
                    /invite/{invite.code}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {invite.used_at ? (
                      <Badge variant="secondary" className="text-xs">
                        Used by {invite.used_by_name ?? "someone"} ·{" "}
                        {formatDistanceToNow(new Date(invite.used_at), { addSuffix: true })}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                        Active
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Created {formatDistanceToNow(new Date(invite.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {!invite.used_at && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0 gap-1.5 text-xs"
                    onClick={() => copyLink(invite)}
                  >
                    {copiedId === invite.id
                      ? <><Check className="h-3 w-3" /> Copied</>
                      : <><Copy className="h-3 w-3" /> Copy</>}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
