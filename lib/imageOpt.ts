// Simple client-side image optimization utility.
// Uses an offscreen canvas to resize large images and compress to JPEG/WEBP.
// Future improvements: orientation fix via EXIF, progressive JPEG, avif.

export interface OptimizeOptions {
  maxWidth?: number; // target max width (px)
  maxHeight?: number; // target max height (px)
  quality?: number; // 0-1
  format?: 'image/jpeg' | 'image/webp';
}

export async function optimizeImage(file: File, options: OptimizeOptions = {}): Promise<File> {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.85, format } = options;

  // Only attempt for images the browser can draw
  if (!file.type.startsWith('image/')) return file;

  const dataUrl = await fileToDataUrl(file);
  const img = await loadImage(dataUrl);

  const { targetW, targetH } = computeSize(img.width, img.height, maxWidth, maxHeight);

  // If no resize and file is already smaller than threshold and JPEG, skip
  const shouldResize = targetW !== img.width || targetH !== img.height;
  const desiredFormat = format || (file.type === 'image/png' ? 'image/webp' : 'image/jpeg');

  if (!shouldResize && file.type === desiredFormat && file.size < 800 * 1024) {
    return file; // already reasonable
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;

  // High quality scaling hint
  (ctx as any).imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, desiredFormat, quality));
  if (!blob) return file;

  // Name conversion: keep base, change extension if format changed
  const newExt = desiredFormat === 'image/webp' ? 'webp' : 'jpg';
  const baseName = file.name.replace(/\.[^.]+$/, '');
  const optimizedFile = new File([blob], `${baseName}.${newExt}`, { type: desiredFormat, lastModified: Date.now() });
  return optimizedFile;
}

function computeSize(w: number, h: number, maxW: number, maxH: number) {
  let targetW = w;
  let targetH = h;
  if (w > maxW || h > maxH) {
    const ratio = Math.min(maxW / w, maxH / h);
    targetW = Math.round(w * ratio);
    targetH = Math.round(h * ratio);
  }
  return { targetW, targetH };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onerror = () => rej(reader.error);
    reader.onload = () => res(reader.result as string);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = (e) => rej(e);
    img.src = src;
  });
}
