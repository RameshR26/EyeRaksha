const rawApiUrl = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
const API_BASE_URL = rawApiUrl.startsWith("http") && !rawApiUrl.endsWith("/api")
  ? `${rawApiUrl}/api`
  : rawApiUrl;

export class ScreeningApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ScreeningApiError";
    this.status = status;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch {
    throw new ScreeningApiError("Screening service is unavailable. Start the backend and verify VITE_API_BASE_URL.");
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ScreeningApiError(body.message || body.error || "The screening service could not complete this request.", response.status);
  return body;
}

function validateScreeningResult(result) {
  if (!result || result.status !== "success" || !result.quality) throw new ScreeningApiError("The backend returned an invalid screening response.");
  if (result.quality.gradable === false) return result;
  const required = ["prediction", "level", "confidence", "referable", "probabilities"];
  if (required.some((key) => result[key] === undefined || result[key] === null)) throw new ScreeningApiError("The backend response is missing required model-inference fields.");
  return result;
}

export async function analyzeImage(file, onProgress) {
  if (!(file instanceof File)) throw new ScreeningApiError("Select a retinal JPG or PNG image before analysis.");
  if (file.size > 15 * 1024 * 1024) throw new ScreeningApiError("Image exceeds the 15 MB upload limit.");
  onProgress?.("Uploading retinal image");
  const formData = new FormData();
  formData.append("image", file, file.name);
  const result = await request("/screen", { method: "POST", body: formData });
  onProgress?.(result.quality?.gradable === false ? "Quality assessment complete" : "Analysis complete");
  return validateScreeningResult(result);
}

export const getAnalytics = () => request("/analytics");
export const getHistory = () => request("/screenings");
export const getScreening = (screeningId) => request(`/screenings/${screeningId}`);
export const getSystemStatus = () => request("/status");

// Review and report helpers
export const getReview = (screeningId) => request(`/screenings/${screeningId}/review`);
export const postReview = (screeningId, payload) => request(`/screenings/${screeningId}/review`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "Accept": "application/json" },
  body: JSON.stringify(payload)
});
export const getBackendOrigin = () => {
  const url = import.meta.env.VITE_API_BASE_URL || "/api";
  if (url.startsWith("http")) {
    return url.replace(/\/api\/?$/, "");
  }
  return "";
};

export const getResultImageUrl = (screeningId, filename) => {
  const origin = getBackendOrigin();
  return `${origin}/results/${screeningId}/${filename}`;
};

export const getReport = (screeningId) => `${API_BASE_URL}/screenings/${screeningId}/report`; // URL for downloading report

// Transparent planning calculation; not a model or measured deployment result.
export function getSimulation(yearlyPatients = 100000) {
  const arrival = yearlyPatients / 365;
  const aiCapacity = 420;
  const reviewerCapacity = 180;
  const queue = Math.max(0, Math.round(arrival - reviewerCapacity));
  return { yearlyPatients, arrivalPerDay: Math.round(arrival), aiCapacity, reviewerCapacity, processingSeconds: 18, queue, waitingMinutes: Math.max(2, Math.round((queue / Math.max(1, reviewerCapacity)) * 60)), utilization: Math.min(100, Math.round((arrival / aiCapacity) * 100)), networkDelay: yearlyPatients >= 150000 ? 3.8 : yearlyPatients >= 100000 ? 2.6 : 1.4 };
}
