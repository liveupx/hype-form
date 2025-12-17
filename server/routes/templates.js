// ===========================================
// Templates Routes
// ===========================================

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, optionalAuth } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get all public templates (no auth required)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, featured, search } = req.query;

    const where = { isPublic: true };
    if (category) where.category = category;
    if (featured === 'true') where.featured = true;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const templates = await prisma.template.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { uses: 'desc' }]
    });

    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get templates' });
  }
});

// Get template categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.template.groupBy({
      by: ['category'],
      where: { isPublic: true },
      _count: true
    });

    res.json(categories.map(c => ({
      name: c.category,
      count: c._count
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Get featured templates
router.get('/featured', async (req, res) => {
  try {
    const templates = await prisma.template.findMany({
      where: { isPublic: true, featured: true },
      take: 6,
      orderBy: { uses: 'desc' }
    });

    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get featured templates' });
  }
});

// Get single template
router.get('/:id', async (req, res) => {
  try {
    const template = await prisma.template.findUnique({
      where: { id: req.params.id }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get template' });
  }
});

// Use template (create form from template) - requires auth
router.post('/:id/use', auth, async (req, res) => {
  try {
    const { nanoid } = require('nanoid');

    const template = await prisma.template.findUnique({
      where: { id: req.params.id }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Create form from template
    const form = await prisma.form.create({
      data: {
        userId: req.user.userId,
        publicId: nanoid(10),
        title: template.name,
        description: template.description,
        settings: template.settings,
        theme: template.theme
      }
    });

    // Create fields
    const fields = JSON.parse(template.fields || '[]');
    for (let i = 0; i < fields.length; i++) {
      await prisma.formField.create({
        data: {
          formId: form.id,
          ...fields[i],
          order: i
        }
      });
    }

    // Increment uses
    await prisma.template.update({
      where: { id: template.id },
      data: { uses: { increment: 1 } }
    });

    const result = await prisma.form.findUnique({
      where: { id: form.id },
      include: { fields: { orderBy: { order: 'asc' } } }
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Use template error:', error);
    res.status(500).json({ error: 'Failed to use template' });
  }
});

module.exports = router;
