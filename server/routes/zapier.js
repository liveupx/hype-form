// ===========================================
// Zapier Routes (REST Hooks API)
// ===========================================
// Endpoints for Zapier integration

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const ZapierService = require('../services/integrations/zapier');

const prisma = new PrismaClient();
const zapierService = new ZapierService();

// ===========================================
// AUTHENTICATION MIDDLEWARE
// ===========================================

const zapierAuth = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  const user = await zapierService.validateApiKey(apiKey);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  req.user = user;
  next();
};

// ===========================================
// AUTHENTICATION
// ===========================================

// Test authentication
router.get('/me', zapierAuth, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name
  });
});

// ===========================================
// REST HOOKS (Triggers)
// ===========================================

// Subscribe to events (called by Zapier when user creates a Zap)
router.post('/hooks/subscribe', zapierAuth, async (req, res) => {
  try {
    const { hookUrl, event } = req.body;

    if (!hookUrl || !event) {
      return res.status(400).json({ error: 'hookUrl and event required' });
    }

    const validEvents = [
      'submission.created',
      'form.published',
      'form.created'
    ];

    if (!validEvents.includes(event)) {
      return res.status(400).json({ error: `Invalid event. Valid events: ${validEvents.join(', ')}` });
    }

    const subscription = await zapierService.subscribe(
      req.user.id,
      event,
      hookUrl
    );

    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unsubscribe from events (called by Zapier when user deletes a Zap)
router.delete('/hooks/:id', zapierAuth, async (req, res) => {
  try {
    await prisma.zapierSubscription.deleteMany({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List subscriptions
router.get('/hooks', zapierAuth, async (req, res) => {
  try {
    const subscriptions = await zapierService.getSubscriptions(req.user.id);
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// SAMPLE DATA (for Zapier setup)
// ===========================================

// Get sample submission data
router.get('/samples/submission', zapierAuth, (req, res) => {
  res.json([zapierService.getSampleSubmission()]);
});

// Get sample form data
router.get('/samples/form', zapierAuth, (req, res) => {
  res.json([zapierService.getSampleForm()]);
});

// ===========================================
// POLLING TRIGGERS (fallback if REST hooks fail)
// ===========================================

// Get recent submissions
router.get('/triggers/submissions', zapierAuth, async (req, res) => {
  try {
    const { formId, limit = 10 } = req.query;

    const where = {
      form: { userId: req.user.id },
      status: 'COMPLETED'
    };

    if (formId) {
      where.formId = formId;
    }

    const submissions = await prisma.submission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      include: {
        form: { select: { id: true, title: true, publicId: true } },
        answers: {
          include: {
            field: { select: { id: true, label: true, type: true } }
          }
        }
      }
    });

    const formatted = submissions.map(sub => ({
      id: sub.id,
      formId: sub.form.id,
      formTitle: sub.form.title,
      completedAt: sub.completedAt,
      answers: sub.answers.map(a => ({
        fieldId: a.fieldId,
        fieldLabel: a.field.label,
        fieldType: a.field.type,
        value: a.value
      }))
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent forms
router.get('/triggers/forms', zapierAuth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const forms = await prisma.form.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      select: {
        id: true,
        title: true,
        publicId: true,
        status: true,
        createdAt: true,
        publishedAt: true
      }
    });

    res.json(forms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// ACTIONS
// ===========================================

// Create form
router.post('/actions/create-form', zapierAuth, async (req, res) => {
  try {
    const form = await zapierService.actionCreateForm(req.user.id, req.body);
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add field to form
router.post('/actions/add-field', zapierAuth, async (req, res) => {
  try {
    const field = await zapierService.actionAddField(req.user.id, req.body);
    res.json(field);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create submission (import data)
router.post('/actions/create-submission', zapierAuth, async (req, res) => {
  try {
    const result = await zapierService.actionCreateSubmission(req.user.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// DYNAMIC DROPDOWNS
// ===========================================

// Get forms (for dropdown)
router.get('/forms', zapierAuth, async (req, res) => {
  try {
    const forms = await zapierService.actionGetForms(req.user.id);
    res.json(forms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get fields for form (for dropdown)
router.get('/forms/:formId/fields', zapierAuth, async (req, res) => {
  try {
    const fields = await zapierService.actionGetFields(req.user.id, req.params.formId);
    res.json(fields);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
