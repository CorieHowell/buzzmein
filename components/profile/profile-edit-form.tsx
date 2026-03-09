"use client";

import { useRef, useState, useTransition } from "react";
import { updateProfile } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/lib/supabase/queries/profiles";

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming","Washington D.C.",
];

interface ProfileEditFormProps {
  profile: Profile;
}

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    setSuccessMsg(null);
    setErrorMsg(null);

    const formData = new FormData(form);
    startTransition(async () => {
      try {
        await updateProfile(formData);
        setSuccessMsg("Profile saved!");
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Save failed. Try again.");
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Display name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="display_name">Name</Label>
        <Input
          id="display_name"
          name="display_name"
          defaultValue={profile.display_name}
          placeholder="Your name"
          required
        />
      </div>

      {/* Username */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="username">
          Username{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            @
          </span>
          <Input
            id="username"
            name="username"
            defaultValue={profile.username ?? ""}
            placeholder="handle"
            className="pl-7"
          />
        </div>
      </div>

      {/* Email — read only */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={profile.email}
          readOnly
          className="cursor-not-allowed opacity-60"
        />
      </div>

      {/* Phone */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">
          Phone{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={profile.phone ?? ""}
          placeholder="(555) 555-5555"
        />
      </div>

      {/* State */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="state">
          Location{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <select
          id="state"
          name="state"
          defaultValue={profile.state ?? ""}
          className="h-10 w-full rounded-lg border border-input bg-transparent px-3.5 py-2 text-sm text-ink outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <option value="">Select a state</option>
          {US_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Contact info public */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
        <div>
          <p className="text-sm font-medium text-ink">Public contact info</p>
          <p className="text-xs text-muted-foreground">
            Let group members see your phone and email
          </p>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            name="contact_info_public"
            value="true"
            defaultChecked={profile.contact_info_public}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-muted-foreground/30 transition-colors peer-checked:bg-primary after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:content-[''] peer-checked:after:translate-x-[22px]" />
        </label>
      </div>

      {successMsg && (
        <p className="text-sm font-medium text-emerald-600">{successMsg}</p>
      )}
      {errorMsg && (
        <p className="text-sm text-destructive">{errorMsg}</p>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
