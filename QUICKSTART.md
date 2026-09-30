# EyeRaksha - Quick Start Guide ⚡

## ✅ Status: FULLY WORKING

All backend and frontend services are now properly configured and running.

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies (First Time Only)
```powershell
cd "C:\Users\Ramesh Rathod\Desktop\SIH project\EyeRaksha"
npm install
cd backend
npm install
cd ..
python -m pip install flask pillow numpy
```

### Step 2: Start All Services

**Option A: Auto-Start (Recommended)**
```powershell
cd "C:\Users\Ramesh Rathod\Desktop\SIH project\EyeRaksha"
.\start_services.ps1
```

**Option B: Manual Start (3 Terminal Windows)**

Terminal 1 - Mock Adapter:
```powershell
cd "C:\Users\Ramesh Rathod\Desktop\SIH project\EyeRaksha"
python mock_adapter.py
```
✓ Should show: "Running on http://127.0.0.1:5000"

Terminal 2 - Backend API:
```powershell
cd "C:\Users\Ramesh Rathod\Desktop\SIH project\EyeRaksha\backend"
$env:MATLAB_SCREENING_ADAPTER_URL="http://127.0.0.1:5000/api/screen"
npm run server
```
✓ Should show: "EyeRaksha backend listening at http://127.0.0.1:8080"

Terminal 3 - Frontend:
```powershell
cd "C:\Users\Ramesh Rathod\Desktop\SIH project\EyeRaksha"
npm run dev
```
✓ Should show: "Local: http://localhost:5173"

### Step 3: Open Browser
Navigate to: **http://localhost:5173**

### Step 4: Test Image Upload
1. Click **Screening** in sidebar
2. Upload a retinal fundus image (JPG or PNG)
3. Click **Analyze Image**
4. View results with classification and confidence

---

## 🔍 Verify Everything Works

### Check Backend API
```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:8080/api/status" -UseBasicParsing | Select-Object -ExpandProperty Content
```

Expected response:
```json
{
  "status": "adapter_configured",
  "modelInference": true,
  "model": "Provided by MATLAB adapter",
  "calibration": "Reported by MATLAB adapter",
  "maxUploadBytes": 15728640,
  "acceptedImageTypes": ["image/jpeg", "image/png"]
}
```

### Check Mock Adapter
```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:5000/api/status" -UseBasicParsing | Select-Object -ExpandProperty Content
```

---

## 🛠️ Troubleshooting

### "Port already in use" Error
```powershell
# Find and kill process on port 8080
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### "Cannot find module 'busboy'" Error
```powershell
cd backend
npm install busboy@^1.6.0
```

### Backend returns "503 Model not trained"
Ensure mock adapter is running:
```powershell
python mock_adapter.py
```

### Frontend shows "Screening service unavailable"
Check environment variable is set:
```powershell
cd "C:\Users\Ramesh Rathod\Desktop\SIH project\EyeRaksha\backend"
$env:MATLAB_SCREENING_ADAPTER_URL="http://127.0.0.1:5000/api/screen"
npm run server
```

### Image upload fails
1. Verify image is JPG or PNG
2. Check file size < 15 MB
3. Ensure backend is running
4. Check browser console for CORS errors

---

## 📁 Project Structure

```
EyeRaksha/
├── src/                 # React frontend
├── backend/             # Node.js API
│   ├── server.js       # Main server
│   └── package.json    # ✓ Fixed
├── mock_adapter.py      # Python screening adapter
├── .env.local           # Frontend API config
├── start_services.ps1   # Startup script
├── SETUP.md            # Detailed setup
└── BACKEND_SETUP.md    # Backend documentation
```

---

## 🎯 What Each Service Does

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| **Mock Adapter** | 5000 | Simulates DR model inference | ✅ Running |
| **Backend API** | 8080 | Proxies image to adapter, stores results | ✅ Running |
| **Frontend** | 5173 | React/Vite UI for screening | ✅ Ready |

---

## 📊 Testing Workflow

1. **Upload Image** → Frontend sends to `/api/screen`
2. **Backend Receives** → Validates image, proxies to adapter
3. **Adapter Processes** → Assesses quality, runs classification
4. **Backend Returns** → Response with DR level and confidence
5. **Frontend Displays** → Shows results to user

---

## 🔧 Configuration

### Environment Variables
```powershell
# Backend - Required
$env:MATLAB_SCREENING_ADAPTER_URL="http://127.0.0.1:5000/api/screen"

# Backend - Optional
$env:PORT=8080
$env:CORS_ORIGIN="http://127.0.0.1:5173"
```

### Frontend (.env.local)
```env
VITE_API_BASE_URL=http://127.0.0.1:8080/api
```

---

## 📚 Next Steps

- [ ] Test image upload workflow
- [ ] Review analytics dashboard
- [ ] Train real MATLAB model (see docs/MODEL_TRAINING.md)
- [ ] Configure production deployment
- [ ] Add user authentication
- [ ] Setup persistent database

---

## 🚢 Production Deployment

Before deploying to production:

1. Train real DR model with MATLAB
2. Deploy real MATLAB screening adapter
3. Replace mock adapter with production version
4. Enable HTTPS/TLS encryption
5. Setup persistent database
6. Add authentication & authorization
7. Configure monitoring & logging
8. Review security & compliance

See [BACKEND_SETUP.md](BACKEND_SETUP.md#production-deployment) for production checklist.

---

## 📞 Support

For detailed information, see:
- [BACKEND_SETUP.md](BACKEND_SETUP.md) - Backend configuration & troubleshooting
- [SETUP.md](SETUP.md) - Complete project setup
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design
- [docs/API_CONTRACT.md](docs/API_CONTRACT.md) - API specifications
- [mock_adapter.py](mock_adapter.py) - Adapter source code

---

## ✨ Success Indicators

✅ Backend listening on port 8080  
✅ Mock adapter running on port 5000  
✅ Frontend accessible on port 5173  
✅ `/api/status` returns adapter_configured  
✅ Image upload processes without errors  
✅ DR results displayed with confidence scores  

**You're all set!** 🎉

Visit http://localhost:5173 and start screening!
