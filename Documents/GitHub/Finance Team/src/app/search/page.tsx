import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import StockSearch from "@/components/StockSearch";

export const metadata = { title: "Search — Alpha Friends" };

export default async function SearchPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <div className="py-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-black text-white tracking-tight">Stock Search</h1>
        <p className="text-zinc-500 text-sm mt-1">Search any ticker or company name</p>
      </div>
      <StockSearch />
    </div>
  );
}
