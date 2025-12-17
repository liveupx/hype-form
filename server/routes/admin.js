// ===========================================
// Admin Routes
// ===========================================

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, requireAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();
router.use(auth);
router.use(requireAdmin);

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalForms, totalSubmissions, proUsers] = await Promise.all([
      prisma.user.count(),
      prisma.form.count(),
      prisma.submission.count({ where: { status: 'COMPLETED' } }),
      prisma.user.count({ where: { plan: { in: ['PRO', 'ENTERPRISE'] } } })
    ]);

    // New users this week
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsers = await prisma.user.count({
      where: { createdAt: { gte: weekAgo } }
    });

    res.json({
      totalUsers,
      totalForms,
      totalSubmissions,
      proUsers,
      newUsers
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// List users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, plan, role } = req.query;

    const where = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (plan) where.plan = plan;
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          plan: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { forms: true } }
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get user details
router.get('/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        stripeCustomerId: true,
        _count: {
          select: { forms: true, integrations: true, webhooks: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { role, plan } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role, plan },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true
      }
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'UPDATE_USER',
        resource: 'user',
        resourceId: user.id,
        details: { role, plan }
      }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    await prisma.user.delete({ where: { id: req.params.id } });

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'DELETE_USER',
        resource: 'user',
        resourceId: req.params.id
      }
    });

    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get audit logs
router.get('/audit-logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, action, userId } = req.query;

    const where = {};
    if (action) where.action = action;
    if (userId) where.userId = userId;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit),
      include: {
        user: { select: { email: true, name: true } }
      }
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
});

module.exports = router;
