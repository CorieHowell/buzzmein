"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

// ── Helpers ────────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Swatch({ label, bg }: { label: string; bg: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="h-10 w-10 rounded-full border border-border"
        style={{ background: `var(--${bg}, ${bg})` }}
      />
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

// ── Gallery ────────────────────────────────────────────────────────────────────

export function DevGallery() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background px-5 py-10 pb-28">
      {/* Header */}
      <div className="mb-10">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Dev only · localhost
        </p>
        <h1 className="text-2xl font-bold text-foreground">Component Gallery</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All UI primitives and design tokens. Redirects to home in production.
        </p>
      </div>

      <div className="max-w-xl space-y-12">

        {/* ── Colors ──────────────────────────────────────────────────────────── */}
        <Section title="Color Scale — Purple">
          <div className="flex flex-wrap gap-5">
            <Swatch label="ink" bg="ink" />
            <Swatch label="deep" bg="deep" />
            <Swatch label="core" bg="core" />
            <Swatch label="mid" bg="mid" />
            <Swatch label="soft" bg="soft" />
            <Swatch label="whisper" bg="whisper" />
          </div>
        </Section>

        <Section title="Color Scale — Brand Splash">
          <div className="flex flex-wrap gap-5">
            <Swatch label="purple-rich" bg="purple-rich" />
            <Swatch label="purple-slate" bg="purple-slate" />
            <Swatch label="purple-haze" bg="purple-haze" />
          </div>
          <p className="text-xs text-muted-foreground">
            Used on the splash / login screen. <code className="rounded bg-muted px-1 py-0.5 font-mono">purple-rich</code> = CTA buttons &amp; actions · <code className="rounded bg-muted px-1 py-0.5 font-mono">purple-slate</code> = upper bg · <code className="rounded bg-muted px-1 py-0.5 font-mono">purple-haze</code> = lower panel
          </p>
        </Section>

        <Section title="Color Scale — Accent &amp; Status">
          <div className="flex flex-wrap gap-5">
            <Swatch label="glow" bg="glow" />
            <Swatch label="glow-warm" bg="glow-warm" />
            <Swatch label="glow-pale" bg="glow-pale" />
            <Swatch label="primary" bg="primary" />
            <Swatch label="secondary" bg="secondary" />
            <Swatch label="muted" bg="muted" />
            <Swatch label="destructive" bg="destructive" />
          </div>
        </Section>

        <Section title="Surface Colors">
          <div className="flex flex-wrap gap-5">
            <Swatch label="background" bg="background" />
            <Swatch label="card" bg="card" />
            <Swatch label="popover" bg="popover" />
            <Swatch label="border" bg="border" />
          </div>
        </Section>

        <Separator />

        {/* ── Typography ──────────────────────────────────────────────────────── */}
        <Section title="Typography">
          <div className="space-y-3">
            <p className="text-3xl font-bold leading-tight">Heading — Bold 3xl</p>
            <p className="text-2xl font-bold leading-tight">Heading — Bold 2xl</p>
            <p className="text-xl font-semibold">Heading — Semibold xl</p>
            <p className="text-lg font-semibold">Heading — Semibold lg</p>
            <p className="text-base">Body — base 16px. The quick brown fox jumps.</p>
            <p className="text-sm text-muted-foreground">
              Small — 14px muted. Supporting copy and descriptions.
            </p>
            <p className="text-xs text-muted-foreground">
              Caption — 12px muted. Timestamps, metadata.
            </p>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Eyebrow / label — xs uppercase tracked
            </p>
          </div>
        </Section>

        <Separator />

        {/* ── Button ──────────────────────────────────────────────────────────── */}
        <Section title="Button — Variants">
          <div className="flex flex-wrap gap-3">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
        </Section>

        <Section title="Button — Sizes">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg">Large</Button>
            <Button>Default</Button>
            <Button size="sm">Small</Button>
            <Button size="icon" aria-label="icon">✦</Button>
          </div>
        </Section>

        <Section title="Button — States">
          <div className="flex flex-wrap gap-3">
            <Button>Normal</Button>
            <Button disabled>Disabled</Button>
          </div>
        </Section>

        <Section title="Button — Splash Pattern (Primary / Secondary)">
          <p className="text-xs text-muted-foreground -mt-1 mb-3">
            Used on the login splash screen. These are plain <code className="rounded bg-muted px-1 py-0.5 font-mono">&lt;button&gt;</code> elements styled inline — not the shadcn Button component.
          </p>
          {/* Shown on the haze background to match real context */}
          <div className="rounded-2xl bg-purple-haze p-5 flex flex-col gap-3">
            <button className="h-14 w-full rounded-[20px] bg-purple-rich text-base font-semibold text-white transition-opacity active:opacity-80">
              Create Account
            </button>
            <button className="h-14 w-full rounded-[20px] border border-purple-rich text-base font-semibold text-purple-rich transition-opacity active:opacity-80">
              Sign In
            </button>
          </div>
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            <p><strong>Primary:</strong> <code className="rounded bg-muted px-1 py-0.5 font-mono">bg-purple-rich text-white rounded-[20px] h-14</code></p>
            <p><strong>Secondary:</strong> <code className="rounded bg-muted px-1 py-0.5 font-mono">border border-purple-rich text-purple-rich rounded-[20px] h-14</code></p>
          </div>
        </Section>

        <Separator />

        {/* ── Badge ───────────────────────────────────────────────────────────── */}
        <Section title="Badge">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </Section>

        <Separator />

        {/* ── Avatar ──────────────────────────────────────────────────────────── */}
        <Section title="Avatar — Sizes + Initials">
          <div className="flex flex-wrap items-end gap-5">
            {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
              <div key={size} className="flex flex-col items-center gap-1.5">
                <Avatar src={null} displayName="Alex Rivera" size={size} />
                <span className="text-[10px] text-muted-foreground">{size}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Avatar — With Photo">
          <div className="flex flex-wrap items-end gap-5">
            {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
              <div key={size} className="flex flex-col items-center gap-1.5">
                <Avatar
                  src="https://i.pravatar.cc/150?img=47"
                  displayName="Sam"
                  size={size}
                />
                <span className="text-[10px] text-muted-foreground">{size}</span>
              </div>
            ))}
          </div>
        </Section>

        <Separator />

        {/* ── Form Elements ───────────────────────────────────────────────────── */}
        <Section title="Input">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ex-1">Label + Input</Label>
              <Input id="ex-1" placeholder="Placeholder text…" />
            </div>
            <Input placeholder="No label" />
            <Input placeholder="Disabled" disabled />
            <Input type="password" placeholder="Password field" />
          </div>
        </Section>

        <Section title="Textarea">
          <div className="space-y-1.5">
            <Label htmlFor="ex-ta">What's on your mind?</Label>
            <Textarea id="ex-ta" placeholder="Start typing…" rows={3} />
          </div>
        </Section>

        <Section title="Select">
          <Select>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose group type…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="book_club">Book Club</SelectItem>
              <SelectItem value="supper_club">Supper Club</SelectItem>
              <SelectItem value="craft_night">Craft Night</SelectItem>
              <SelectItem value="game_night">Game Night</SelectItem>
              <SelectItem value="garden_club">Garden Club</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </Section>

        <Separator />

        {/* ── Card ────────────────────────────────────────────────────────────── */}
        <Section title="Card">
          <Card>
            <CardHeader>
              <CardTitle>Summer Book Club</CardTitle>
              <CardDescription>6 members · Next meeting in 3 days</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Cards are used for group tiles, topic nominations, and meeting summaries throughout the app.
              </p>
            </CardContent>
          </Card>
        </Section>

        <Separator />

        {/* ── Drawer ──────────────────────────────────────────────────────────── */}
        <Section title="Drawer (bottom sheet)">
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline">Open Drawer</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>New Post</DrawerTitle>
                <DrawerDescription>
                  vaul-powered bottom sheet used for the post composer and other
                  mobile-friendly overlays.
                </DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-2">
                <Textarea placeholder="What's on your mind?" rows={3} />
              </div>
              <DrawerFooter>
                <Button onClick={() => setDrawerOpen(false)}>Post</Button>
                <DrawerClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </Section>

        <Separator />

        {/* ── Separator ───────────────────────────────────────────────────────── */}
        <Section title="Separator">
          <div className="space-y-4">
            <Separator />
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>
          </div>
        </Section>

        <Separator />

        {/* ── Border Radius ───────────────────────────────────────────────────── */}
        <Section title="Border Radius">
          <div className="flex flex-wrap items-end gap-5">
            {(["sm", "md", "lg", "xl", "2xl", "full"] as const).map((r) => (
              <div key={r} className="flex flex-col items-center gap-1.5">
                <div className={`h-10 w-10 bg-primary rounded-${r}`} />
                <span className="text-[10px] text-muted-foreground">{r}</span>
              </div>
            ))}
          </div>
        </Section>

      </div>
    </div>
  );
}
