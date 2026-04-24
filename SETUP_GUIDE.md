# Quick Start - Payment Integration Setup

## Issue: "Failed to initiate payment"

This happens when the backend server is not running. Follow these steps to fix it:

## Step 1: Install Dependencies

Open PowerShell in the `D:\Converter` directory and run:

```powershell
npm install
```

This installs all required Node.js packages:
- express (web framework)
- cors (cross-origin support)
- dotenv (environment variables)
- razorpay (payment SDK)

**Expected Output:**
```
added X packages
```

## Step 2: Start the Backend Server

In PowerShell, run:

```powershell
npm start
```

**Expected Output:**
```
🚀 PDF Converter server running on http://localhost:3000
✓ Razorpay integration enabled
✓ Webhook endpoint: http://localhost:3000/api/webhook
```

Keep this terminal open while using the app!

## Step 3: Open the App

### Option A: Direct File (Recommended for Testing)
1. Open `D:\Converter\index.html` in your browser
2. Everything will work without needing a separate frontend server

### Option B: Via Frontend Server
In a NEW PowerShell terminal, run:
```powershell
npm run client
```

Then open: http://localhost:8000

## Step 4: Test Payment

1. **Upload files** → Choose some images or documents
2. **Click "Convert All to PDF"** → Files are converted
3. **Click "Download All"** → Payment modal appears
4. **Select a payment plan** → Click "Pay with Razorpay"
5. **Use test card**: `4111 1111 1111 1111`
6. **Any future date** for expiry
7. **Any 3 digits** for CVV
8. **Complete payment** → Downloads enabled!

## Troubleshooting

### Error: "npm: command not found"
- Install Node.js from https://nodejs.org/
- Restart PowerShell after installation

### Error: "Port 3000 already in use"
- Another app is using port 3000
- Kill the process or use different port:
  ```powershell
  $env:PORT=3001; npm start
  ```

### Error: "Razorpay script not loaded"
- The Razorpay CDN script failed to load
- Check internet connection
- Try a different browser

### Server starts but still getting payment errors
1. Open browser **Developer Tools** (F12)
2. Go to **Console** tab
3. Look for error messages
4. Share the error with support

### Payment modal not appearing
- Make sure backend server is running
- Check browser console for errors
- Clear browser cache and reload
- Try incognito/private mode

## Verify Backend is Running

Open browser and go to:
```
http://localhost:3000/health
```

You should see:
```json
{"status":"ok","message":"PDF Converter server is running"}
```

## Production Deployment

When deploying to production:

1. **Razorpay Live Keys** - Get from Razorpay dashboard
2. **Update `.env`** with live keys
3. **HTTPS Required** - Razorpay requires HTTPS
4. **Update API_BASE** in `script.js`
5. **Configure Database** - Replace in-memory sessions with real DB

## Files Structure

```
D:\Converter\
├── .env                      # Razorpay credentials ⭐
├── server.js                 # Backend server ⭐
├── index.html                # Frontend UI
├── script.js                 # Frontend logic
├── styles.css                # Styling
├── package.json              # Dependencies
└── RAZORPAY_INTEGRATION.md   # Full documentation
```

## Multiple Terminals

**Terminal 1** (Always running):
```powershell
npm start
# Keeps backend server running
```

**Terminal 2** (Optional, only if not opening HTML directly):
```powershell
npm run client
# Opens frontend on http://localhost:8000
```

**Terminal 3** (For debugging):
```powershell
# Check processes
Get-Process node
# Kill specific process
Stop-Process -Name node
```

## Key Improvements Made

✅ **Better Error Handling**
- Detailed console logs (✓ success, ⚠ warning, ❌ error)
- Clear error messages

✅ **Fallback Mechanisms**
- Works without backend in test mode
- Client-side order creation backup
- Client-side verification fallback

✅ **Improved Payment Flow**
- Better Razorpay script loading
- Timeout handling
- Network error resilience

✅ **Better Notifications**
- Success/Error/Warning colors
- Longer display time
- Word wrapping for long messages

## Quick Checklist

- [ ] `npm install` completed
- [ ] Backend running (`npm start`)
- [ ] No "Port 3000 already in use" error
- [ ] Can access http://localhost:3000/health
- [ ] HTML file opens in browser
- [ ] Can see payment modal on download attempt
- [ ] Test payment completes successfully
- [ ] Downloads work after payment

## Still Having Issues?

1. Check browser console (F12) for detailed errors
2. Check PowerShell terminal where server is running
3. Try restarting both the server and browser
4. Clear browser cache/cookies
5. Try different browser
6. Restart your computer

## Support

For Razorpay-specific issues:
- Visit: https://razorpay.com/support
- Check docs: https://razorpay.com/docs/
