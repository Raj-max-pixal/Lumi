export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const VIDEO_TYPES = ["video/mp4", "video/webm"];
export const IMAGE_MAX_BYTES = 15 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024;

export function uploadValidationError(file: File, kind: "image" | "post" | "project" | "story"): string | null {
  const isImage = IMAGE_TYPES.includes(file.type);
  const isVideo = VIDEO_TYPES.includes(file.type);
  if (!isImage && !(kind === "post" && isVideo)) return kind === "post" ? "Choose a JPEG, PNG, WebP, GIF, MP4, or WebM file." : "Choose a JPEG, PNG, WebP, or GIF image.";
  const maxBytes = kind === "project" ? 5 * 1024 * 1024 : isVideo ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
  if (file.size <= 0 || file.size >= maxBytes) return `File must be smaller than ${maxBytes / 1024 / 1024} MB.`;
  return null;
}

export function uploadFileName(file: File): string {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
    "video/mp4": "mp4", "video/webm": "webm"
  };
  return `${crypto.randomUUID()}.${extensions[file.type] ?? "bin"}`;
}
