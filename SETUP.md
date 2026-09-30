# EyeRaksha - Complete Setup Guide

This guide shows you how to run the EyeRaksha system with the mock screening adapter for development/testing.

## Step 1: Install Dependencies

### Frontend & Backend
```powershell
npm install
npm install --save-dev
cd backend
npm install
cd ..
```

### Mock Adapter Dependencies
```powershell
cd "C:\Users\Ramesh Rathod\Desktop\SIH project\EyeRaksha"
& "C:\Users\Ramesh Rathod\AppData\Local\Programs\Python\Python313\python.exe" -m pip install flask pillow numpy
```

## Step 2: Start Services (Open 3 Terminal Windows)

### Terminal 1 - Mock Screening Adapter (Python)
```powershell
cd "C:\Users\Ramesh Rathod\Desktop\SIH project\EyeRaksha"
& "C:\Users\Ramesh Rathod\AppData\Local\Programs\Python\Python313\python.exe" mock_adapter.py
```
✓ Should say: "Mock Screening Adapter starting on http://127.0.0.1:5000"

### Terminal 2 - Backend API Server (Node.js)
```powershell
cd "C:\Users\Ramesh Rathod\Desktop\SIH project\EyeRaksha"
$env:MATLAB_SCREENING_ADAPTER_URL="http://127.0.0.1:5000/api/screen"
npm run server
```
✓ Should say: "EyeRaksha backend listening at http://127.0.0.1:8080"

### Terminal 3 - Frontend Development Server (Vite)
```powershell
cd "C:\Users\Ramesh Rathod\Desktop\SIH project\EyeRaksha"
npm run dev
```
✓ Should say: "ready in XXX ms"

## Step 3: Use the Application

1. Open browser to: **http://localhost:5173**
2. Navigate to **Screening** section
3. Upload a retinal fundus image (JPG or PNG)
4. Click **Analyze Image**
5. View the results with:
   - Quality assessment
   - DR level classification (0-4)
   - Confidence score
   - Recommendation

## Testing

The mock adapter classifies images based on their hash:
- **No DR (Level 0)**: Returns good quality with no findings
- **Mild DR (Level 1)**: Returns mild disease indicators
- **Moderate DR (Level 2)**: Returns moderate disease, referable
- **Severe DR (Level 3)**: Returns severe disease, urgent referral
- **Proliferative DR (Level 4)**: Returns PDR, urgent referral

Image quality is assessed based on:
- Minimum resolution (300x300px)
- Brightness (50-200 range optimal)
- Contrast (>40 std deviation optimal)

## Troubleshooting

**"Screening service could not complete this request"**
→ Check that all 3 services are running
→ Check terminal 2 has MATLAB_SCREENING_ADAPTER_URL set
→ Check mock adapter is on port 5000

**Port already in use**
→ Kill existing process or use different port:
  - Frontend: Change in `vite.config.js`
  - Backend: Change in `backend/server.js`
  - Adapter: Change in `mock_adapter.py`

**Python dependencies missing**
→ Run: `& "C:\Users\Ramesh Rathod\AppData\Local\Programs\Python\Python313\python.exe" -m pip install flask pillow numpy`

**CORS errors**
→ Ensure .env.local has: `VITE_API_BASE_URL=http://127.0.0.1:8080/api`
→ Rebuild frontend: `npm run build`

## Production Deployment

For production:
1. Train real MATLAB model: See `docs/MODEL_TRAINING.md`
2. Deploy MATLAB adapter with real model inference
3. Replace mock adapter with production-grade adapter
4. Follow security requirements in `docs/ARCHITECTURE.md`

## Next Steps

- [ ] Test image upload functionality
- [ ] Train real DR model with MATLAB
- [ ] Implement persistent screening storage
- [ ] Add authentication & authorization
- [ ] Deploy to production server
