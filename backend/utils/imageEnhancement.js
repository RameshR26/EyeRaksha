// backend/utils/imageEnhancement.js
// Uses sharp to perform a simple contrast‑enhancement on the uploaded fundus image.
// The function receives a Buffer of the original image and returns a Promise<Buffer>
// containing the enhanced PNG.

import sharp from 'sharp';

/**
 * Enhance a fundus image to improve visibility/contrast.
 * For now we use a straightforward linear contrast stretch.
 * If a more advanced algorithm (e.g., CLAHE) is desired, replace the pipeline.
 * @param {Buffer} inputBuffer - Original image buffer (JPEG/PNG)
 * @returns {Promise<Buffer>} - Enhanced image PNG buffer
 */
export async function enhanceImage(inputBuffer) {
  // Convert to PNG, increase contrast and slightly adjust brightness.
  // sharp's linear(a, b) can be used for contrast (a) and brightness (b).
  // We'll use a contrast factor of 1.2 and keep brightness unchanged.
  return sharp(inputBuffer)
    .png()
    .linear(1.2, 0) // contrast factor
    .toBuffer();
}
