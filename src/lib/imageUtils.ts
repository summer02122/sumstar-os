/**
 * Image processing & compression utility
 * Resizes and compresses images to lightweight PNG/JPEG.
 * Ensures instant loading, maximum favicon compatibility in Chrome/Brave/Edge, and prevents storage quota issues.
 */
export async function processAndCompressImage(
  file: File, 
  maxWidth = 360, 
  maxHeight = 360, 
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as PNG for guaranteed browser tab favicon and UI compatibility
        const pngData = canvas.toDataURL('image/png');
        resolve(pngData);
      };
      img.onerror = () => resolve(readerEvent.target?.result as string);
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Updates the browser tab favicon in Chrome/Edge/Brave/Firefox
 */
export function setBrowserFavicon(url: string) {
  if (typeof document === 'undefined' || !url) return;

  try {
    const applyFavicon = (pngUrl: string) => {
      const head = document.head || document.getElementsByTagName('head')[0];
      if (!head) return;

      const oldLinks = head.querySelectorAll("link[rel*='icon'], link[rel='apple-touch-icon']");
      oldLinks.forEach(el => el.remove());

      const link = document.createElement('link');
      link.type = 'image/png';
      link.rel = 'icon';
      link.href = pngUrl;
      head.appendChild(link);

      const shortcutLink = document.createElement('link');
      shortcutLink.type = 'image/png';
      shortcutLink.rel = 'shortcut icon';
      shortcutLink.href = pngUrl;
      head.appendChild(shortcutLink);
    };

    // If it's a data URL or image url, draw to 64x64 PNG canvas to force browser cache refresh
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, 64, 64);
        const pngData = canvas.toDataURL('image/png');
        applyFavicon(pngData);
      } else {
        applyFavicon(url);
      }
    };
    img.onerror = () => applyFavicon(url);
    img.src = url;
  } catch (e) {
    console.warn('Failed to set favicon:', e);
  }
}
