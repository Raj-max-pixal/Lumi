const MAX_INLINE_IMAGE_LENGTH = 150000;
export const MAX_AVATAR_IMAGE_LENGTH = 32000;

export function normalizeExternalImageUrl(value: string) {
  const trimmed = value.trim();
  try {
    const outer = new URL(trimmed);
    const embedded = outer.searchParams.get("imgurl");
    const candidate = embedded ? decodeURIComponent(embedded) : trimmed;
    const parsed = new URL(candidate);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password && candidate.length <= 2048 ? candidate : null;
  } catch {
    return null;
  }
}

export function isInlineImage(value: string) {
  return value.startsWith("data:image/jpeg;base64,") && value.length <= MAX_INLINE_IMAGE_LENGTH;
}

export function isAvatarImage(value: string) {
  return value.startsWith("data:image/jpeg;base64,") && value.length <= MAX_AVATAR_IMAGE_LENGTH;
}

export function isDisplayableImageSource(value: string) {
  return Boolean(normalizeExternalImageUrl(value) || isInlineImage(value));
}

export async function compressGalleryImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file from your gallery.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Choose an image smaller than 8 MB.");

  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const next = new Image();
    next.onerror = () => reject(new Error("The image could not be prepared."));
    next.onload = () => resolve(next);
    next.src = source;
  });
  const scale = Math.min(1, 640 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  const result = canvas.toDataURL("image/jpeg", 0.68);
  if (!isInlineImage(result)) throw new Error("This image is still too large. Choose a smaller photo.");
  return result;
}

export async function compressAvatarImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Choose a photo from your gallery.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Choose a photo smaller than 8 MB.");

  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The photo could not be read."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const next = new Image();
    next.onerror = () => reject(new Error("The photo could not be prepared."));
    next.onload = () => resolve(next);
    next.src = source;
  });
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 160;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare this photo.");
  const side = Math.min(image.width, image.height);
  context.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, 160, 160);
  for (const quality of [0.72, 0.58, 0.44, 0.3]) {
    const result = canvas.toDataURL("image/jpeg", quality);
    if (isAvatarImage(result)) return result;
  }
  throw new Error("This photo is too detailed for a profile avatar. Choose a simpler photo.");
}
