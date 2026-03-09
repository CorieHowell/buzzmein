"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PenLine, ImagePlus, X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { createPost } from "@/app/actions/posts";

export function NewPostDrawer({
  groupId,
  onPostCreated,
}: {
  groupId: string;
  onPostCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setUploading(true);
    setUploadError("");

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `posts/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("covers").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("covers").getPublicUrl(path);
      setImageUrl(publicUrl);
    } catch {
      setUploadError("Upload failed — you can still post without an image.");
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  }

  function removeImage() {
    setImagePreview(null);
    setImageUrl(null);
    setUploadError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit() {
    if (!body.trim() || submitting) return;
    setSubmitting(true);
    try {
      await createPost(groupId, body, imageUrl);
      setBody("");
      removeImage();
      setOpen(false);
      onPostCreated();
      router.refresh();
    } catch {
      // keep drawer open on error
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      // Reset on close
      setBody("");
      removeImage();
    }
    setOpen(next);
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        aria-label="New post"
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform active:scale-95"
      >
        <PenLine size={22} strokeWidth={2} />
      </button>

      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="max-h-[90svh]">
          <DrawerHeader className="border-b border-border pb-3">
            <DrawerTitle className="text-base font-semibold text-ink">
              New post
            </DrawerTitle>
          </DrawerHeader>

          <div className="flex flex-col gap-4 px-4 py-4 overflow-y-auto">
            {/* Text area */}
            <Textarea
              placeholder="What's on your mind?"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="resize-none text-base border-0 p-0 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
              autoFocus
            />

            {/* Image preview */}
            {imagePreview && (
              <div className="relative w-full overflow-hidden rounded-xl bg-muted">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-48 w-full object-cover"
                />
                <button
                  onClick={removeImage}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white"
                  aria-label="Remove image"
                >
                  <X size={14} />
                </button>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <p className="text-xs font-medium text-white">Uploading…</p>
                  </div>
                )}
              </div>
            )}

            {uploadError && (
              <p className="text-xs text-destructive">{uploadError}</p>
            )}
          </div>

          {/* Bottom action bar */}
          <div className="flex items-center gap-3 border-t border-border px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            {/* Image button */}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading || !!imagePreview}
              aria-label="Add image"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:text-ink disabled:opacity-40"
            >
              <ImagePlus size={18} strokeWidth={1.5} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex-1" />

            <Button
              onClick={handleSubmit}
              disabled={!body.trim() || submitting || uploading}
              size="sm"
            >
              {submitting ? "Posting…" : "Post"}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
