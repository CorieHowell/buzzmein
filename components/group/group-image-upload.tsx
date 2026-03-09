"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface GroupImageUploadProps {
  initialUrl?: string | null;
}

export function GroupImageUpload({ initialUrl }: GroupImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl ?? null);
  const [uploadedUrl, setUploadedUrl] = useState<string>(initialUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploading(true);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `groups/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("covers")
        .upload(path, file, { upsert: false });

      if (error) throw error;

      const { data } = supabase.storage.from("covers").getPublicUrl(path);
      setUploadedUrl(data.publicUrl);
    } catch (err) {
      console.error("Image upload failed:", err);
      // Remove preview on failure
      setPreviewUrl(null);
      setUploadedUrl("");
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    setPreviewUrl(null);
    setUploadedUrl("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Hidden form field carries the uploaded URL */}
      <input type="hidden" name="cover_image_url" value={uploadedUrl} />

      {/* Circular picker */}
      <div className="relative">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-secondary transition-opacity active:opacity-70 disabled:opacity-50"
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Group cover"
              className="h-full w-full object-cover"
            />
          ) : (
            <Camera size={28} className="text-muted-foreground" strokeWidth={1.5} />
          )}
        </button>

        {/* Remove button */}
        {previewUrl && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-white shadow-sm transition-opacity active:opacity-70"
            aria-label="Remove photo"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {uploading ? "Uploading…" : "Tap to add a photo (optional)"}
      </p>
    </div>
  );
}
