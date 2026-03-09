"use client";

import { useRef, useState } from "react";
import { nominateTopic } from "@/app/actions/topics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";

export function NominateTopicForm({ groupId }: { groupId: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [coverUrl, setCoverUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    setIsUploading(true);
    setUploadError("");

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `topics/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage.from("covers").upload(path, file);
      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("covers").getPublicUrl(path);

      setCoverUrl(publicUrl);
    } catch {
      setUploadError("Upload failed — you can still submit without a cover.");
      setPreviewUrl("");
      setCoverUrl("");
    } finally {
      setIsUploading(false);
    }
  }

  const submitAction = nominateTopic.bind(null, groupId);

  return (
    <form action={submitAction} className="flex flex-col gap-6">
      {/* Cover URL passed as hidden input after successful upload */}
      {coverUrl && <input type="hidden" name="cover_url" value={coverUrl} />}

      {/* Cover image upload */}
      <div className="flex flex-col gap-2">
        <Label>
          Cover image{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <div className="flex items-start gap-4">
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Cover preview"
              className="h-24 w-16 shrink-0 rounded object-cover border"
            />
          )}
          <div className="flex flex-col gap-1.5">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={isUploading}
              className="text-sm text-primary hover:underline disabled:opacity-50 text-left"
            >
              {isUploading
                ? "Uploading…"
                : previewUrl
                  ? "Change image"
                  : "Upload image"}
            </button>
            {uploadError && (
              <p className="text-xs text-destructive">{uploadError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          placeholder="What are you nominating?"
          required
          autoFocus
        />
      </div>

      {/* Author */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="author">
          Author / creator{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="author"
          name="author"
          placeholder="Author, creator, studio…"
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">
          Notes{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Why are you nominating this?"
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isUploading}>
        {isUploading ? "Uploading image…" : "Submit nomination"}
      </Button>
    </form>
  );
}
