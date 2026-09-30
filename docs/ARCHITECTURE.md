# Architecture

```text
React/Vite browser -> Node API adapter -> MATLAB-compatible screening adapter -> runDRScreening -> trained model
                                      -> stored evaluation/review service (future configured module)
```

The React client sends a multipart upload to `/api/screen`. `backend/server.js` contains no AI logic and no fallback prediction: it forwards that request to `MATLAB_SCREENING_ADAPTER_URL`. This adapter must invoke the real MATLAB `runDRScreening` pipeline and map its result to [API_CONTRACT.md](API_CONTRACT.md).

Start the local adapter:

```powershell
$env:MATLAB_SCREENING_ADAPTER_URL="http://your-matlab-adapter/api/screen"
npm.cmd run server
```

If it is unset, `POST /api/screen` returns HTTP 503. Configure the frontend for this local adapter with `VITE_API_BASE_URL=http://127.0.0.1:8080/api`.

For production, deploy a protected MATLAB Production Server/Compiler SDK integration behind authentication, request-size limits, encrypted transport, persistent audited storage, and a reviewed privacy/security design. This repository does not claim such compliance.
