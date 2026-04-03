import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${new URL(request.url).origin}/auth/callback`,
    },
  });
  if (error || !data.url) return NextResponse.redirect(new URL("/?error=auth", request.url));
  return NextResponse.redirect(data.url);
}
