import { createGroup } from "@/app/actions/groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GROUP_TYPES = [
  { value: "book_club",   label: "📚 Book Club" },
  { value: "craft_night", label: "🧵 Craft Night" },
  { value: "supper_club", label: "🍽️ Supper Club" },
  { value: "garden_club", label: "🌱 Garden Club" },
  { value: "game_night",  label: "🎮 Game Night" },
  { value: "custom",      label: "✨ Custom" },
];

export default function NewGroupPage() {
  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Start a group</h1>
        <p className="mt-1 text-muted-foreground">
          You&apos;ll get an invite link to share with your people.
        </p>
      </div>

      <form action={createGroup} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Group name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Page Turners, Stitch & Sip…"
            required
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="group_type">What kind of group?</Label>
          <Select name="group_type" required defaultValue="custom">
            <SelectTrigger id="group_type">
              <SelectValue placeholder="Pick a type" />
            </SelectTrigger>
            <SelectContent>
              {GROUP_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="description">
            Description{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Textarea
            id="description"
            name="description"
            placeholder="A little about your group…"
            rows={3}
          />
        </div>

        <Button type="submit" className="w-full">
          Create group
        </Button>
      </form>
    </div>
  );
}
