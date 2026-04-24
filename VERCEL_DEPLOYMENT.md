# 🚀 Vercel Deployment Guide - PDF Converter

## Prerequisites

### 1. Install Vercel CLI
```bash
npm install -g vercel
# or
yarn global add vercel
```

### 2. Login to Vercel
```bash
vercel login
```
Follow the authentication prompts.

### 3. Verify Installation
```bash
vercel --version
vercel whoami
```

---

## 📁 Project Structure for Vercel

Your project is already configured for Vercel deployment:

```
D:\Converter\
├── vercel.json          # Vercel configuration
├── .vercelignore        # Files to exclude from deployment
├── server.js            # Backend server (modified for Vercel)
├── package.json         # Dependencies
├── index.html           # Frontend
├── script.js            # Frontend logic
├── styles.css           # Styling
├── .env                 # Local environment variables
└── deploy.bat/.ps1      # Deployment scripts
```

---

## 🚀 Quick Deployment

### Option 1: Using Batch Script (Windows)
```bash
# Double-click this file or run:
deploy.bat
```

### Option 2: Using PowerShell Script
```powershell
.\deploy.ps1
```

### Option 3: Manual Deployment
```bash
# Navigate to project directory
cd D:\Converter

# Deploy to production
vercel --prod
```

---

## ⚙️ Environment Variables Setup

### Step 1: After Deployment
After successful deployment, Vercel will give you a deployment URL like:
```
https://pdf-converter-xyz.vercel.app
```

### Step 2: Set Environment Variables
Go to your Vercel dashboard:
1. Visit: https://vercel.com/dashboard
2. Find your project (pdf-converter or similar)
3. Go to Settings → Environment Variables

### Step 3: Add These Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `RAZORPAY_KEY_ID` | `rzp_test_SMlPVMR00yQZTp` | Your Razorpay Test Key ID |
| `RAZORPAY_KEY_SECRET` | `tcFW4HwMYS2Nx0mrxWz6zAVE` | Your Razorpay Test Key Secret |
| `RAZORPAY_MID` | `SMkWf4pJooRpsG` | Your Razorpay Merchant ID |
| `RAZORPAY_MERCHANT_ID` | `SMkWf4pJooRpsG` | Your Razorpay Merchant ID |
| `NODE_ENV` | `production` | Environment setting |

### Step 4: Redeploy
After setting environment variables, redeploy:
```bash
vercel --prod
```

---

## 🔧 Configuration Files

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "server.js": {
      "maxDuration": 30
    }
  }
}
```

### .vercelignore
```
.git/
node_modules/
*.log
.env.local
DEBUG.html
START_SERVER.bat
START_SERVER.ps1
SETUP_GUIDE.md
TROUBLESHOOTING.md
```

---

## 🧪 Testing Your Deployment

### 1. Health Check
Visit: `https://your-app.vercel.app/health`

Expected response:
```json
{"status":"ok","message":"PDF Converter server is running"}
```

### 2. Razorpay Key Check
Visit: `https://your-app.vercel.app/api/razorpay-key`

Expected response:
```json
{"keyId":"rzp_test_...","merchantId":"SMkWf4pJooRpsG"}
```

### 3. Full App Test
Visit: `https://your-app.vercel.app`

- Upload a file
- Convert to PDF
- Try payment (use test card: `4111 1111 1111 1111`)

---

## 🔍 Troubleshooting

### Issue: "Build failed"
**Solution:**
- Check Vercel build logs in dashboard
- Ensure all dependencies are in package.json
- Verify server.js exports the app correctly

### Issue: "Environment variables not working"
**Solution:**
- Redeploy after setting environment variables
- Check variable names match exactly
- Use Vercel's dashboard, not CLI for env vars

### Issue: "API routes not working"
**Solution:**
- Check vercel.json routes configuration
- Ensure server.js handles all routes
- Verify API endpoints match frontend calls

### Issue: "Payment not working"
**Solution:**
- Check Razorpay keys are set correctly
- Verify webhook URL in Razorpay dashboard
- Test with Razorpay test card

### Issue: "Static files not loading"
**Solution:**
- Check express.static('.') in server.js
- Verify files are not in .vercelignore
- Ensure correct file paths

---

## 📊 Vercel Features Used

### Serverless Functions
- Backend runs as serverless functions
- Automatic scaling
- No server management needed

### Static File Serving
- HTML, CSS, JS served directly
- Fast global CDN
- Automatic compression

### Environment Variables
- Secure key management
- Different values for different environments
- Automatic injection

### Custom Domains
- Free .vercel.app subdomain
- Custom domain support
- SSL certificates included

---

## 🚀 Production Checklist

- [ ] Vercel CLI installed and logged in
- [ ] Project deployed successfully
- [ ] Environment variables set in Vercel dashboard
- [ ] Redeployed after setting env vars
- [ ] Health check endpoint working
- [ ] Razorpay key endpoint working
- [ ] Full app loads and works
- [ ] Payment integration tested
- [ ] Webhook URL configured in Razorpay

---

## 🔄 Updating Your App

### Make Changes
1. Edit your code locally
2. Test locally with `npm start`
3. Commit changes to git (optional)

### Redeploy
```bash
vercel --prod
```

Vercel will automatically detect changes and redeploy.

---

## 📞 Support

### Vercel Issues
- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support

### Razorpay Issues
- Razorpay Docs: https://razorpay.com/docs
- Razorpay Support: https://razorpay.com/support

### Deployment Issues
- Check build logs in Vercel dashboard
- Verify all files are uploaded
- Test API endpoints individually

---

## 🎯 Performance Tips

1. **Enable Vercel Analytics** - Monitor performance
2. **Use Vercel Edge Functions** - For better speed (advanced)
3. **Optimize Images** - Compress before upload
4. **Cache Static Assets** - Use proper cache headers
5. **Monitor Usage** - Check Vercel dashboard regularly

---

## 💰 Pricing

### Vercel Hobby Plan (Free)
- ✅ 100GB bandwidth/month
- ✅ 100 serverless function invocations/month
- ✅ Unlimited static sites
- ✅ Automatic HTTPS
- ✅ Global CDN

### Upgrade Options
- Pro: $20/month (more bandwidth/functions)
- Enterprise: Custom pricing

---

## 🔒 Security

### Environment Variables
- Never commit secrets to git
- Use Vercel's encrypted env vars
- Rotate keys regularly

### Payment Security
- Razorpay handles PCI compliance
- Use HTTPS only
- Validate all payment data server-side

### CORS
- Properly configured for your domain
- Restrict origins in production

---

**Ready to deploy? Run `deploy.bat` or `vercel --prod`**

**Need help? Check the troubleshooting section above**

---

*Last Updated: April 24, 2026*
*Status: ✅ Ready for Vercel Deployment*