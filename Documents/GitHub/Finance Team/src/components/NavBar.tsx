import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BarChart2, Settings } from "lucide-react";

export default function NavBar() {
  return (
    <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
      <nav className="container mx-auto px-4 max-w-5xl h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-md bg-emerald-500">
            <BarChart2 className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">Finance Team</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link href="/feed">
            <Button variant="ghost" size="sm">Feed</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">Portfolio</Button>
          </Link>
          <Link href="/groups">
            <Button variant="ghost" size="sm">Groups</Button>
          </Link>
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}
