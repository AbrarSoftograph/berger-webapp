import pako from "pako";

/**
 * Decompress a base64 + gzip compressed mask into a 2D boolean array.
 * @param encodedData Base64 encoded compressed mask
 * @param shape [height, width] of the mask
 * @returns 2D boolean array representing the mask
 */
export function decompressMask(
  encodedData: string,
  shape: [number, number]
): boolean[][] {
  // Decode base64 to Uint8Array
  const compressed = Uint8Array.from(atob(encodedData), (c) => c.charCodeAt(0));

  // Decompress gzip
  const decompressed = pako.inflate(compressed);

  const [height, width] = shape;
  const boolArray: boolean[][] = [];
  let bitIndex = 0;

  for (let y = 0; y < height; y++) {
    boolArray[y] = [];
    for (let x = 0; x < width; x++) {
      const byteIndex = Math.floor(bitIndex / 8);
      const bitOffset = bitIndex % 8;

      // Get the bit from the current byte
      const byte = decompressed[byteIndex];
      const bit = (byte >> (7 - bitOffset)) & 1;

      boolArray[y][x] = bit === 1;
      bitIndex++;
    }
  }

  return boolArray;
}
