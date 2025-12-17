// ===========================================
// Analytics Routes
// ===========================================

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const prisma = new PrismaClient();
router.use(auth);

// Dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all user's forms
    const forms = await prisma.form.findMany({
      where: { userId },
      select: { id: true }
    });
    const formIds = forms.map(f => f.id);

    // Total stats
    const [totalForms, totalSubmissions, totalViews] = await Promise.all([
      prisma.form.count({ where: { userId } }),
      prisma.submission.count({
        where: { formId: { in: formIds }, status: 'COMPLETED' }
      }),
      prisma.form.aggregate({
        where: { userId },
        _sum: { views: true }
      })
    ]);

    // Recent submissions (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSubmissions = await prisma.submission.count({
      where: {
        formId: { in: formIds },
        status: 'COMPLETED',
        createdAt: { gte: sevenDaysAgo }
      }
    });

    // Submissions by day (last 7 days)
    const submissionsByDay = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM submissions
      WHERE form_id = ANY(${formIds})
        AND status = 'COMPLETED'
        AND created_at >= ${sevenDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    res.json({
      totalForms,
      totalSubmissions,
      totalViews: totalViews._sum.views || 0,
      recentSubmissions,
      submissionsByDay
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// Form analytics
router.get('/forms/:formId', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const form = await prisma.form.findFirst({
      where: { id: req.params.formId, userId: req.user.userId }
    });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const where = { formId: form.id };
    if (Object.keys(dateFilter).length > 0) {
      where.createdAt = dateFilter;
    }

    // Get counts
    const [views, starts, completions] = await Promise.all([
      prisma.analyticsEvent.count({ where: { ...where, type: 'view' } }),
      prisma.analyticsEvent.count({ where: { ...where, type: 'start' } }),
      prisma.submission.count({ where: { ...where, status: 'COMPLETED' } })
    ]);

    // Conversion rates
    const startRate = views > 0 ? (starts / views) * 100 : 0;
    const completionRate = starts > 0 ? (completions / starts) * 100 : 0;
    const overallRate = views > 0 ? (completions / views) * 100 : 0;

    res.json({
      views,
      starts,
      completions,
      startRate: Math.round(startRate * 10) / 10,
      completionRate: Math.round(completionRate * 10) / 10,
      overallRate: Math.round(overallRate * 10) / 10
    });
  } catch (error) {
    console.error('Form analytics error:', error);
    res.status(500).json({ error: 'Failed to get form analytics' });
  }
});

// Submission trends
router.get('/forms/:formId/trends', async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const form = await prisma.form.findFirst({
      where: { id: req.params.formId, userId: req.user.userId }
    });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const trends = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM submissions
      WHERE form_id = ${form.id}
        AND status = 'COMPLETED'
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get trends' });
  }
});

module.exports = router;
