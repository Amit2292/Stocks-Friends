import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewsClient from "./NewsClient";

export const metadata = { title: "News — Alpha Friends" };

export default async function NewsPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return <NewsClient />;
}
