const express = require('express');
const path = require('path');
const crypto = require('crypto');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Razorpay Configuration
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// Store payment sessions (in production, use a database)
const paymentSessions = new Map();

/**
 * GET /api/razorpay-key
 * Returns the Razorpay Key ID for frontend
 */
app.get('/api/razorpay-key', (req, res) => {
    res.json({
        keyId: RAZORPAY_KEY_ID,
        merchantId: process.env.RAZORPAY_MID
    });
});

/**
 * POST /api/create-order
 * Creates a Razorpay order for payment
 * Body: { amount, description, userEmail, userName }
 */
app.post('/api/create-order', async (req, res) => {
    try {
        const { amount, description, userEmail, userName } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        // In production, use Razorpay SDK or API to create order
        // For now, create a local order object
        const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const orderData = {
            id: orderId,
            amount: amount * 100, // Convert to paise
            currency: 'INR',
            description,
            userEmail,
            userName,
            status: 'created',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        };

        paymentSessions.set(orderId, orderData);

        res.json({
            success: true,
            orderId,
            amount: amount * 100,
            currency: 'INR',
            description,
            keyId: RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

/**
 * POST /api/verify-payment
 * Verifies the Razorpay payment signature
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
app.post('/api/verify-payment', (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing payment details' 
            });
        }

        // Verify signature
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac('sha256', RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        const isValid = expectedSignature === razorpay_signature;

        if (isValid) {
            // Update payment session
            const orderData = paymentSessions.get(razorpay_order_id);
            if (orderData) {
                orderData.status = 'completed';
                orderData.paymentId = razorpay_payment_id;
                orderData.completedAt = new Date();
                paymentSessions.set(razorpay_order_id, orderData);
            }

            res.json({
                success: true,
                message: 'Payment verified successfully',
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'Payment verification failed'
            });
        }
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Payment verification failed' 
        });
    }
});

/**
 * GET /api/payment-status/:orderId
 * Check the status of a payment
 */
app.get('/api/payment-status/:orderId', (req, res) => {
    try {
        const { orderId } = req.params;
        const orderData = paymentSessions.get(orderId);

        if (!orderData) {
            return res.status(404).json({ 
                success: false, 
                error: 'Order not found' 
            });
        }

        res.json({
            success: true,
            status: orderData.status,
            orderId,
            paymentId: orderData.paymentId || null
        });
    } catch (error) {
        console.error('Payment status error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get payment status' 
        });
    }
});

/**
 * POST /api/webhook
 * Razorpay webhook endpoint for payment notifications
 */
app.post('/api/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const body = req.body.toString();

        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (signature !== expectedSignature) {
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const event = JSON.parse(body);

        // Handle different webhook events
        switch (event.event) {
            case 'payment.authorized':
                console.log('Payment authorized:', event.payload.payment.entity.id);
                break;
            case 'payment.failed':
                console.log('Payment failed:', event.payload.payment.entity.id);
                break;
            case 'payment.captured':
                console.log('Payment captured:', event.payload.payment.entity.id);
                break;
            default:
                console.log('Webhook event:', event.event);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'PDF Converter server is running' });
});

// Fallback for any other route: serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
        if (err) {
            console.error('Error serving index.html:', err);
            res.status(500).send('Could not load page');
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: err.message || 'Internal server error'
    });
});

// Export for Vercel
module.exports = app;

// For local development
if (require.main === module) {
    const PORT = process.env.PORT || 3001;
    const server = app.listen(PORT, () => {
        console.log(`🚀 PDF Converter server running on http://localhost:${PORT}`);
        console.log(`✓ Razorpay integration enabled`);
        console.log(`✓ Webhook endpoint: http://localhost:${PORT}/api/webhook`);
    });
    
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${PORT} is in use, trying ${PORT + 1}`);
            const PORT2 = PORT + 1;
            app.listen(PORT2, () => {
                console.log(`🚀 PDF Converter server running on http://localhost:${PORT2}`);
            });
        }
    });
}
