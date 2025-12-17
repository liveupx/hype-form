// ===========================================
// Public Routes (No Auth Required)
// ===========================================

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get public form by publicId
router.get('/forms/:publicId', async (req, res) => {
  try {
    const form = await prisma.form.findUnique({
      where: { publicId: req.params.publicId },
      include: {
        fields: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    if (form.status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'Form is not available' });
    }

    // Increment views
    await prisma.form.update({
      where: { id: form.id },
      data: { views: { increment: 1 } }
    });

    // Log analytics event
    await prisma.analyticsEvent.create({
      data: {
        formId: form.id,
        type: 'view',
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      }
    });

    // Remove sensitive data
    const { userId, ...publicForm } = form;

    res.json(publicForm);
  } catch (error) {
    console.error('Get public form error:', error);
    res.status(500).json({ error: 'Failed to get form' });
  }
});

// Start form (track analytics)
router.post('/forms/:publicId/start', async (req, res) => {
  try {
    const { sessionId } = req.body;

    const form = await prisma.form.findUnique({
      where: { publicId: req.params.publicId }
    });

    if (!form || form.status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Increment starts
    await prisma.form.update({
      where: { id: form.id },
      data: { starts: { increment: 1 } }
    });

    // Log analytics
    await prisma.analyticsEvent.create({
      data: {
        formId: form.id,
        type: 'start',
        sessionId,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      }
    });

    res.json({ message: 'Form started' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to track start' });
  }
});

// Submit form response
router.post('/forms/:publicId/submit', async (req, res) => {
  try {
    const { answers, metadata, sessionId } = req.body;

    const form = await prisma.form.findUnique({
      where: { publicId: req.params.publicId },
      include: { fields: true }
    });

    if (!form || form.status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Validate required fields
    const requiredFields = form.fields.filter(f => f.required);
    for (const field of requiredFields) {
      if (!answers[field.id] || answers[field.id] === '') {
        return res.status(400).json({ 
          error: `${field.label} is required`,
          fieldId: field.id
        });
      }
    }

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        formId: form.id,
        status: 'COMPLETED',
        completedAt: new Date(),
        metadata: {
          ...metadata,
          userAgent: req.headers['user-agent'],
          referrer: req.headers.referer
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    // Create answers
    for (const [fieldId, value] of Object.entries(answers)) {
      await prisma.fieldAnswer.create({
        data: {
          submissionId: submission.id,
          fieldId,
          value
        }
      });
    }

    // Log analytics
    await prisma.analyticsEvent.create({
      data: {
        formId: form.id,
        type: 'complete',
        sessionId,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      }
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`form:${form.id}`).emit('new-submission', {
        formId: form.id,
        submissionId: submission.id
      });
    }

    res.status(201).json({
      message: 'Submission received',
      submissionId: submission.id
    });
  } catch (error) {
    console.error('Submit form error:', error);
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

// Save partial submission
router.post('/forms/:publicId/partial', async (req, res) => {
  try {
    const { answers, sessionId, submissionId } = req.body;

    const form = await prisma.form.findUnique({
      where: { publicId: req.params.publicId }
    });

    if (!form || form.status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'Form not found' });
    }

    let submission;

    if (submissionId) {
      // Update existing partial submission
      submission = await prisma.submission.findUnique({
        where: { id: submissionId }
      });

      if (!submission || submission.status !== 'PARTIAL') {
        return res.status(400).json({ error: 'Invalid submission' });
      }

      // Update answers
      for (const [fieldId, value] of Object.entries(answers)) {
        await prisma.fieldAnswer.upsert({
          where: {
            submissionId_fieldId: { submissionId, fieldId }
          },
          update: { value },
          create: {
            submissionId,
            fieldId,
            value
          }
        });
      }
    } else {
      // Create new partial submission
      submission = await prisma.submission.create({
        data: {
          formId: form.id,
          status: 'PARTIAL',
          metadata: { sessionId },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      // Create initial answers
      for (const [fieldId, value] of Object.entries(answers)) {
        await prisma.fieldAnswer.create({
          data: {
            submissionId: submission.id,
            fieldId,
            value
          }
        });
      }
    }

    res.json({
      submissionId: submission.id,
      message: 'Progress saved'
    });
  } catch (error) {
    console.error('Save partial error:', error);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

module.exports = router;
