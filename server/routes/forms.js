// ===========================================
// Forms Routes
// ===========================================

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const { nanoid } = require('nanoid');

const prisma = new PrismaClient();
router.use(auth);

// List all forms
router.get('/', async (req, res) => {
  try {
    const { status, search, sort = 'updatedAt', order = 'desc' } = req.query;

    const where = { userId: req.user.userId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const forms = await prisma.form.findMany({
      where,
      orderBy: { [sort]: order },
      include: {
        _count: { select: { submissions: true, fields: true } }
      }
    });

    res.json(forms);
  } catch (error) {
    console.error('List forms error:', error);
    res.status(500).json({ error: 'Failed to list forms' });
  }
});

// Create form
router.post('/', [
  body('title').optional().isLength({ max: 200 }),
  body('description').optional().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const { title, description, templateId } = req.body;

    let formData = {
      userId: req.user.userId,
      publicId: nanoid(10),
      title: title || 'Untitled Form',
      description
    };

    // Create from template
    if (templateId) {
      const template = await prisma.template.findUnique({ where: { id: templateId } });
      if (template) {
        formData.settings = template.settings;
        formData.theme = template.theme;
        
        await prisma.template.update({
          where: { id: templateId },
          data: { uses: { increment: 1 } }
        });
      }
    }

    const form = await prisma.form.create({
      data: formData,
      include: { _count: { select: { submissions: true, fields: true } } }
    });

    // Create fields from template
    if (templateId) {
      const template = await prisma.template.findUnique({ where: { id: templateId } });
      if (template && template.fields) {
        const fields = JSON.parse(template.fields);
        for (let i = 0; i < fields.length; i++) {
          await prisma.formField.create({
            data: {
              formId: form.id,
              ...fields[i],
              order: i
            }
          });
        }
      }
    }

    res.status(201).json(form);
  } catch (error) {
    console.error('Create form error:', error);
    res.status(500).json({ error: 'Failed to create form' });
  }
});

// Get form by ID
router.get('/:id', async (req, res) => {
  try {
    const form = await prisma.form.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.userId
      },
      include: {
        fields: { orderBy: { order: 'asc' } },
        _count: { select: { submissions: true } }
      }
    });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json(form);
  } catch (error) {
    console.error('Get form error:', error);
    res.status(500).json({ error: 'Failed to get form' });
  }
});

// Update form
router.put('/:id', async (req, res) => {
  try {
    const { title, description, settings, theme, metaTitle, metaDescription } = req.body;

    const form = await prisma.form.findFirst({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const updated = await prisma.form.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        settings,
        theme,
        metaTitle,
        metaDescription
      },
      include: {
        fields: { orderBy: { order: 'asc' } },
        _count: { select: { submissions: true } }
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update form error:', error);
    res.status(500).json({ error: 'Failed to update form' });
  }
});

// Delete form
router.delete('/:id', async (req, res) => {
  try {
    const form = await prisma.form.findFirst({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    await prisma.form.delete({ where: { id: req.params.id } });

    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Delete form error:', error);
    res.status(500).json({ error: 'Failed to delete form' });
  }
});

// Publish form
router.post('/:id/publish', async (req, res) => {
  try {
    const form = await prisma.form.findFirst({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const updated = await prisma.form.update({
      where: { id: req.params.id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date()
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to publish form' });
  }
});

// Unpublish form
router.post('/:id/unpublish', async (req, res) => {
  try {
    const form = await prisma.form.findFirst({
      where: { id: req.params.id, userId: req.user.userId }
    });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const updated = await prisma.form.update({
      where: { id: req.params.id },
      data: { status: 'DRAFT' }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to unpublish form' });
  }
});

// Duplicate form
router.post('/:id/duplicate', async (req, res) => {
  try {
    const form = await prisma.form.findFirst({
      where: { id: req.params.id, userId: req.user.userId },
      include: { fields: true }
    });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const newForm = await prisma.form.create({
      data: {
        userId: req.user.userId,
        publicId: nanoid(10),
        title: `${form.title} (Copy)`,
        description: form.description,
        settings: form.settings,
        theme: form.theme,
        status: 'DRAFT'
      }
    });

    // Duplicate fields
    for (const field of form.fields) {
      await prisma.formField.create({
        data: {
          formId: newForm.id,
          type: field.type,
          label: field.label,
          description: field.description,
          placeholder: field.placeholder,
          required: field.required,
          options: field.options,
          settings: field.settings,
          order: field.order
        }
      });
    }

    const result = await prisma.form.findUnique({
      where: { id: newForm.id },
      include: {
        fields: { orderBy: { order: 'asc' } },
        _count: { select: { submissions: true } }
      }
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Duplicate form error:', error);
    res.status(500).json({ error: 'Failed to duplicate form' });
  }
});

module.exports = router;
