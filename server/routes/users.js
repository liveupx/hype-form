// ===========================================
// Users Routes
// ===========================================

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
router.use(auth);

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        plan: true,
        emailVerified: true,
        createdAt: true,
        planPeriodEnd: true,
        preferences: true,
        _count: { select: { forms: true } }
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

// Update profile
router.put('/me', [
  body('name').optional().isLength({ min: 1, max: 100 }),
  body('avatar').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, avatar } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { name, avatar },
      select: { id: true, email: true, name: true, avatar: true, role: true, plan: true }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.put('/me/password', [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 })
], async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { password: true }
    });

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Update preferences
router.put('/me/preferences', async (req, res) => {
  try {
    const { preferences } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { preferences: preferences || {} },
      select: { id: true, preferences: true }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Delete account
router.delete('/me', [
  body('password').notEmpty()
], async (req, res) => {
  try {
    const { password } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { password: true }
    });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Password is incorrect' });
    }

    await prisma.user.delete({ where: { id: req.user.userId } });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;
