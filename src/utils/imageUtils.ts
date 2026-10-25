import * as ImageManipulator from 'expo-image-manipulator';

export interface ProcessedImage {
  uri: string;
  width: number;
  height: number;
  sizeBytes?: number;
  base64?: string;
}

/**
 * Resizes an image to 800 pixels wide, preserving aspect ratio, and saves a JPEG
 * at 70% quality. Returns its local URI, resulting dimensions, and base64 data.
 * On processing failure, returns the original URI with placeholder dimensions of
 * 1200 by 1200 pixels and no base64 data; the processing error is caught.
 */
export async function optimizeClothingImage(uri: string): Promise<ProcessedImage> {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 800 } }], // maintains aspect ratio automatically
      { compress: 0.70, format: ImageManipulator.SaveFormat.JPEG, base64: true }
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
