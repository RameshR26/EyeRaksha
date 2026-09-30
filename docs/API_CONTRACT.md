# Screening API contract

The frontend calls a real screening backend at `VITE_API_BASE_URL`, or `/api` when the variable is not configured. It never creates clinical predictions, probabilities, quality scores, or Grad-CAM output locally.

## `POST /api/screen`

Send `multipart/form-data` with one `image` field. Accept JPG/JPEG/PNG only; the frontend restricts uploads to 15 MB, and the backend must validate again.

For a non-gradable image, return HTTP `200` with no prediction fields:

```json
{
  "status": "success",
  "screeningId": "DR-2026-001",
  "quality": { "gradable": false, "score": 46, "status": "POOR" },
  "messages": ["Image too blurry.", "Hold the camera steady and capture the complete retinal field."]
}
```

For an acceptable image, every model-derived value must come from the loaded trained model and the actual uploaded image:

```json
{
  "status": "success",
  "screeningId": "DR-2026-001",
  "quality": {
    "gradable": true,
    "score": 87,
    "status": "GOOD",
    "focus": 86,
    "brightness": 79,
    "illumination": 82,
    "retinalArea": 91
  },
  "prediction": "Moderate DR",
  "level": 2,
  "confidence": 0.91,
  "confidenceCalibration": "uncalibrated",
  "referable": true,
  "probabilities": { "0": 0.02, "1": 0.05, "2": 0.91, "3": 0.01, "4": 0.01 },
  "recommendation": "Ophthalmologist review recommended.",
  "assets": { "enhancedImage": "/results/DR-2026-001/enhanced.png", "gradcamOverlay": "/results/DR-2026-001/gradcam-overlay.png" },
  "messages": []
}
```

Return `400` for invalid input, `422` for unreadable images, `503` when no trained model is loaded, and `500` only for unexpected server failures. All failures must contain a user-safe `message` field.

## Other endpoints

- `GET /api/status` — backend and model availability; must disclose model/calibration state.
- `GET /api/screenings` — stored screening records, with no fabricated records.
- `GET /api/analytics` — measured aggregate/evaluation data only. Return `404` with a message if no evaluation exists.

## Configuration

Create `.env.local` in the project root only when the backend is on a different origin:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

Do not put secrets in Vite environment variables: they are exposed to browsers.
