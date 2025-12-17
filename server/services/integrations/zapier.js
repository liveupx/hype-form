// ===========================================
// Zapier Integration Service
// ===========================================
// Full Zapier integration with triggers and actions
// Supports REST Hooks for instant triggers

const axios = require('axios');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class ZapierService {
  constructor() {
    this.baseUrl = process.env.APP_URL || 'http://localhost:5000';
  }

  // ===========================================
  // WEBHOOK SUBSCRIPTIONS (REST Hooks)
  // ===========================================

  // Create webhook subscription (called by Zapier)
  async subscribe(userId, event, targetUrl, zapId = null) {
    const subscription = await prisma.zapierSubscription.create({
      data: {
        userId,
        event,
        targetUrl,
        zapId,
        secret: crypto.randomBytes(32).toString('hex'),
        active: true
      }
    });

    return {
      id: subscription.id,
      event: subscription.event
    };
  }

  // Delete webhook subscription (called by Zapier)
  async unsubscribe(subscriptionId) {
    await prisma.zapierSubscription.delete({
      where: { id: subscriptionId }
    });
    return { success: true };
  }

  // Get all subscriptions for a user
  async getSubscriptions(userId) {
    return prisma.zapierSubscription.findMany({
      where: { userId, active: true }
    });
  }

  // ===========================================
  // TRIGGERS (Send data to Zapier)
  // ===========================================

  // Trigger event to all subscribed Zaps
  async trigger(event, userId, data) {
    const subscriptions = await prisma.zapierSubscription.findMany({
      where: {
        userId,
        event,
        active: true
      }
    });

    const results = [];

    for (const sub of subscriptions) {
      try {
        // Create signature for verification
        const signature = crypto
          .createHmac('sha256', sub.secret)
          .update(JSON.stringify(data))
          .digest('hex');

        const response = await axios.post(sub.targetUrl, data, {
          headers: {
            'Content-Type': 'application/json',
            'X-HypeForm-Signature': signature,
            'X-HypeForm-Event': event
          },
          timeout: 30000
        });

        // Log successful delivery
        await prisma.zapierLog.create({
          data: {
            subscriptionId: sub.id,
            event,
            payload: data,
            statusCode: response.status,
            success: true
          }
        });

        results.push({ subscriptionId: sub.id, success: true });
      } catch (error) {
        // Log failed delivery
        await prisma.zapierLog.create({
          data: {
            subscriptionId: sub.id,
            event,
            payload: data,
            statusCode: error.response?.status,
            success: false,
            error: error.message
          }
        });

        // Deactivate subscription after too many failures
        const recentFailures = await prisma.zapierLog.count({
          where: {
            subscriptionId: sub.id,
            success: false,
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        });

        if (recentFailures >= 10) {
          await prisma.zapierSubscription.update({
            where: { id: sub.id },
            data: { active: false }
          });
        }

        results.push({ subscriptionId: sub.id, success: false, error: error.message });
      }
    }

    return results;
  }

  // ===========================================
  // TRIGGER EVENTS
  // ===========================================

  // New form submission
  async triggerNewSubmission(userId, submission) {
    const data = {
      event: 'submission.created',
      timestamp: new Date().toISOString(),
      submission: {
        id: submission.id,
        formId: submission.formId,
        formTitle: submission.form?.title,
        status: submission.status,
        completedAt: submission.completedAt,
        answers: submission.answers?.map(a => ({
          fieldId: a.fieldId,
          fieldLabel: a.field?.label,
          fieldType: a.field?.type,
          value: a.value
        })) || []
      }
    };

    return this.trigger('submission.created', userId, data);
  }

  // Form published
  async triggerFormPublished(userId, form) {
    const data = {
      event: 'form.published',
      timestamp: new Date().toISOString(),
      form: {
        id: form.id,
        title: form.title,
        publicId: form.publicId,
        url: `${this.baseUrl}/f/${form.publicId}`
      }
    };

    return this.trigger('form.published', userId, data);
  }

  // Form created
  async triggerFormCreated(userId, form) {
    const data = {
      event: 'form.created',
      timestamp: new Date().toISOString(),
      form: {
        id: form.id,
        title: form.title
      }
    };

    return this.trigger('form.created', userId, data);
  }

  // ===========================================
  // ACTIONS (Receive commands from Zapier)
  // ===========================================

  // Create a form
  async actionCreateForm(userId, data) {
    const { nanoid } = require('nanoid');
    
    const form = await prisma.form.create({
      data: {
        userId,
        publicId: nanoid(10),
        title: data.title || 'Untitled Form',
        description: data.description
      }
    });

    return {
      id: form.id,
      title: form.title,
      publicId: form.publicId,
      url: `${this.baseUrl}/f/${form.publicId}`
    };
  }

  // Add field to form
  async actionAddField(userId, data) {
    // Verify ownership
    const form = await prisma.form.findFirst({
      where: { id: data.formId, userId }
    });

    if (!form) {
      throw new Error('Form not found');
    }

    const maxOrder = await prisma.formField.aggregate({
      where: { formId: data.formId },
      _max: { order: true }
    });

    const field = await prisma.formField.create({
      data: {
        formId: data.formId,
        type: data.type || 'SHORT_TEXT',
        label: data.label,
        description: data.description,
        required: data.required || false,
        order: (maxOrder._max.order || 0) + 1
      }
    });

    return field;
  }

  // Create submission (for importing data)
  async actionCreateSubmission(userId, data) {
    // Verify ownership
    const form = await prisma.form.findFirst({
      where: { id: data.formId, userId },
      include: { fields: true }
    });

    if (!form) {
      throw new Error('Form not found');
    }

    const submission = await prisma.submission.create({
      data: {
        formId: data.formId,
        status: 'COMPLETED',
        completedAt: new Date(),
        metadata: { source: 'zapier' }
      }
    });

    // Create answers
    for (const [fieldId, value] of Object.entries(data.answers || {})) {
      await prisma.fieldAnswer.create({
        data: {
          submissionId: submission.id,
          fieldId,
          value
        }
      });
    }

    return { id: submission.id, formId: data.formId };
  }

  // Get forms (for dynamic dropdowns in Zapier)
  async actionGetForms(userId) {
    const forms = await prisma.form.findMany({
      where: { userId },
      select: { id: true, title: true },
      orderBy: { updatedAt: 'desc' }
    });

    return forms;
  }

  // Get fields for form (for dynamic dropdowns)
  async actionGetFields(userId, formId) {
    const form = await prisma.form.findFirst({
      where: { id: formId, userId },
      include: {
        fields: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!form) {
      throw new Error('Form not found');
    }

    return form.fields.map(f => ({
      id: f.id,
      label: f.label,
      type: f.type
    }));
  }

  // ===========================================
  // SAMPLE DATA (for Zapier testing)
  // ===========================================

  getSampleSubmission() {
    return {
      event: 'submission.created',
      timestamp: new Date().toISOString(),
      submission: {
        id: 'sample_sub_123',
        formId: 'sample_form_456',
        formTitle: 'Contact Form',
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        answers: [
          { fieldId: 'field_1', fieldLabel: 'Name', fieldType: 'SHORT_TEXT', value: 'John Doe' },
          { fieldId: 'field_2', fieldLabel: 'Email', fieldType: 'EMAIL', value: 'john@example.com' },
          { fieldId: 'field_3', fieldLabel: 'Message', fieldType: 'LONG_TEXT', value: 'Hello, this is a test message!' }
        ]
      }
    };
  }

  getSampleForm() {
    return {
      event: 'form.created',
      timestamp: new Date().toISOString(),
      form: {
        id: 'sample_form_456',
        title: 'Contact Form',
        publicId: 'abc123xyz',
        url: `${this.baseUrl}/f/abc123xyz`
      }
    };
  }

  // ===========================================
  // AUTHENTICATION
  // ===========================================

  // Generate API key for Zapier
  async generateApiKey(userId) {
    const key = `hf_zap_${crypto.randomBytes(24).toString('hex')}`;
    const prefix = key.substring(0, 12);

    await prisma.apiKey.create({
      data: {
        userId,
        name: 'Zapier Integration',
        key: await require('bcryptjs').hash(key, 10),
        prefix
      }
    });

    return key; // Return unhashed key (shown once)
  }

  // Validate API key
  async validateApiKey(apiKey) {
    if (!apiKey || !apiKey.startsWith('hf_zap_')) {
      return null;
    }

    const prefix = apiKey.substring(0, 12);
    
    const keys = await prisma.apiKey.findMany({
      where: { prefix },
      include: { user: true }
    });

    for (const keyRecord of keys) {
      const isValid = await require('bcryptjs').compare(apiKey, keyRecord.key);
      if (isValid) {
        // Update last used
        await prisma.apiKey.update({
          where: { id: keyRecord.id },
          data: { lastUsedAt: new Date() }
        });
        return keyRecord.user;
      }
    }

    return null;
  }
}

module.exports = ZapierService;
