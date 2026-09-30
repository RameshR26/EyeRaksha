# SIH26038 — EyeRaksha

AI-assisted diabetic-retinopathy screening research prototype for Smart India Hackathon. It never creates mock clinical predictions: screening is unavailable until a real trained model and MATLAB-compatible backend are configured.

## Quick start (Windows)

```powershell
npm.cmd run dev
npm.cmd run build
```

For the local API adapter:

```powershell
$env:MATLAB_SCREENING_ADAPTER_URL="http://your-matlab-adapter/api/screen"
npm.cmd run server
```

Set `VITE_API_BASE_URL=http://127.0.0.1:8080/api` in `.env.local` when using that adapter.

## Workflow

1. Prepare permitted real images: [DATASET.md](docs/DATASET.md).
2. Train the MATLAB model: [MODEL_TRAINING.md](docs/MODEL_TRAINING.md).
3. Evaluate the held-out test split: [VALIDATION.md](docs/VALIDATION.md).
4. Run real inference/reports: [MATLAB.md](docs/MATLAB.md).
5. Deploy an adapter conforming to [API_CONTRACT.md](docs/API_CONTRACT.md).

See [ARCHITECTURE.md](docs/ARCHITECTURE.md), [PREPROCESSING.md](docs/PREPROCESSING.md), [IMAGE_QUALITY.md](docs/IMAGE_QUALITY.md), [XAI.md](docs/XAI.md), and [SIMULINK.md](docs/SIMULINK.md).

## Safety

This tool provides AI-assisted diabetic-retinopathy screening and is not a substitute for examination or diagnosis by a qualified eye-care professional. No clinical-performance claim is valid until it has been measured and appropriately validated.
