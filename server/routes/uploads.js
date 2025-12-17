// ===========================================
// Uploads Routes
// ===========================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { auth, optionalAuth } = require('../middleware/auth');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../../uploads');
const tempDir = path.join(uploadDir, 'temp');
const submissionsDir = path.join(uploadDir, 'submissions');

[uploadDir, tempDir, submissionsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024 // 100MB default
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// Upload single file (authenticated)
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/temp/${req.file.filename}`;

    res.json({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: fileUrl
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Upload multiple files (authenticated)
router.post('/multiple', auth, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/temp/${file.filename}`
    }));

    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Upload for form submissions (public - no auth)
router.post('/submission', optionalAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Move to submissions folder
    const newPath = path.join(submissionsDir, req.file.filename);
    fs.renameSync(req.file.path, newPath);

    const fileUrl = `/uploads/submissions/${req.file.filename}`;

    res.json({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: fileUrl
    });
  } catch (error) {
    console.error('Submission upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Delete file (authenticated)
router.delete('/:filename', auth, async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Try temp folder first
    let filePath = path.join(tempDir, filename);
    
    if (!fs.existsSync(filePath)) {
      // Try submissions folder
      filePath = path.join(submissionsDir, filename);
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.json({ message: 'File deleted' });
    }

    res.status(404).json({ error: 'File not found' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Error handling for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
    return res.status(400).json({ error: error.message });
  }
  
  if (error.message === 'File type not allowed') {
    return res.status(400).json({ error: 'File type not allowed' });
  }
  
  next(error);
});

module.exports = router;
