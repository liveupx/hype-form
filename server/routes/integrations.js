// ===========================================
// Integrations Routes
// ===========================================

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const prisma = new PrismaClient();
router.use(auth);

// List user's integrations
router.get('/', async (req, res) => {
  try {
    const integrations = await prisma.integration.findMany({
      where: { userId: req.user.userId },
      select: {
        id: true,
        type: true,
        name: true,
        active: true,
        createdAt: true
      }
    });

    res.json(integrations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get integrations' });
  }
});

// Get single integration
router.get('/:id', async (req, res) => {
  try {
    const integration = await prisma.integration.findFirst({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    // Don't expose credentials
    const { credentials, ...safe } = integration;

    res.json(safe);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get integration' });
  }
});

// Connect integration
router.post('/connect', async (req, res) => {
  try {
    const { type, credentials, name } = req.body;

    const integration = await prisma.integration.upsert({
      where: {
        userId_type: { userId: req.user.userId, type }
      },
      update: { credentials, name, active: true },
      create: {
        userId: req.user.userId,
        type,
        credentials,
        name: name || type,
        active: true
      }
    });

    const { credentials: _, ...safe } = integration;

    res.json(safe);
  } catch (error) {
    console.error('Connect integration error:', error);
    res.status(500).json({ error: 'Failed to connect integration' });
  }
});

// Disconnect integration
router.delete('/:id', async (req, res) => {
  try {
    const integration = await prisma.integration.findFirst({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    await prisma.integration.delete({ where: { id: req.params.id } });

    res.json({ message: 'Integration disconnected' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to disconnect integration' });
  }
});

// Toggle integration active state
router.patch('/:id/toggle', async (req, res) => {
  try {
    const integration = await prisma.integration.findFirst({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    const updated = await prisma.integration.update({
      where: { id: req.params.id },
      data: { active: !integration.active }
    });

    const { credentials, ...safe } = updated;

    res.json(safe);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle integration' });
  }
});

// Connect form to integration
router.post('/forms/:formId/connect', async (req, res) => {
  try {
    const { integrationId, settings } = req.body;

    const form = await prisma.form.findFirst({
      where: { id: req.params.formId, userId: req.user.userId }
    });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const integration = await prisma.integration.findFirst({
      where: { id: integrationId, userId: req.user.userId }
    });

    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    const formIntegration = await prisma.formIntegration.upsert({
      where: {
        formId_integrationId: { formId: req.params.formId, integrationId }
      },
      update: { settings, active: true },
      create: {
        formId: req.params.formId,
        integrationId,
        settings,
        active: true
      }
    });

    res.json(formIntegration);
  } catch (error) {
    res.status(500).json({ error: 'Failed to connect form to integration' });
  }
});

module.exports = router;
