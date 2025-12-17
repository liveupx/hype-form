// ===========================================
// Webhooks Routes
// ===========================================

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');
const crypto = require('crypto');

const prisma = new PrismaClient();
router.use(auth);

// List webhooks
router.get('/', async (req, res) => {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(webhooks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get webhooks' });
  }
});

// Create webhook
router.post('/', async (req, res) => {
  try {
    const { name, url, events, headers } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = await prisma.webhook.create({
      data: {
        userId: req.user.userId,
        name: name || 'New Webhook',
        url,
        secret,
        events: events || ['submission.created'],
        headers: headers || {},
        active: true
      }
    });

    res.status(201).json(webhook);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create webhook' });
  }
});

// Update webhook
router.put('/:id', async (req, res) => {
  try {
    const { name, url, events, headers, active } = req.body;

    const webhook = await prisma.webhook.findFirst({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    const updated = await prisma.webhook.update({
      where: { id: req.params.id },
      data: { name, url, events, headers, active }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update webhook' });
  }
});

// Delete webhook
router.delete('/:id', async (req, res) => {
  try {
    const webhook = await prisma.webhook.findFirst({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    await prisma.webhook.delete({ where: { id: req.params.id } });

    res.json({ message: 'Webhook deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

// Test webhook
router.post('/:id/test', async (req, res) => {
  try {
    const webhook = await prisma.webhook.findFirst({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    const payload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: { message: 'Test webhook from HypeForm' }
    };

    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    try {
      const axios = require('axios');
      const response = await axios.post(webhook.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-HypeForm-Signature': signature,
          ...webhook.headers
        },
        timeout: 10000
      });

      // Log success
      await prisma.webhookLog.create({
        data: {
          webhookId: webhook.id,
          event: 'test',
          payload,
          statusCode: response.status,
          success: true
        }
      });

      res.json({ success: true, status: response.status });
    } catch (err) {
      // Log failure
      await prisma.webhookLog.create({
        data: {
          webhookId: webhook.id,
          event: 'test',
          payload,
          statusCode: err.response?.status,
          success: false,
          error: err.message
        }
      });

      res.json({ success: false, error: err.message });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to test webhook' });
  }
});

// Get webhook logs
router.get('/:id/logs', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const webhook = await prisma.webhook.findFirst({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    const logs = await prisma.webhookLog.findMany({
      where: { webhookId: webhook.id },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get logs' });
  }
});

// Regenerate secret
router.post('/:id/regenerate-secret', async (req, res) => {
  try {
    const webhook = await prisma.webhook.findFirst({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    const newSecret = crypto.randomBytes(32).toString('hex');

    const updated = await prisma.webhook.update({
      where: { id: req.params.id },
      data: { secret: newSecret }
    });

    res.json({ secret: updated.secret });
  } catch (error) {
    res.status(500).json({ error: 'Failed to regenerate secret' });
  }
});

module.exports = router;
