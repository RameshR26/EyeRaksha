import { createServer } from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { enhanceImage } from "./utils/imageEnhancement.js";
import Busboy from "busboy";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const resultsDir = path.join(rootDir, "results");


const port = Number(process.env.PORT || 8080);
const screeningUrl = process.env.MATLAB_SCREENING_ADAPTER_URL || "http://127.0.0.1:5000/api/screen";
const allowedOrigins = new Set((process.env.CORS_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean));
const maxUploadBytes = 15 * 1024 * 1024;
const acceptedImageTypes = new Set(["image/jpeg", "image/png"]);
const screenings = [];

function isAllowedOrigin(origin) {
  return Boolean(origin) && (allowedOrigins.has(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || origin.endsWith(".onrender.com"));
}

function respond(res, status, body) {
  const requestOrigin = res.req?.headers.origin;
  const allowedOrigin = isAllowedOrigin(requestOrigin)
    ? requestOrigin
    : [...allowedOrigins][0];
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": allowedOrigin,
    "Cache-Control": "no-store",
    "Vary": "Origin"
  });
  res.end(JSON.stringify(body));
}

function validateUploadHeaders(req) {
  const contentType = (req.headers["content-type"] || "").split(";", 1)[0].toLowerCase();
  if (contentType !== "multipart/form-data") {
    return "Upload must use multipart/form-data with an image field.";
  }
  if (!req.headers["content-type"]?.includes("boundary=")) {
    return "Multipart upload boundary is missing.";
  }
  const contentLength = Number(req.headers["content-length"]);
  if (Number.isFinite(contentLength) && contentLength > maxUploadBytes + 1024 * 1024) {
    return "Image exceeds the 15 MB upload limit.";
  }
  return null;
}

function readImageUpload(req) {
  return new Promise((resolve, reject) => {
    const headerError = validateUploadHeaders(req);
    if (headerError) return reject(Object.assign(new Error(headerError), { statusCode: 400 }));
    let imageFound = false;
    let imageType = "";
    let imageTooLarge = false;
    const chunks = [];
    let imageBytes = 0;
    let parser;
    try {
      parser = Busboy({ headers: req.headers, limits: { files: 1, fileSize: maxUploadBytes } });
    } catch (error) {
      return reject(Object.assign(new Error("Invalid multipart upload."), { statusCode: 400, cause: error }));
    }
    parser.on("file", (fieldName, file, info) => {
      if (fieldName !== "image") {
        file.resume();
        return;
      }
      imageFound = true;
      imageType = (info.mimeType || "").toLowerCase();
      file.on("data", (chunk) => {
        imageBytes += chunk.length;
        chunks.push(chunk);
      });
      file.on("limit", () => { imageTooLarge = true; });
    });
    parser.on("error", (error) => reject(Object.assign(new Error("Invalid multipart upload."), { statusCode: 400, cause: error })));
    parser.on("finish", () => {
      if (!imageFound) return reject(Object.assign(new Error("Upload must include an image field."), { statusCode: 400 }));
      if (!acceptedImageTypes.has(imageType)) return reject(Object.assign(new Error("Only JPG and PNG images are supported."), { statusCode: 400 }));
      if (imageTooLarge || imageBytes > maxUploadBytes) return reject(Object.assign(new Error("Image exceeds the 15 MB upload limit."), { statusCode: 413 }));
      resolve({ body: Buffer.concat(chunks), imageType });
    });
    req.pipe(parser);
  });
}

function validateAdapterResult(result) {
  if (!result || result.status !== "success" || typeof result.screeningId !== "string" || !result.screeningId) {
    return "Python ML adapter returned an invalid screening envelope.";
  }
  if (!result.quality || typeof result.quality.gradable !== "boolean") {
    return "Python ML adapter returned an invalid image-quality result.";
  }
  if (!result.quality.gradable) return null;
  const required = ["prediction", "level", "confidence", "referable", "probabilities"];
  if (required.some((key) => result[key] === undefined || result[key] === null)) {
    return "Python ML adapter returned an incomplete model result.";
  }
  if (!Number.isInteger(result.level) || result.level < 0 || result.level > 4) {
    return "Python ML adapter returned an invalid DR level.";
  }
  if (typeof result.confidence !== "number" || result.confidence < 0 || result.confidence > 1) {
    return "Python ML adapter returned an invalid confidence value.";
  }
  const probabilities = Array.isArray(result.probabilities)
    ? result.probabilities
    : Object.values(result.probabilities);
  if (probabilities.length !== 5 || probabilities.some((value) => typeof value !== "number" || value < 0 || value > 1)) {
    return "Python ML adapter returned invalid class probabilities.";
  }
  const probabilityTotal = probabilities.reduce((total, value) => total + value, 0);
  if (Math.abs(probabilityTotal - 1) > 0.02) return "Python ML adapter probabilities do not sum to 1.";
  return null;
}


function recordScreening(result) {
  if (result.status !== "success" || !result.screeningId) return;
  const quality = result.quality || {};
  screenings.unshift({
    id: result.screeningId,
    date: new Date().toISOString().slice(0, 10),
    quality: quality.status || (quality.gradable === false ? "POOR" : "UNKNOWN"),
    level: result.level ?? null,
    confidence: result.confidence == null ? null : Math.round(result.confidence * 100),
    referable: Boolean(result.referable),
    review: "Pending"
  });
  if (screenings.length > 500) screenings.pop();
}

function buildAnalytics() {
  const severity = [0, 1, 2, 3, 4].map((level) => ({
    name: `Level ${level}`,
    value: screenings.filter((record) => record.level === level).length
  }));
  const volume = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - offset));
    const day = date.toISOString().slice(0, 10);
    return { day: day.slice(5), value: screenings.filter((record) => record.date === day).length };
  });
  const gradable = screenings.filter((record) => record.level !== null);
  const poor = screenings.length - gradable.length;
  const referable = screenings.filter((record) => record.referable).length;
  return {
    totals: {
      screenings: screenings.length,
      today: screenings.filter((record) => record.date === new Date().toISOString().slice(0, 10)).length,
      referable,
      pending: screenings.filter((record) => record.review === "Pending").length,
      poor,
      avgTime: "Measured after adapter timing is added"
    },
    volume,
    severity,
    measured: true,
    referableRate: screenings.length ? referable / screenings.length : 0,
    qualityRate: screenings.length ? (screenings.length - poor) / screenings.length : 0
  };
}

async function proxyScreening(req, res) {
  if (!screeningUrl) return respond(res, 503, { message: "Model not trained yet or screening adapter is not configured." });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);
  try {
    const upload = await readImageUpload(req);
    const formData = new FormData();
    const extension = upload.imageType === "image/png" ? "png" : "jpg";
    formData.append("image", new Blob([upload.body], { type: upload.imageType }), `upload.${extension}`);
    const upstream = await fetch(screeningUrl, {
      method: "POST",
      headers: { accept: "application/json" },
      body: formData,
      signal: controller.signal
    });
    const responseText = await upstream.text();
    let body;
    try {
      body = JSON.parse(responseText);
    } catch {
      body = { message: "Python ML adapter returned invalid JSON." };
    }
    if (upstream.ok) {
      const resultError = validateAdapterResult(body);
      if (resultError) return respond(res, 502, { message: resultError });
      // Record basic screening metadata
      recordScreening(body);

      // If the result is gradable, generate assets (enhanced image and Model Evidence Map overlay)
      if (body.quality && body.quality.gradable) {
        const screeningId = body.screeningId;
        const resultDir = path.join(resultsDir, screeningId);
        await fs.mkdir(resultDir, { recursive: true });
        // Save original uploaded image as original.png
        await fs.writeFile(path.join(resultDir, "original.png"), upload.body);
        // Generate enhanced image
        const enhancedBuffer = await enhanceImage(upload.body);
        await fs.writeFile(path.join(resultDir, "enhanced.png"), enhancedBuffer);
        // Save full screening result for later use (report, review)
        await fs.writeFile(path.join(resultDir, "result.json"), JSON.stringify(body, null, 2));
      }
    }
    respond(res, upstream.status, body);
  } catch (error) {
    const status = error.statusCode || 503;
    const message = error.name === "AbortError" ? "Screening request timed out." : status < 500 ? error.message : "Python ML screening adapter is unavailable.";
    respond(res, status, { message });
  } finally {
    clearTimeout(timeout);
  }
}


createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    const requestOrigin = req.headers.origin;
    const allowedOrigin = isAllowedOrigin(requestOrigin)
      ? requestOrigin
      : [...allowedOrigins][0];
    res.writeHead(204, { "Access-Control-Allow-Origin": allowedOrigin, "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
    return res.end();
  }
  const url = new URL(req.url, `http://${req.headers.host}`);
  // Serve static result files (original, enhanced, gradcam)
  if ((req.method === "GET" || req.method === "HEAD") && url.pathname.startsWith("/results/")) {
    const relativePath = url.pathname.replace(/^\/results\/?/, "");
    const filePath = path.join(resultsDir, relativePath);
    try {
      const data = await fs.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const contentType = ext === ".png" ? "image/png" : ext === ".json" ? "application/json" : "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-store" });
      return res.end(data);
    } catch {
      return respond(res, 404, { message: "Result file not found." });
    }
  }
  if (req.method === "GET" && url.pathname === "/api/status") return respond(res, 200, {
    status: screeningUrl ? "adapter_configured" : "not_configured",
    modelInference: Boolean(screeningUrl),
    model: screeningUrl ? "Provided by Python ML adapter" : "Not loaded",
    calibration: screeningUrl ? "Reported by Python ML adapter" : "Unavailable",

    maxUploadBytes,
    acceptedImageTypes: [...acceptedImageTypes]
  });
  if (req.method === "GET" && url.pathname === "/api/screenings") return respond(res, 200, screenings);
  if (req.method === "GET" && /^\/api\/screenings\/([^\/]+)$/.test(url.pathname)) {
    const screeningId = url.pathname.match(/^\/api\/screenings\/([^\/]+)$/)[1];
    const resultPath = path.join(resultsDir, screeningId, "result.json");
    try {
      const data = await fs.readFile(resultPath, "utf8");
      return respond(res, 200, JSON.parse(data));
    } catch {
      const record = screenings.find(s => s.id === screeningId);
      if (record) return respond(res, 200, record);
      return respond(res, 404, { message: "Screening not found." });
    }
  }
  if (req.method === "GET" && url.pathname === "/api/analytics") {
    if (!screenings.length) return respond(res, 404, { message: "No screening results are available yet." });
    return respond(res, 200, buildAnalytics());
  }
  if (req.method === "POST" && url.pathname === "/api/screen") return proxyScreening(req, res);
  // New API: Get review data
    if (req.method === "GET" && /^\/api\/screenings\/([^\/]+)\/review$/.test(url.pathname)) {
      const screeningId = url.pathname.match(/^\/api\/screenings\/([^\/]+)\/review$/)[1];
      const reviewPath = path.join(resultsDir, screeningId, "review.json");
      try {
        const data = await fs.readFile(reviewPath, "utf8");
        return respond(res, 200, JSON.parse(data));
      } catch {
        return respond(res, 404, { message: "No review found for this screening." });
      }
    }
    // New API: Save review data
    if (req.method === "POST" && /^\/api\/screenings\/([^\/]+)\/review$/.test(url.pathname)) {
      const screeningId = url.pathname.match(/^\/api\/screenings\/([^\/]+)\/review$/)[1];
      // Validate Content-Type
      const ct = req.headers["content-type"] || "";
      if (!ct.includes("application/json")) {
        return respond(res, 400, { message: "Content-Type must be application/json." });
      }
      // Use UTF-8 encoding for simplicity
      req.setEncoding('utf8');
      let bodyData = '';
      req.on('data', chunk => {
        console.log('Received chunk length:', chunk.length);
        bodyData += chunk;
      });
      await new Promise(resolve => req.on('end', resolve));
      console.log('Total body length:', bodyData.length);
      // Debug: write raw payload to file
      const debugPath = path.join(resultsDir, screeningId, 'review_raw.txt');
      await fs.mkdir(path.dirname(debugPath), { recursive: true });
      await fs.writeFile(debugPath, bodyData);
      if (!bodyData) {
        return respond(res, 400, { message: "Empty review payload." });
      }
      try {
        const review = JSON.parse(bodyData);
        if (typeof review.status !== 'string' || typeof review.notes !== 'string') {
          return respond(res, 400, { message: "Review payload must include 'status' and 'notes' strings." });
        }
        review.reviewedAt = new Date().toISOString();
        const reviewPath = path.join(resultsDir, screeningId, 'review.json');
        await fs.mkdir(path.dirname(reviewPath), { recursive: true });
        await fs.writeFile(reviewPath, JSON.stringify(review, null, 2));

        // Update memory screening record
        const record = screenings.find(s => s.id === screeningId);
        if (record) {
          record.review = review.status;
          record.reviewerName = review.reviewerName || "Dr. R. Sharma, MD (Ophthalmology)";
          if (review.status === "Modified" && typeof review.modifiedLevel === "number") {
            record.modifiedLevel = review.modifiedLevel;
          }
          record.reviewedAt = review.reviewedAt;
        }

        // Update result.json envelope
        const resultPath = path.join(resultsDir, screeningId, 'result.json');
        try {
          const resultJson = JSON.parse(await fs.readFile(resultPath, 'utf8'));
          resultJson.review = review;
          await fs.writeFile(resultPath, JSON.stringify(resultJson, null, 2));
        } catch {}

        return respond(res, 200, { message: "Review saved successfully.", review });
      } catch {
        return respond(res, 400, { message: "Invalid review payload." });
      }
    }
    // New API: Generate HTML report
    if (req.method === "GET" && /^\/api\/screenings\/([^\/]+)\/report$/.test(url.pathname)) {
      const screeningId = url.pathname.match(/^\/api\/screenings\/([^\/]+)\/report$/)[1];
      const resultPath = path.join(resultsDir, screeningId, "result.json");
      try {
        const resultJson = JSON.parse(await fs.readFile(resultPath, "utf8"));
        const assets = resultJson.assets || {};
        const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Screening Report ${screeningId}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;max-width:800px;margin:auto;">
<h1>EyeRaksha / RetinaGuard AI – Diabetic Retinopathy Screening Report</h1>
<p><strong>Screening ID:</strong> ${screeningId}<br><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
<h2>AI‑assisted result</h2>
<p>DR severity: Level ${resultJson.level} – ${resultJson.prediction}<br>
Confidence: ${(resultJson.confidence * 100).toFixed(1)}%<br>
Referable DR: ${resultJson.referable ? "YES" : "NO"}<br>
Recommendation: ${resultJson.recommendation || ""}</p>
<h2>Image quality</h2>
<p>${resultJson.quality.status || "GRADABLE"} – ${resultJson.quality.score}%</p>
<h2>Probability distribution</h2>
<ul>
${Object.entries(resultJson.probabilities || {}).map(([k,v]) => `<li>${k}: ${(v*100).toFixed(1)}%</li>`).join("\n")}
</ul>
<h2>Evidence</h2>
<p>Model confidence – ${(resultJson.confidence*100).toFixed(1)}%</p>
<p>Referable threshold – ${resultJson.referable ? "YES" : "NO"}</p>
${resultJson.confidenceCalibration ? `<p>Confidence calibration – ${resultJson.confidenceCalibration}</p>` : ``}
<h2>Images</h2>
${`<div><img src="/results/${screeningId}/enhanced.png" alt="Enhanced Fundus" style="max-width:100%;"/></div>`}
${assets.gradcamOverlay ? `<div><img src="${assets.gradcamOverlay}" alt="Grad‑CAM" style="max-width:100%;"/></div>` : ``}
<div><img src="/results/${screeningId}/original.png" alt="Original" style="max-width:100%;"/></div>
<div class="disclaimer" style="margin-top:20px;color:#555;">
<p>This is an AI‑assisted screening result and is not a substitute for professional medical diagnosis.</p>
</div>
</body>
</html>`;
        res.writeHead(200, { "Content-Type": "text/html", "Cache-Control": "no-store", "Content-Disposition": `attachment; filename="report-${screeningId}.html"` });
        return res.end(html);
      } catch {
        return respond(res, 404, { message: "Report not available." });
      }
    }
    return respond(res, 404, { message: "API route not found." });
}).listen(port, process.env.HOST || "0.0.0.0", () => console.log(`EyeRaksha backend listening at http://${process.env.HOST || "0.0.0.0"}:${port}`));
