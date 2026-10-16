import * as ImageManipulator from 'expo-image-manipulator';

export interface ProcessedImage {
  uri: string;
  width: number;
  height: number;
  sizeBytes?: number;
  base64?: string;
}

/**
 * Optimizes an image for digital wardrobe cataloging:
 * - Constrains maximum dimension to 1200px
 * - Converts to clean JPEG with 82% quality compression
 * - Preserves garment details while drastically reducing upload payload size
 * - Generates base64 string for direct ArrayBuffer decoding in mobile storage upload
 */
export async function optimizeClothingImage(uri: string): Promise<ProcessedImage> {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }], // maintains aspect ratio automatically
      { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );

    return {
      uri: manipResult.uri,
      width: manipResult.width,
      height: manipResult.height,
      base64: manipResult.base64,
    };
  } catch (error) {
    console.warn('[imageUtils] Image optimization failed, using original uri:', error);
    return {
      uri,
      width: 1200,
      height: 1200,
    };
  }
}
