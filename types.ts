export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HistoryItem {
  id: string;
  originalImage: string; // Base64 or Blob URL
  croppedImage: string | null; // Base64 of the cropped version (no text)
  previewUrl: string; // Base64 of the final version (with text)
  text: string;
  timestamp: number;
  cropArea: PixelCrop; // Saved to allow re-editing crop if needed
}

export interface IcoHeader {
  width: number;
  height: number;
}
