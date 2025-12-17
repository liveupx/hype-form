// ===========================================
// Submissions Routes
// ===========================================

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const prisma = new PrismaClient();
router.use(auth);

// Get submissions for a form
router.get('/form/:formId', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;

    const form = await prisma.form.findFirst({
      where: { id: req.params.formId, userId: req.user.userId }
    });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const where = { formId: req.params.formId };
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        include: {
          answers: {
            include: { field: true }
          }
        }
      }),
      prisma.submission.count({ where })
    ]);

    res.json({
      submissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Failed to get submissions' });
  }
});

// Get single submission
router.get('/:id', async (req, res) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: req.params.id },
      include: {
        form: true,
        answers: {
          include: { field: true }
        },
        files: true
      }
    });

    if (!submission || submission.form.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get submission' });
  }
});

// Delete submission
router.delete('/:id', async (req, res) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: req.params.id },
      include: { form: true }
    });

    if (!submission || submission.form.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    await prisma.submission.delete({ where: { id: req.params.id } });

    res.json({ message: 'Submission deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});

// Mark as spam
router.post('/:id/spam', async (req, res) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: req.params.id },
      include: { form: true }
    });

    if (!submission || submission.form.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const updated = await prisma.submission.update({
      where: { id: req.params.id },
      data: { isSpam: true, status: 'SPAM' }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as spam' });
  }
});

// Export submissions
router.get('/form/:formId/export', async (req, res) => {
  try {
    const { format = 'json' } = req.query;

    const form = await prisma.form.findFirst({
      where: { id: req.params.formId, userId: req.user.userId },
      include: { fields: { orderBy: { order: 'asc' } } }
    });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const submissions = await prisma.submission.findMany({
      where: { formId: req.params.formId, status: 'COMPLETED' },
      include: {
        answers: { include: { field: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (format === 'csv') {
      // Create CSV
      const headers = ['Submitted At', ...form.fields.map(f => f.label)];
      const rows = submissions.map(sub => {
        const row = [sub.createdAt.toISOString()];
        form.fields.forEach(field => {
          const answer = sub.answers.find(a => a.fieldId === field.id);
          row.push(answer ? JSON.stringify(answer.value) : '');
        });
        return row;
      });

      const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${form.title}-submissions.csv`);
      return res.send(csv);
    }

    res.json(submissions);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export submissions' });
  }
});

module.exports = router;
