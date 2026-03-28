/**
 * Compresses an image to fit within Firestore's 1MB document limit.
 * @param base64 The original base64 image string.
 * @param maxWidth The maximum width for the compressed image.
 * @param quality The quality of the JPEG compression (0 to 1).
 * @returns A promise that resolves to the compressed base64 string.
 */
export async function compressImage(base64: string, maxWidth = 1200, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      
      // Try to get a JPEG version to save space
      const compressed = canvas.toDataURL('image/jpeg', quality);
      
      // If the compressed version is still too large (> 1MB), recursively compress more
      if (compressed.length > 1048576) {
        resolve(compressImage(compressed, maxWidth * 0.8, quality * 0.8));
      } else {
        resolve(compressed);
      }
    };
    img.onerror = (err) => reject(err);
  });
}
