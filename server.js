const express = require('express');
const path = require('path');
const crypto = require('crypto');
const cors = require('cors');
const dotenv = require('dotenv');
const Razorpay = require('razorpay');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use('/api/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Razorpay Configuration
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const razorpay =
    RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET
        ? new Razorpay({
              key_id: RAZORPAY_KEY_ID,
              key_secret: RAZORPAY_KEY_SECRET
          })
        : null;

const PLAN_CONFIG = {
    basic: {
        id: 'basic',
        name: 'Basic Access',
        description: 'Basic Access - 7 days',
        amount: 200,
        accessDays: 7,
        maxDownloads: 10
    },
    premium: {
        id: 'premium',
        name: 'Premium',
        description: 'Premium - 6 months',
        amount: 600,
        accessDays: 180,
        maxDownloads: 30
    },
    ultra: {
        id: 'ultra',
        name: 'Ultra Premium',
        description: 'Ultra Premium - 1 year',
        amount: 1200,
        accessDays: 365,
        maxDownloads: 100
    },
    professional: {
        id: 'professional',
        name: 'Professional',
        description: 'Professional - Unlimited access',
        amount: 2000,
        accessDays: 3650,
        maxDownloads: null
    }
};

// Store payment sessions (in production, use a database)
const paymentSessions = new Map();

function sanitizePlan(plan) {
    if (!plan) return null;
    return {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        amount: plan.amount,
        accessDays: plan.accessDays,
        maxDownloads: plan.maxDownloads
    };
}

function resolvePlan({ amount, description, planId }) {
    if (planId && PLAN_CONFIG[planId]) {
        return PLAN_CONFIG[planId];
    }

    const normalizedDescription = String(description || '').toLowerCase();
    const plans = Object.values(PLAN_CONFIG);

    const matchedByAmount = plans.find((plan) => plan.amount === Number(amount));
    if (matchedByAmount) {
        return matchedByAmount;
    }

    return (
        plans.find((plan) =>
            normalizedDescription.includes(plan.name.toLowerCase()) ||
            normalizedDescription.includes(plan.description.toLowerCase())
        ) || null
    );
}

/**
 * GET /api/razorpay-key
 * Returns the Razorpay Key ID for frontend
 */
app.get('/api/razorpay-key', (req, res) => {
    if (!RAZORPAY_KEY_ID) {
        return res.status(500).json({
            error: 'Razorpay key is not configured'
        });
    }

    res.json({
        keyId: RAZORPAY_KEY_ID,
        merchantId: process.env.RAZORPAY_MID,
        plans: Object.values(PLAN_CONFIG).map(sanitizePlan)
    });
});

/**
 * POST /api/create-order
 * Creates a Razorpay order for payment
 * Body: { amount, description, userEmail, userName }
 */
app.post('/api/create-order', async (req, res) => {
    try {
        if (!razorpay) {
            return res.status(500).json({ error: 'Razorpay is not configured on the server' });
        }

        const { amount, description, userEmail, userName, planId } = req.body;
        const plan = resolvePlan({ amount, description, planId });

        if (!plan) {
            return res.status(400).json({ error: 'Invalid plan selected' });
        }

        const order = await razorpay.orders.create({
            amount: plan.amount * 100,
            currency: 'INR',
            receipt: `pdf_${plan.id}_${Date.now()}`,
            notes: {
                planId: plan.id,
                planName: plan.name,
                planDescription: plan.description,
                maxDownloads: plan.maxDownloads == null ? 'unlimited' : String(plan.maxDownloads),
                accessDays: String(plan.accessDays)
            }
        });

        const orderData = {
            id: order.id,
            amount: order.amount,
            currency: 'INR',
            description: plan.description,
            userEmail,
            userName,
            planId: plan.id,
            plan: sanitizePlan(plan),
            status: 'created',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        };

        paymentSessions.set(order.id, orderData);

        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            description: plan.description,
            keyId: RAZORPAY_KEY_ID,
            plan: sanitizePlan(plan)
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
app.post('/api/verify-payment', async (req, res) => {
    try {
        if (!RAZORPAY_KEY_SECRET) {
            return res.status(500).json({
                success: false,
                error: 'Razorpay secret is not configured'
            });
        }

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
            let plan = orderData?.plan || null;

            if (!plan && razorpay) {
                try {
                    const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
                    plan = sanitizePlan(
                        resolvePlan({
                            amount: razorpayOrder.amount / 100,
                            description:
                                razorpayOrder.notes?.planDescription ||
                                razorpayOrder.notes?.planName,
                            planId: razorpayOrder.notes?.planId
                        })
                    );
                } catch (fetchError) {
                    console.warn('Unable to fetch Razorpay order details:', fetchError.message);
                }
            }

            if (orderData) {
                orderData.status = 'completed';
                orderData.paymentId = razorpay_payment_id;
                orderData.completedAt = new Date();
                if (plan) {
                    orderData.plan = plan;
                }
                paymentSessions.set(razorpay_order_id, orderData);
            }

            res.json({
                success: true,
                message: 'Payment verified successfully',
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
                plan
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
            paymentId: orderData.paymentId || null,
            plan: orderData.plan || null
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
app.post('/api/webhook', (req, res) => {
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
            case 'payment_link.paid':
                console.log('Payment link paid:', event.payload?.payment_link?.entity?.short_url);
                break;
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
    if (path.extname(req.path)) {
        return res.status(404).send('Not found');
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 PDF Converter server running on http://localhost:${PORT}`);
        console.log(`✓ Razorpay integration enabled`);
        console.log(`✓ Webhook endpoint: http://localhost:${PORT}/api/webhook`);
    });
}
