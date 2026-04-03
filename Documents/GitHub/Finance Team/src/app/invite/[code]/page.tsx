import { redirect } from "next/navigation";
import { BarChart2, UserPlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Props {
  params: { code: string };
}

async function validateCode(code: string) {
  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL}/api/invite/${code}`,
      { cache: "no-store" }
    );
    return await res.json();
  } catch {
    return { valid: false };
  }
}

export default async function InvitePage({ params }: Props) {
  const result = await validateCode(params.code);

  if (!result.valid) {
    redirect("/");
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-emerald-500">
              <BarChart2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">You&apos;re invited!</CardTitle>
          <CardDescription className="text-base mt-1">
            <span className="font-semibold text-foreground">{result.invited_by}</span> invited you to join{" "}
            <span className="font-semibold text-foreground">Finance Team</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li>📈 Track your portfolio & P&L</li>
            <li>👥 See what your team is trading</li>
            <li>📰 Get live stock news</li>
          </ul>

          <Link href={`/api/auth/signin?callbackUrl=/dashboard`} className="block">
            <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white" size="lg">
              <UserPlus className="h-4 w-4 mr-2" />
              Join with GitHub
            </Button>
          </Link>

          <p className="text-xs text-center text-muted-foreground">
            By joining you accept the invite from {result.invited_by}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
