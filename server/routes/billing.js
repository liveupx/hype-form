// ===========================================
// Billing Routes
// ===========================================

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get pricing info (public)
router.get('/pricing', async (req, res) => {
  res.json({
    free: {
      name: 'Free',
      price: 0,
      features: [
        'Unlimited forms',
        'Unlimited responses',
        '100MB storage',
        'Basic integrations',
        'Email notifications'
      ]
    },
    pro: {
      name: 'Pro',
      monthlyPrice: 10,
      yearlyPrice: 99,
      features: [
        'Everything in Free',
        'Remove branding',
        '10GB storage',
        'Custom domains',
        'Payment collection',
        'Advanced integrations',
        'Team collaboration (5)',
        'Priority support'
      ]
    },
    enterprise: {
      name: 'Enterprise',
      monthlyPrice: 99,
      yearlyPrice: 990,
      features: [
        'Everything in Pro',
        'Unlimited storage',
        'Unlimited team members',
        'SSO/SAML',
        'Audit logs',
        'Dedicated support',
        'Custom contracts'
      ]
    }
  });
});

// Protected routes
router.use(auth);

// Get current subscription
router.get('/subscription', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        plan: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        planPeriodEnd: true
      }
    });

    res.json({
      plan: user.plan,
      periodEnd: user.planPeriodEnd,
      hasSubscription: !!user.stripeSubscriptionId
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

// Create checkout session (Stripe)
router.post('/checkout', async (req, res) => {
  try {
    const { plan, interval = 'monthly' } = req.body;

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { email: true, stripeCustomerId: true }
    });

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: req.user.userId }
      });
      customerId = customer.id;

      await prisma.user.update({
        where: { id: req.user.userId },
        data: { stripeCustomerId: customerId }
      });
    }

    // Get price ID
    const priceKey = `STRIPE_${plan}_${interval.toUpperCase()}_PRICE_ID`;
    const priceId = process.env[priceKey];

    if (!priceId) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.APP_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.APP_URL}/dashboard/billing?canceled=true`,
      metadata: { userId: req.user.userId, plan }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout' });
  }
});

// Create customer portal session
router.post('/portal', async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { stripeCustomerId: true }
    });

    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: 'No billing account' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.APP_URL}/dashboard/billing`
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create portal' });
  }
});

module.exports = router;
