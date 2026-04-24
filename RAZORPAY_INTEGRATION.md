# PDF Converter with Razorpay Payment Integration

A modern, responsive web application for converting various file formats to PDF with secure Razorpay payment integration.

## Features

✨ **File Conversion**
- Convert Images (JPG, PNG, GIF, BMP, WebP) to PDF
- Convert Documents (DOC, DOCX, PDF, TXT, RTF, ODT) to PDF
- Convert Spreadsheets (XLS, XLSX, CSV, ODS) to PDF
- Convert Presentations (PPT, PPTX) to PDF
- Merge multiple files into single PDF

🔒 **Security**
- 100% client-side conversion (files never uploaded)
- Secure Razorpay payment processing
- Payment verification on backend

💳 **Payment Integration**
- Razorpay payment gateway
- Two-tier pricing model:
  - Basic: ₹99 - Download up to 10 PDFs
  - Premium: ₹199 - Unlimited downloads for 24 hours
- Automatic payment expiry

## Project Structure

```
.
├── index.html          # Main HTML file with payment modal UI
├── styles.css          # Styling with payment modal CSS
├── script.js           # Frontend JavaScript with Razorpay integration
├── server.js           # Node.js/Express backend server
├── .env                # Environment variables (Razorpay credentials)
├── package.json        # Node.js dependencies
└── README.md          # This file
```

## Setup Instructions

### 1. Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)
- Git

### 2. Installation

Clone or extract the project:
```bash
cd Converter
```

Install dependencies:
```bash
npm install
```

### 3. Environment Configuration

Create or update `.env` file with your Razorpay credentials:
```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_SMlPVMR00yQZTp
RAZORPAY_KEY_SECRET=tcFW4HwMYS2Nx0mrxWz6zAVE
RAZORPAY_MID=SMkWf4pJooRpsG
RAZORPAY_MERCHANT_ID=SMkWf4pJooRpsG

# URLs
RAZORPAY_WEBHOOK_URL=https://genfintechanalytics.com/api/webhook
PAYMENT_LINK=https://rzp.io/rzp/A5aa9AaI

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 4. Start the Application

Start the backend server:
```bash
npm start
# or
npm run server
```

The server will start on `http://localhost:3000`

In a new terminal, serve the frontend (optional for development):
```bash
npm run client
# or use any HTTP server on port 8000
```

### 5. Access the Application

- Backend API: http://localhost:3000
- Frontend: http://localhost:8000 (or open `index.html` directly)

## API Endpoints

### 1. Get Razorpay Key
```
GET /api/razorpay-key
Response: { keyId, merchantId }
```

### 2. Create Order
```
POST /api/create-order
Body: { amount, description, userEmail, userName }
Response: { orderId, amount, currency, keyId }
```

### 3. Verify Payment
```
POST /api/verify-payment
Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
Response: { success, message, orderId, paymentId }
```

### 4. Check Payment Status
```
GET /api/payment-status/:orderId
Response: { status, orderId, paymentId }
```

### 5. Webhook
```
POST /api/webhook
Receives Razorpay webhook events
```

## Payment Flow

1. User uploads and converts files
2. When attempting to download, payment modal appears
3. User selects payment plan (Basic or Premium)
4. Razorpay checkout opens
5. User completes payment
6. Payment signature verified on backend
7. Payment status stored
8. Downloads enabled for 24 hours
9. User can download converted PDFs

## Key Features of Integration

### Frontend (`script.js`)
- `initRazorpay()` - Initialize Razorpay key from backend
- `showPaymentModal()` - Display payment options
- `initiatePayment()` - Start payment process
- `handlePaymentSuccess()` - Process successful payment
- `isPaymentValid()` - Check if payment is still valid
- Payment status stored in localStorage

### Backend (`server.js`)
- Express.js server with CORS support
- Razorpay signature verification
- Order creation and management
- Payment status tracking
- Webhook handling

## Security Considerations

1. **Signature Verification**: All payments verified using HMAC-SHA256
2. **Payment Expiry**: Automatic expiry after 24 hours
3. **Order Validation**: Orders checked before payment processing
4. **CORS**: Backend protected with CORS middleware
5. **Error Handling**: Comprehensive error handling and validation

## Customization

### Adjust Payment Amounts
Edit the payment options in `index.html`:
```html
<div class="payment-option" data-amount="99">
    <!-- Modify amount here -->
</div>
```

### Change Payment Expiry Duration
In `script.js`, modify the expiry time:
```javascript
const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
```

### Update Payment Description
Modify the description passed to `initiatePayment()`:
```javascript
initiatePayment(amount, 'Your custom description')
```

## Troubleshooting

### Payment Modal Not Appearing
- Ensure Razorpay script is loaded in `index.html`
- Check browser console for errors
- Verify API base URL is correct

### Payment Verification Failed
- Check `.env` file has correct Razorpay credentials
- Verify signature verification logic
- Check server logs for detailed errors

### Downloads Not Working
- Clear localStorage if payment status stuck
- Check if payment expiry has passed
- Verify Razorpay payment was actually completed

### CORS Issues
- Ensure backend is running on correct port
- Check API_BASE URL in `script.js`
- Verify CORS middleware in `server.js`

## Testing

### Test Credentials (from Razorpay)
- Key ID: `rzp_test_SMlPVMR00yQZTp`
- Key Secret: `tcFW4HwMYS2Nx0mrxWz6zAVE`

### Test Payment Card
Use these credentials in Razorpay test mode:
- Card: `4111 1111 1111 1111`
- Expiry: Any future date
- CVV: Any 3 digits

## Production Deployment

### Before Going Live

1. **Update Razorpay Credentials**
   - Get live API keys from Razorpay dashboard
   - Update `.env` with live credentials

2. **Update URLs**
   - Change webhook URL to production domain
   - Update API_BASE in script.js to production server

3. **SSL/HTTPS**
   - Razorpay requires HTTPS in production
   - Configure SSL certificate

4. **Database**
   - Replace in-memory payment sessions with database
   - Implement persistent order storage

5. **Environment Variables**
   - Set `NODE_ENV=production`
   - Use environment-based configuration

### Deployment Steps

1. Deploy backend to production server (Heroku, AWS, DigitalOcean, etc.)
2. Update `API_BASE` in `script.js` to production URL
3. Update Razorpay webhook URL in dashboard
4. Deploy frontend to CDN or static hosting
5. Test payment flow in production

## Support

For issues with Razorpay integration, visit:
- Razorpay Docs: https://razorpay.com/docs/
- Razorpay Support: https://razorpay.com/support/

## License

MIT License - Feel free to use for personal and commercial projects.

---

**Built with ❤️ for modern web applications**
