// backend/utils/gradcam.js
// Simple placeholder Grad‑CAM overlay generator.
// Generates a semi‑transparent red heatmap PNG with the same dimensions as the input image.
// In a real deployment this would be replaced by MATLAB‑provided overlay.

import sharp from 'sharp';

/**
 * Generate a dummy Grad‑CAM overlay.
 * @param {number} width  Width of the original image.
 * @param {number} height Height of the original image.
 * @returns {Promise<Buffer>} PNG buffer of the overlay.
 */
export async function generateGradCamOverlay(width, height) {
  // Create a red gradient using raw pixel data.
  const overlay = Buffer.alloc(width * height * 4); // RGBA
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Simple radial gradient: stronger red towards centre.
      const dx = x - width / 2;
      const dy = y - height / 2;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDist = Math.sqrt((width / 2) ** 2 + (height / 2) ** 2);
      const intensity = Math.max(0, 1 - distance / maxDist);
      overlay[idx] = 255; // Red channel
      overlay[idx + 1] = 0; // Green
      overlay[idx + 2] = 0; // Blue
      overlay[idx + 3] = Math.round(150 * intensity); // Alpha (0‑150)
    }
  }
  return sharp(overlay, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
}
