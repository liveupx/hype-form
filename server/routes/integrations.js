// ===========================================
// Integrations Routes (Updated with all services)
// ===========================================

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const prisma = new PrismaClient();
router.use(auth);

// ===========================================
// INTEGRATION MANAGEMENT
// ===========================================

// List all available integrations
router.get('/available', (req, res) => {
  res.json([
    {
      type: 'MAILCHIMP',
      name: 'Mailchimp',
      description: 'Sync submissions to email lists',
      icon: '📧',
      category: 'Email Marketing',
      fields: ['apiKey', 'listId']
    },
    {
      type: 'NOTION',
      name: 'Notion',
      description: 'Add submissions to Notion databases',
      icon: '📝',
      category: 'Productivity',
      fields: ['apiKey', 'databaseId']
    },
    {
      type: 'DISCORD',
      name: 'Discord',
      description: 'Send notifications to Discord channels',
      icon: '💬',
      category: 'Communication',
      fields: ['webhookUrl']
    },
    {
      type: 'HUBSPOT',
      name: 'HubSpot',
      description: 'Create contacts and deals in HubSpot',
      icon: '🔶',
      category: 'CRM',
      fields: ['accessToken']
    },
    {
      type: 'AIRTABLE',
      name: 'Airtable',
      description: 'Sync submissions to Airtable bases',
      icon: '📊',
      category: 'Productivity',
      fields: ['apiKey', 'baseId', 'tableId']
    },
    {
      type: 'TWILIO',
      name: 'Twilio',
      description: 'Send SMS notifications',
      icon: '📱',
      category: 'Communication',
      fields: ['accountSid', 'authToken', 'fromNumber']
    },
    {
      type: 'GOOGLE_SHEETS',
      name: 'Google Sheets',
      description: 'Sync submissions to spreadsheets',
      icon: '📗',
      category: 'Productivity',
      fields: ['oauth'],
      oauth: true
    },
    {
      type: 'SLACK',
      name: 'Slack',
      description: 'Send notifications to Slack channels',
      icon: '💼',
      category: 'Communication',
      fields: ['webhookUrl']
    },
    {
      type: 'ZAPIER',
      name: 'Zapier',
      description: 'Connect to 5000+ apps',
      icon: '⚡',
      category: 'Automation',
      fields: ['apiKey']
    },
    {
      type: 'OPENAI',
      name: 'OpenAI',
      description: 'AI-powered form generation',
      icon: '🤖',
      category: 'AI',
      fields: ['apiKey']
    }
  ]);
});

// List user's connected integrations
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

// Test integration connection
router.post('/test', async (req, res) => {
  try {
    const { type, credentials } = req.body;

    if (!type || !credentials) {
      return res.status(400).json({ error: 'Type and credentials required' });
    }

    let result;

    switch (type) {
      case 'MAILCHIMP':
        const MailchimpService = require('../services/integrations/mailchimp');
        const mailchimp = new MailchimpService(credentials.apiKey);
        result = await mailchimp.testConnection();
        break;

      case 'NOTION':
        const NotionService = require('../services/integrations/notion');
        const notion = new NotionService(credentials.apiKey);
        result = await notion.testConnection();
        break;

      case 'DISCORD':
        const DiscordService = require('../services/integrations/discord');
        const discord = new DiscordService(credentials.webhookUrl);
        result = await discord.testConnection();
        break;

      case 'HUBSPOT':
        const HubSpotService = require('../services/integrations/hubspot');
        const hubspot = new HubSpotService(credentials.accessToken);
        result = await hubspot.testConnection();
        break;

      case 'AIRTABLE':
        const AirtableService = require('../services/integrations/airtable');
        const airtable = new AirtableService(credentials.apiKey);
        result = await airtable.testConnection();
        break;

      case 'TWILIO':
        const TwilioService = require('../services/integrations/twilio');
        const twilio = new TwilioService(
          credentials.accountSid,
          credentials.authToken,
          credentials.fromNumber
        );
        result = await twilio.testConnection();
        break;

      case 'OPENAI':
        const OpenAIService = require('../services/integrations/openai');
        const openai = new OpenAIService(credentials.apiKey);
        result = await openai.testConnection();
        break;

      default:
        return res.status(400).json({ error: 'Unknown integration type' });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Connect/update integration
router.post('/connect', async (req, res) => {
  try {
    const { type, credentials, name } = req.body;

    if (!type || !credentials) {
      return res.status(400).json({ error: 'Type and credentials required' });
    }

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
    res.json({ ...safe, message: 'Integration connected successfully' });
  } catch (error) {
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
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

// Toggle integration
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
    res.status(500).json({ error: 'Failed to toggle' });
  }
});

// ===========================================
// FORM INTEGRATION CONNECTIONS
// ===========================================

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
    res.status(500).json({ error: 'Failed to connect' });
  }
});

// ===========================================
// INTEGRATION-SPECIFIC ENDPOINTS
// ===========================================

// Mailchimp - Get lists
router.get('/mailchimp/lists', async (req, res) => {
  try {
    const integration = await prisma.integration.findFirst({
      where: { userId: req.user.userId, type: 'MAILCHIMP' }
    });
    if (!integration) return res.status(404).json({ error: 'Not connected' });

    const MailchimpService = require('../services/integrations/mailchimp');
    const service = new MailchimpService(integration.credentials.apiKey);
    res.json(await service.getLists());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Notion - Get databases
router.get('/notion/databases', async (req, res) => {
  try {
    const integration = await prisma.integration.findFirst({
      where: { userId: req.user.userId, type: 'NOTION' }
    });
    if (!integration) return res.status(404).json({ error: 'Not connected' });

    const NotionService = require('../services/integrations/notion');
    const service = new NotionService(integration.credentials.apiKey);
    res.json(await service.searchDatabases());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Airtable - Get bases
router.get('/airtable/bases', async (req, res) => {
  try {
    const integration = await prisma.integration.findFirst({
      where: { userId: req.user.userId, type: 'AIRTABLE' }
    });
    if (!integration) return res.status(404).json({ error: 'Not connected' });

    const AirtableService = require('../services/integrations/airtable');
    const service = new AirtableService(integration.credentials.apiKey);
    res.json(await service.listBases());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// HubSpot - Get contact properties
router.get('/hubspot/properties', async (req, res) => {
  try {
    const integration = await prisma.integration.findFirst({
      where: { userId: req.user.userId, type: 'HUBSPOT' }
    });
    if (!integration) return res.status(404).json({ error: 'Not connected' });

    const HubSpotService = require('../services/integrations/hubspot');
    const service = new HubSpotService(integration.credentials.accessToken);
    res.json(await service.getContactProperties());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// AI ENDPOINTS
// ===========================================

// Generate form with AI
router.post('/ai/generate-form', async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ error: 'Description required' });
    }

    let apiKey = process.env.OPENAI_API_KEY;
    const integration = await prisma.integration.findFirst({
      where: { userId: req.user.userId, type: 'OPENAI' }
    });
    if (integration?.credentials?.apiKey) {
      apiKey = integration.credentials.apiKey;
    }

    if (!apiKey) {
      return res.status(400).json({ error: 'OpenAI not configured' });
    }

    const OpenAIService = require('../services/integrations/openai');
    const service = new OpenAIService(apiKey);
    const formData = await service.generateForm(description);
    res.json(formData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Suggest fields
router.post('/ai/suggest-fields', async (req, res) => {
  try {
    const { formTitle, existingFields } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'OpenAI not configured' });
    }

    const OpenAIService = require('../services/integrations/openai');
    const service = new OpenAIService(apiKey);
    const suggestions = await service.suggestFields(formTitle, existingFields);
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analyze submissions with AI
router.post('/ai/analyze', async (req, res) => {
  try {
    const { formId } = req.body;
    
    const form = await prisma.form.findFirst({
      where: { id: formId, userId: req.user.userId },
      include: {
        submissions: {
          where: { status: 'COMPLETED' },
          include: { answers: { include: { field: true } } },
          take: 50
        }
      }
    });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'OpenAI not configured' });
    }

    const OpenAIService = require('../services/integrations/openai');
    const service = new OpenAIService(apiKey);
    const analysis = await service.summarizeSubmissions(form.submissions, form.title);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
