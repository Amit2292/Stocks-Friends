"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Props {
  params: { code: string };
}

export default function JoinGroupPage({ params }: Props) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const join = async () => {
    setJoining(true);
    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: params.code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to join");
      router.push(`/groups/${data.group.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setJoining(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-emerald-500">
              <Users className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Join Group</CardTitle>
          <CardDescription className="text-base mt-1">
            You&apos;ve been invited to join a Finance Team group
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
          <Button
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            size="lg"
            onClick={join}
            disabled={joining}
          >
            {joining ? "Joining..." : "Join Group"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
