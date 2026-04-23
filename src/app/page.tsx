import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="text-6xl font-bold tracking-tight text-foreground sm:text-7xl">
        Fairway
      </h1>
      <p className="mt-4 text-xl text-muted-foreground sm:text-2xl">
        Modern tools for teaching professionals
      </p>
      <div className="mt-10">
        <Button size="lg">Get started</Button>
      </div>
    </main>
  );
}
