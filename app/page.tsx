import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-5xl font-bold tracking-tight">Buzz Me In</h1>
      <p className="text-lg text-muted-foreground">Get your crew together.</p>
      <div className="flex gap-3">
        <Button>Start a group</Button>
        <Button variant="outline">Sign in</Button>
      </div>
    </main>
  );
}
