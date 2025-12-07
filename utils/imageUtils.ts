import { PixelCrop } from '../types';

/**
 * Loads an image from a source URL/String into an HTMLImageElement.
 */
export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

/**
 * Crops the image and adds the text overlay.
 * Returns a base64 string (PNG format) which serves as the preview.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: PixelCrop,
  text: string,
  outputSize: number = 256
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Set standard icon size (e.g., 256x256 is good for high res icons)
  canvas.width = outputSize;
  canvas.height = outputSize;

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  // Overlay Text Logic
  if (text && text.trim().length > 0) {
    const fontSize = outputSize * 0.45; // Text is 45% of height
    ctx.font = `900 ${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    
    // Position: Bottom Right with padding
    const x = outputSize - (outputSize * 0.05);
    const y = outputSize + (outputSize * 0.02); // Slight adjustment for baseline

    // Stroke (Outline) for visibility
    ctx.strokeStyle = 'black';
    ctx.lineWidth = outputSize * 0.08;
    ctx.strokeText(text.toUpperCase().slice(0, 3), x, y);

    // Fill Color
    ctx.fillStyle = 'white';
    ctx.fillText(text.toUpperCase().slice(0, 3), x, y);
  }

  return canvas.toDataURL('image/png');
}

/**
 * Converts a PNG Base64 string to an ICO Blob.
 * It wraps the PNG data in a valid ICO header.
 */
export const convertPngToIco = (base64Png: string): Blob => {
  const byteString = atob(base64Png.split(',')[1]);
  const mimeString = base64Png.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  const pngBlob = new Blob([ab], { type: mimeString });
  
  // ICO Header (6 bytes)
  // Reserved (2), Type (2) [1=Icon], Count (2) [1 image]
  const header = new Uint8Array([0, 0, 1, 0, 1, 0]);
  
  // Directory Entry (16 bytes)
  // Width(1), Height(1), Colors(1), Reserved(1), Planes(2), BPP(2), Size(4), Offset(4)
  // Note: 0 width/height means 256px
  const imageSize = pngBlob.size;
  const directory = new Uint8Array(16);
  const view = new DataView(directory.buffer);
  
  view.setUint8(0, 0); // Width 256
  view.setUint8(1, 0); // Height 256
  view.setUint8(2, 0); // Colors (0 = No palette)
  view.setUint8(3, 0); // Reserved
  view.setUint16(4, 1, true); // Planes
  view.setUint16(6, 32, true); // BPP
  view.setUint32(8, imageSize, true); // Size of image data
  view.setUint32(12, 22, true); // Offset (6 header + 16 directory)

  return new Blob([header, directory, pngBlob], { type: 'image/x-icon' });
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
