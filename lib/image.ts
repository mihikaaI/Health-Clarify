/** Phone cameras make 4–12 MB photos. Shrinking them in the browser makes uploads faster on 4G and keeps them under the size limit. */
export const MAX_IMAGE_SIDE = 2200;
const KEEP_AS_IS_BYTES = 1_500_000;
const QUALITY = 0.85;

export async function prepareImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || typeof createImageBitmap === 'undefined') return file;
  try {
    // 'from-image' applies the camera's rotation, so a portrait photo is not sent sideways.
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const longest = Math.max(bitmap.width, bitmap.height);
    if (longest <= MAX_IMAGE_SIDE && file.size <= KEEP_AS_IS_BYTES) { bitmap.close(); return file; }
    const scale = Math.min(1, MAX_IMAGE_SIDE / longest);
    const canvas = window.document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) { bitmap.close(); return file; }
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); // transparent PNGs become white, not black
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY));
    canvas.width = 0; canvas.height = 0;
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg', lastModified: file.lastModified });
  } catch { return file; }
}
