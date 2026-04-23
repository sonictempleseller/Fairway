import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-foreground">
          Fairway
        </Link>
        <nav className="flex gap-6 text-sm font-medium text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <Link href="/students" className="hover:text-foreground transition-colors">
            Students
          </Link>
        </nav>
      </div>
    </header>
  );
}
