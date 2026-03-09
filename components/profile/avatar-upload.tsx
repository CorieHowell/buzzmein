"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateAvatarUrl, clearAvatarUrl } from "@/app/actions/profile";
import { Avatar } from "@/components/ui/avatar";

// ── Constants ─────────────────────────────────────────────────────────────────
const VIEWPORT_SIZE = 280; // crop circle diameter in CSS px
const OUTPUT_SIZE = 400; // exported jpeg size in px
const R = VIEWPORT_SIZE / 2; // 140

// ── Helpers ───────────────────────────────────────────────────────────────────
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function maxOffsets(nw: number, nh: number, s: number) {
  return {
    maxX: Math.max(0, (nw * s) / 2 - R),
    maxY: Math.max(0, (nh * s) / 2 - R),
  };
}

// ── Crop Editor ───────────────────────────────────────────────────────────────

interface CropEditorProps {
  file: File;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

function CropEditor({ file, onConfirm, onCancel }: CropEditorProps) {
  // Create the blob URL inside useEffect so React StrictMode's double-mount
  // cleanup doesn't revoke it before the <img> has a chance to load.
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Refs mirror state so event-handler closures never go stale
  const nsRef = useRef<{ w: number; h: number } | null>(null);
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);
  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  function handleImageLoad() {
    const img = imgRef.current!;
    const ns = { w: img.naturalWidth, h: img.naturalHeight };
    nsRef.current = ns;
    setNaturalSize(ns);
    const fillScale = VIEWPORT_SIZE / Math.min(ns.w, ns.h);
    scaleRef.current = fillScale;
    setScale(fillScale);
    offsetRef.current = { x: 0, y: 0 };
    setOffset({ x: 0, y: 0 });
  }

  // ── Gesture tracking ───────────────────────────────────────────────────────
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startOx: number;
    startOy: number;
  } | null>(null);
  const pinchRef = useRef<{ startDist: number; startScale: number } | null>(null);

  function pointerDist() {
    const pts = [...pointers.current.values()];
    return pts.length < 2 ? 0 : Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
  }

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 1) {
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startOx: offsetRef.current.x,
        startOy: offsetRef.current.y,
      };
      pinchRef.current = null;
    } else if (pointers.current.size === 2) {
      pinchRef.current = { startDist: pointerDist(), startScale: scaleRef.current };
      dragRef.current = null;
    }
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const ns = nsRef.current;
    if (!ns) return;

    if (pointers.current.size >= 2 && pinchRef.current) {
      // Pinch zoom
      const dist = pointerDist();
      const minScale = VIEWPORT_SIZE / Math.min(ns.w, ns.h);
      const newScale = Math.max(minScale, pinchRef.current.startScale * (dist / pinchRef.current.startDist));
      const f = newScale / scaleRef.current;
      const { maxX, maxY } = maxOffsets(ns.w, ns.h, newScale);
      const newOx = clamp(offsetRef.current.x * f, -maxX, maxX);
      const newOy = clamp(offsetRef.current.y * f, -maxY, maxY);
      scaleRef.current = newScale;
      offsetRef.current = { x: newOx, y: newOy };
      setScale(newScale);
      setOffset({ x: newOx, y: newOy });
    } else if (dragRef.current) {
      // Drag pan
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const { maxX, maxY } = maxOffsets(ns.w, ns.h, scaleRef.current);
      const newOx = clamp(dragRef.current.startOx + dx, -maxX, maxX);
      const newOy = clamp(dragRef.current.startOy + dy, -maxY, maxY);
      offsetRef.current = { x: newOx, y: newOy };
      setOffset({ x: newOx, y: newOy });
    }
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchRef.current = null;
    if (pointers.current.size === 0) dragRef.current = null;
  }, []);

  // Non-passive wheel listener (React wheel events can't call preventDefault reliably)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const ns = nsRef.current;
      if (!ns) return;
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const minScale = VIEWPORT_SIZE / Math.min(ns.w, ns.h);
      const newScale = Math.max(minScale, scaleRef.current * factor);
      const f = newScale / scaleRef.current;
      const { maxX, maxY } = maxOffsets(ns.w, ns.h, newScale);
      const newOx = clamp(offsetRef.current.x * f, -maxX, maxX);
      const newOy = clamp(offsetRef.current.y * f, -maxY, maxY);
      scaleRef.current = newScale;
      offsetRef.current = { x: newOx, y: newOy };
      setScale(newScale);
      setOffset({ x: newOx, y: newOy });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // ── Crop + export ──────────────────────────────────────────────────────────
  function handleConfirm() {
    const img = imgRef.current;
    const ns = nsRef.current;
    if (!img || !ns) return;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d")!;

    // Clip to circle so corners are transparent
    ctx.beginPath();
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    const ratio = OUTPUT_SIZE / VIEWPORT_SIZE;
    const s = scaleRef.current;
    const ox = offsetRef.current.x;
    const oy = offsetRef.current.y;
    ctx.drawImage(
      img,
      (R + ox - (ns.w * s) / 2) * ratio,
      (R + oy - (ns.h * s) / 2) * ratio,
      ns.w * s * ratio,
      ns.h * s * ratio
    );

    canvas.toBlob((blob) => { if (blob) onConfirm(blob); }, "image/jpeg", 0.92);
  }

  // Image position is fully computed in JS — easier to reason about than CSS transforms
  const imgStyle: React.CSSProperties = naturalSize
    ? {
        position: "absolute",
        left: R + offset.x - (naturalSize.w * scale) / 2,
        top: R + offset.y - (naturalSize.h * scale) / 2,
        width: naturalSize.w * scale,
        height: naturalSize.h * scale,
        userSelect: "none",
        pointerEvents: "none",
      }
    : { display: "none" };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-5 pb-5"
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 52px)" }}
      >
        <button
          onClick={onCancel}
          className="text-sm font-medium text-white/60 active:text-white/30"
        >
          Cancel
        </button>
        <span className="text-sm font-semibold text-white">Move and Scale</span>
        <button
          onClick={handleConfirm}
          className="text-sm font-semibold text-primary active:opacity-50"
        >
          Use Photo
        </button>
      </div>

      {/* Circular crop viewport */}
      <div className="flex flex-1 items-center justify-center">
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-full ring-2 ring-white/25 cursor-grab active:cursor-grabbing"
          style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE, touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* Loading spinner — shown while blob URL is being created or image dimensions are unknown */}
          {(!blobUrl || !naturalSize) && (
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            </div>
          )}

          {/* The image — rendered once blobUrl is ready so onLoad fires */}
          {blobUrl && (
            <img
              ref={imgRef}
              src={blobUrl}
              alt="Crop preview"
              onLoad={handleImageLoad}
              draggable={false}
              style={imgStyle}
            />
          )}
        </div>
      </div>

      {/* Hint */}
      <div
        className="pt-4 text-center"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 32px)" }}
      >
        <p className="text-xs text-white/30">Drag to reposition · Pinch or scroll to zoom</p>
      </div>
    </div>
  );
}

// ── Photo Action Sheet ────────────────────────────────────────────────────────

interface PhotoActionSheetProps {
  hasPhoto: boolean;
  onTakePhoto: () => void;
  onChooseLibrary: () => void;
  onRemovePhoto: () => void;
  onDismiss: () => void;
}

function PhotoActionSheet({
  hasPhoto,
  onTakePhoto,
  onChooseLibrary,
  onRemovePhoto,
  onDismiss,
}: PhotoActionSheetProps) {
  return (
    // Scrim — tap outside to dismiss
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-end"
      onClick={onDismiss}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Sheet content — stop propagation so tapping buttons doesn't dismiss */}
      <div
        className="relative z-10 px-4"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 24px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Action group */}
        <div className="mb-3 divide-y divide-black/10 overflow-hidden rounded-2xl bg-white/95 shadow-2xl">
          <button
            className="flex w-full items-center justify-center py-4 text-[17px] text-primary transition-colors active:bg-black/5"
            onClick={onTakePhoto}
          >
            Take Photo
          </button>
          <button
            className="flex w-full items-center justify-center py-4 text-[17px] text-primary transition-colors active:bg-black/5"
            onClick={onChooseLibrary}
          >
            Choose from Library
          </button>
          {hasPhoto && (
            <button
              className="flex w-full items-center justify-center py-4 text-[17px] text-destructive transition-colors active:bg-black/5"
              onClick={onRemovePhoto}
            >
              Remove Photo
            </button>
          )}
        </div>

        {/* Cancel */}
        <button
          className="flex w-full items-center justify-center rounded-2xl bg-white/95 py-4 text-[17px] font-bold text-ink shadow-2xl transition-colors active:bg-black/5"
          onClick={onDismiss}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── AvatarUpload (main export) ────────────────────────────────────────────────

interface AvatarUploadProps {
  userId: string;
  currentUrl: string | null;
  displayName: string;
}

export function AvatarUpload({ userId, currentUrl, displayName }: AvatarUploadProps) {
  const libraryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openInput(type: "camera" | "library") {
    setMenuOpen(false);
    // Short delay lets the action sheet animate out before the system dialog appears
    setTimeout(() => {
      if (type === "camera") cameraRef.current?.click();
      else libraryRef.current?.click();
    }, 150);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // allow re-selecting the same file next time
    setCropFile(file);
  }

  async function handleCropConfirm(blob: Blob) {
    setCropFile(null);
    setUploading(true);
    setError(null);

    try {
      const localUrl = URL.createObjectURL(blob);
      setPreviewUrl(localUrl);

      const supabase = createClient();
      const path = `${userId}/${crypto.randomUUID()}.jpg`;
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      await updateAvatarUrl(publicUrl);
      setPreviewUrl(publicUrl);
    } catch (err) {
      console.error("[avatar] upload failed:", err);
      const msg =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      setPreviewUrl(currentUrl);
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  async function handleRemovePhoto() {
    setMenuOpen(false);
    setUploading(true);
    setError(null);
    setPreviewUrl(null);
    try {
      await clearAvatarUrl();
    } catch {
      setError("Could not remove photo.");
      setPreviewUrl(currentUrl);
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      {/* Avatar ring + pencil badge */}
      <div className="relative inline-block">
        <Avatar src={previewUrl} displayName={displayName} size="xl" />

        {/* Upload spinner overlay */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
        )}

        {/* Edit badge — sits on the bottom-right border of the circle */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          disabled={uploading}
          aria-label="Edit profile photo"
          className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-ink text-white shadow-md transition-transform active:scale-90 disabled:opacity-40"
        >
          <Pencil size={12} strokeWidth={2.5} />
        </button>
      </div>

      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}

      {/* Hidden file inputs */}
      <input
        ref={libraryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        onChange={handleFileChange}
      />
      {/* capture="user" triggers front-facing camera directly on mobile */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* iOS-style action sheet */}
      {menuOpen && (
        <PhotoActionSheet
          hasPhoto={!!previewUrl}
          onTakePhoto={() => openInput("camera")}
          onChooseLibrary={() => openInput("library")}
          onRemovePhoto={handleRemovePhoto}
          onDismiss={() => setMenuOpen(false)}
        />
      )}

      {/* Full-screen crop editor */}
      {cropFile && (
        <CropEditor
          file={cropFile}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropFile(null)}
        />
      )}
    </>
  );
}
