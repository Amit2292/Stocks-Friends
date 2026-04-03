import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NewsClient from "./NewsClient";

export const metadata = { title: "News — Alpha Friends" };

export default async function NewsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return <NewsClient />;
}
