// ===========================================
// Fields Routes
// ===========================================

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');

const prisma = new PrismaClient();
router.use(auth);

// Get fields for a form
router.get('/form/:formId', async (req, res) => {
  try {
    const form = await prisma.form.findFirst({
      where: { id: req.params.formId, userId: req.user.userId }
    });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const fields = await prisma.formField.findMany({
      where: { formId: req.params.formId },
      orderBy: { order: 'asc' }
    });

    res.json(fields);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get fields' });
  }
});

// Create field
router.post('/', [
  body('formId').notEmpty(),
  body('type').notEmpty(),
  body('label').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { formId, type, label, description, placeholder, required, options, settings } = req.body;

    const form = await prisma.form.findFirst({
      where: { id: formId, userId: req.user.userId }
    });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Get max order
    const maxOrder = await prisma.formField.aggregate({
      where: { formId },
      _max: { order: true }
    });

    const field = await prisma.formField.create({
      data: {
        formId,
        type,
        label,
        description,
        placeholder,
        required: required || false,
        options: options || [],
        settings: settings || {},
        order: (maxOrder._max.order || 0) + 1
      }
    });

    res.status(201).json(field);
  } catch (error) {
    console.error('Create field error:', error);
    res.status(500).json({ error: 'Failed to create field' });
  }
});

// Update field
router.put('/:id', async (req, res) => {
  try {
    const { type, label, description, placeholder, required, options, settings } = req.body;

    const field = await prisma.formField.findUnique({
      where: { id: req.params.id },
      include: { form: true }
    });

    if (!field || field.form.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Field not found' });
    }

    const updated = await prisma.formField.update({
      where: { id: req.params.id },
      data: { type, label, description, placeholder, required, options, settings }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update field' });
  }
});

// Delete field
router.delete('/:id', async (req, res) => {
  try {
    const field = await prisma.formField.findUnique({
      where: { id: req.params.id },
      include: { form: true }
    });

    if (!field || field.form.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Field not found' });
    }

    await prisma.formField.delete({ where: { id: req.params.id } });

    res.json({ message: 'Field deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete field' });
  }
});

// Reorder fields
router.post('/reorder', async (req, res) => {
  try {
    const { formId, fieldIds } = req.body;

    const form = await prisma.form.findFirst({
      where: { id: formId, userId: req.user.userId }
    });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Update order for each field
    for (let i = 0; i < fieldIds.length; i++) {
      await prisma.formField.update({
        where: { id: fieldIds[i] },
        data: { order: i }
      });
    }

    const fields = await prisma.formField.findMany({
      where: { formId },
      orderBy: { order: 'asc' }
    });

    res.json(fields);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reorder fields' });
  }
});

// Duplicate field
router.post('/:id/duplicate', async (req, res) => {
  try {
    const field = await prisma.formField.findUnique({
      where: { id: req.params.id },
      include: { form: true }
    });

    if (!field || field.form.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Field not found' });
    }

    const newField = await prisma.formField.create({
      data: {
        formId: field.formId,
        type: field.type,
        label: `${field.label} (Copy)`,
        description: field.description,
        placeholder: field.placeholder,
        required: field.required,
        options: field.options,
        settings: field.settings,
        order: field.order + 1
      }
    });

    res.status(201).json(newField);
  } catch (error) {
    res.status(500).json({ error: 'Failed to duplicate field' });
  }
});

module.exports = router;
