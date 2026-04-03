"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Plus, Copy, Check, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

interface Group {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  member_count: number;
  role: "admin" | "member";
  created_at: string;
}

export default function GroupsClient() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchGroups = async () => {
    const res = await fetch("/api/groups");
    const data = await res.json();
    setGroups(data.groups ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchGroups(); }, []);

  const createGroup = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || undefined }),
      });
      if (!res.ok) throw new Error();
      setNewName("");
      setNewDesc("");
      await fetchGroups();
      toast({ title: "Group created!" });
    } catch {
      toast({ title: "Failed to create group", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const joinGroup = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode.trim() }),
      });
      if (!res.ok) throw new Error();
      setJoinCode("");
      await fetchGroups();
      toast({ title: "Joined group!" });
    } catch {
      toast({ title: "Invalid invite code", variant: "destructive" });
    } finally {
      setJoining(false);
    }
  };

  const copyInviteLink = (group: Group) => {
    const url = `${window.location.origin}/groups/join/${group.invite_code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(group.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar actions */}
      <div className="space-y-4">
        {/* Create group */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" /> Create Group
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              placeholder="Group name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={50}
            />
            <Input
              placeholder="Description (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              maxLength={200}
            />
            <Button
              className="w-full"
              onClick={createGroup}
              disabled={creating || !newName.trim()}
            >
              {creating ? "Creating..." : "Create"}
            </Button>
          </CardContent>
        </Card>

        {/* Join group */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <LogIn className="h-4 w-4" /> Join Group
            </CardTitle>
            <CardDescription className="text-xs">Enter an invite code</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              placeholder="Invite code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={joinGroup}
              disabled={joining || !joinCode.trim()}
            >
              {joining ? "Joining..." : "Join"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Groups list */}
      <div className="lg:col-span-2">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground gap-2">
            <Users className="h-10 w-10 opacity-30" />
            <p>No groups yet. Create one or join with an invite code.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <Card key={group.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/groups/${group.id}`}
                          className="font-semibold text-lg hover:text-emerald-600 transition-colors"
                        >
                          {group.name}
                        </Link>
                        <Badge variant={group.role === "admin" ? "default" : "secondary"} className="text-xs">
                          {group.role}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {group.member_count} member{group.member_count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {group.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">{group.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        onClick={() => copyInviteLink(group)}
                      >
                        {copiedId === group.id
                          ? <><Check className="h-3 w-3" /> Copied</>
                          : <><Copy className="h-3 w-3" /> Invite</>}
                      </Button>
                      <Link href={`/groups/${group.id}`}>
                        <Button size="sm" className="text-xs">View Feed</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
