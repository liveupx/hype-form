// ===========================================
// Integration Engine
// ===========================================
// Orchestrates all integrations and handles events

const { PrismaClient } = require('@prisma/client');
const { logger } = require('../utils/logger');

// Import all services
const MailchimpService = require('./integrations/mailchimp');
const NotionService = require('./integrations/notion');
const DiscordService = require('./integrations/discord');
const HubSpotService = require('./integrations/hubspot');
const AirtableService = require('./integrations/airtable');
const TwilioService = require('./integrations/twilio');
const ZapierService = require('./integrations/zapier');
const OpenAIService = require('./integrations/openai');

const prisma = new PrismaClient();

class IntegrationEngine {
  constructor() {
    this.zapier = new ZapierService();
  }

  // ===========================================
  // SERVICE FACTORY
  // ===========================================

  getService(type, credentials) {
    switch (type) {
      case 'MAILCHIMP':
        return new MailchimpService(credentials.apiKey);
      
      case 'NOTION':
        return new NotionService(credentials.apiKey);
      
      case 'DISCORD':
        return new DiscordService(credentials.webhookUrl);
      
      case 'HUBSPOT':
        return new HubSpotService(credentials.accessToken);
      
      case 'AIRTABLE':
        return new AirtableService(credentials.apiKey);
      
      case 'TWILIO':
        return new TwilioService(
          credentials.accountSid,
          credentials.authToken,
          credentials.fromNumber
        );
      
      case 'OPENAI':
        return new OpenAIService(credentials.apiKey || process.env.OPENAI_API_KEY);
      
      default:
        throw new Error(`Unknown integration type: ${type}`);
    }
  }

  // ===========================================
  // PROCESS FORM SUBMISSION
  // ===========================================

  async processSubmission(submission, form) {
    const results = {
      success: true,
      integrations: []
    };

    // Get user's integrations
    const userId = form.userId;

    // Get form-specific integrations
    const formIntegrations = await prisma.formIntegration.findMany({
      where: { formId: form.id, active: true },
      include: { integration: true }
    });

    // Prepare submission data
    const submissionData = await this.prepareSubmissionData(submission);
    const fieldLabels = await this.getFieldLabels(form.id);

    // Process each integration
    for (const fi of formIntegrations) {
      const integration = fi.integration;
      const settings = fi.settings || {};

      try {
        let result;

        switch (integration.type) {
          case 'MAILCHIMP':
            result = await this.processMailchimp(
              integration.credentials,
              settings,
              submissionData
            );
            break;

          case 'NOTION':
            result = await this.processNotion(
              integration.credentials,
              settings,
              submissionData
            );
            break;

          case 'DISCORD':
            result = await this.processDiscord(
              integration.credentials,
              settings,
              form.title,
              submissionData,
              fieldLabels
            );
            break;

          case 'HUBSPOT':
            result = await this.processHubSpot(
              integration.credentials,
              settings,
              submissionData,
              form.title
            );
            break;

          case 'AIRTABLE':
            result = await this.processAirtable(
              integration.credentials,
              settings,
              submissionData
            );
            break;

          case 'TWILIO':
            result = await this.processTwilio(
              integration.credentials,
              settings,
              form.title,
              submissionData,
              fieldLabels
            );
            break;

          case 'GOOGLE_SHEETS':
            result = await this.processGoogleSheets(
              integration.credentials,
              settings,
              submissionData,
              fieldLabels
            );
            break;

          case 'SLACK':
            result = await this.processSlack(
              integration.credentials,
              settings,
              form.title,
              submissionData,
              fieldLabels
            );
            break;
        }

        results.integrations.push({
          type: integration.type,
          success: true,
          result
        });

        logger.info(`Integration ${integration.type} processed successfully for submission ${submission.id}`);

      } catch (error) {
        logger.error(`Integration ${integration.type} failed:`, error);
        results.integrations.push({
          type: integration.type,
          success: false,
          error: error.message
        });
      }
    }

    // Process webhooks
    const webhookResults = await this.processWebhooks(userId, form, submission, submissionData);
    results.webhooks = webhookResults;

    // Trigger Zapier
    try {
      const fullSubmission = await prisma.submission.findUnique({
        where: { id: submission.id },
        include: {
          form: true,
          answers: { include: { field: true } }
        }
      });
      await this.zapier.triggerNewSubmission(userId, fullSubmission);
    } catch (error) {
      logger.error('Zapier trigger failed:', error);
    }

    return results;
  }

  // ===========================================
  // INDIVIDUAL INTEGRATION PROCESSORS
  // ===========================================

  async processMailchimp(credentials, settings, data) {
    const service = this.getService('MAILCHIMP', credentials);
    return service.processSubmission(
      settings.listId,
      data,
      settings.fieldMapping || {}
    );
  }

  async processNotion(credentials, settings, data) {
    const service = this.getService('NOTION', credentials);
    return service.processSubmission(
      settings.databaseId,
      data,
      settings.fieldMapping || {}
    );
  }

  async processDiscord(credentials, settings, formTitle, data, fieldLabels) {
    const service = this.getService('DISCORD', credentials);
    
    // Map field IDs to labels
    const labeledData = {};
    for (const [fieldId, value] of Object.entries(data)) {
      const label = fieldLabels[fieldId] || fieldId;
      labeledData[label] = value;
    }

    return service.sendSubmissionNotification(formTitle, labeledData, {
      color: settings.color ? parseInt(settings.color, 16) : 0xf59e0b
    });
  }

  async processHubSpot(credentials, settings, data, formTitle) {
    const service = this.getService('HUBSPOT', credentials);
    return service.processSubmission(data, settings.fieldMapping || {}, {
      formTitle,
      createDeal: settings.createDeal
    });
  }

  async processAirtable(credentials, settings, data) {
    const service = this.getService('AIRTABLE', credentials);
    return service.processSubmission(
      settings.baseId,
      settings.tableId,
      data,
      settings.fieldMapping || {}
    );
  }

  async processTwilio(credentials, settings, formTitle, data, fieldLabels) {
    const service = this.getService('TWILIO', credentials);
    return service.processSubmission(formTitle, data, fieldLabels, {
      recipients: settings.recipients || []
    });
  }

  async processGoogleSheets(credentials, settings, data, fieldLabels) {
    // Google Sheets integration (using googleapis)
    const { google } = require('googleapis');
    
    const auth = new google.auth.OAuth2();
    auth.setCredentials(credentials);
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get column headers
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: settings.spreadsheetId,
      range: `${settings.sheetName || 'Sheet1'}!1:1`
    });
    
    const headers = headerResponse.data.values?.[0] || [];
    
    // Map data to columns
    const row = headers.map(header => {
      // Find matching field
      for (const [fieldId, value] of Object.entries(data)) {
        const label = fieldLabels[fieldId] || fieldId;
        if (label.toLowerCase() === header.toLowerCase()) {
          return String(value || '');
        }
      }
      return '';
    });
    
    // Add timestamp
    if (headers.includes('Timestamp') || headers.includes('timestamp')) {
      const idx = headers.findIndex(h => h.toLowerCase() === 'timestamp');
      if (idx !== -1) row[idx] = new Date().toISOString();
    }
    
    // Append row
    await sheets.spreadsheets.values.append({
      spreadsheetId: settings.spreadsheetId,
      range: `${settings.sheetName || 'Sheet1'}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] }
    });
    
    return { success: true };
  }

  async processSlack(credentials, settings, formTitle, data, fieldLabels) {
    const axios = require('axios');
    
    // Build message blocks
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `📝 New Submission: ${formTitle}`
        }
      },
      { type: 'divider' }
    ];
    
    // Add fields
    const fields = [];
    for (const [fieldId, value] of Object.entries(data)) {
      const label = fieldLabels[fieldId] || fieldId;
      fields.push({
        type: 'mrkdwn',
        text: `*${label}*\n${value || '-'}`
      });
    }
    
    // Group fields in pairs
    for (let i = 0; i < fields.length; i += 2) {
      blocks.push({
        type: 'section',
        fields: fields.slice(i, i + 2)
      });
    }
    
    await axios.post(credentials.webhookUrl, {
      text: `New submission for ${formTitle}`,
      blocks
    });
    
    return { success: true };
  }

  // ===========================================
  // WEBHOOKS
  // ===========================================

  async processWebhooks(userId, form, submission, data) {
    const webhooks = await prisma.webhook.findMany({
      where: {
        userId,
        active: true,
        events: { has: 'submission.created' }
      }
    });

    const crypto = require('crypto');
    const axios = require('axios');
    const results = [];

    for (const webhook of webhooks) {
      const payload = {
        event: 'submission.created',
        timestamp: new Date().toISOString(),
        form: {
          id: form.id,
          title: form.title,
          publicId: form.publicId
        },
        submission: {
          id: submission.id,
          data,
          completedAt: submission.completedAt
        }
      };

      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      try {
        const response = await axios.post(webhook.url, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-HypeForm-Signature': signature,
            'X-HypeForm-Event': 'submission.created',
            ...webhook.headers
          },
          timeout: 30000
        });

        await prisma.webhookLog.create({
          data: {
            webhookId: webhook.id,
            event: 'submission.created',
            payload,
            statusCode: response.status,
            success: true
          }
        });

        results.push({ webhookId: webhook.id, success: true });
      } catch (error) {
        await prisma.webhookLog.create({
          data: {
            webhookId: webhook.id,
            event: 'submission.created',
            payload,
            statusCode: error.response?.status,
            success: false,
            error: error.message
          }
        });

        results.push({ webhookId: webhook.id, success: false, error: error.message });
      }
    }

    return results;
  }

  // ===========================================
  // HELPERS
  // ===========================================

  async prepareSubmissionData(submission) {
    const answers = await prisma.fieldAnswer.findMany({
      where: { submissionId: submission.id },
      include: { field: true }
    });

    const data = {};
    for (const answer of answers) {
      data[answer.fieldId] = answer.value;
    }

    return data;
  }

  async getFieldLabels(formId) {
    const fields = await prisma.formField.findMany({
      where: { formId },
      select: { id: true, label: true }
    });

    const labels = {};
    for (const field of fields) {
      labels[field.id] = field.label;
    }

    return labels;
  }

  // ===========================================
  // AI FEATURES
  // ===========================================

  async generateFormWithAI(description, apiKey = null) {
    const service = new OpenAIService(apiKey || process.env.OPENAI_API_KEY);
    return service.generateForm(description);
  }

  async analyzeSubmissions(formId, apiKey = null) {
    const service = new OpenAIService(apiKey || process.env.OPENAI_API_KEY);
    
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        submissions: {
          where: { status: 'COMPLETED' },
          include: { answers: true },
          take: 100,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!form) throw new Error('Form not found');

    return service.summarizeSubmissions(form.submissions, form.title);
  }

  async detectSpam(submissionData, apiKey = null) {
    const service = new OpenAIService(apiKey || process.env.OPENAI_API_KEY);
    return service.detectSpam(submissionData);
  }

  // ===========================================
  // TEST INTEGRATIONS
  // ===========================================

  async testIntegration(type, credentials) {
    const service = this.getService(type, credentials);
    return service.testConnection();
  }
}

// Export singleton
module.exports = new IntegrationEngine();
