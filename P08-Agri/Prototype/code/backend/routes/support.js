const express = require('express');
const multer = require('multer');
const SupportTicket = require('../models/SupportTicket');

const router = express.Router();

// Configure multer for file uploads
// Max file size: 5MB (as per use case requirement)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types for support tickets
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed types: images, PDF, text, Word documents.'), false);
    }
  }
});

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// POST /api/support - Create a new support ticket
router.post('/', upload.single('attachment'), async (req, res) => {
  try {
    const { name, email, subject, message, userId } = req.body;

    // Validation: Check mandatory fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Name is required',
        field: 'name'
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Email is required',
        field: 'email'
      });
    }

    // Validate email format
    if (!isValidEmail(email.trim())) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid email format',
        field: 'email'
      });
    }

    if (!subject || !subject.trim()) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Subject is required',
        field: 'subject'
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Message is required',
        field: 'message'
      });
    }

    // Check file size if attachment exists
    if (req.file) {
      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Attachment exceeds size limit of 5MB. Please upload a smaller file.',
          field: 'attachment'
        });
      }
    }

    // Prepare ticket data
    const ticketData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      userId: userId || null,
      status: 'open'
    };

    // Add attachment if present
    if (req.file) {
      ticketData.attachment = {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer
      };
    }

    // Create support ticket
    let ticket;
    try {
      ticket = await SupportTicket.create(ticketData);
    } catch (dbError) {
      // Handle database errors
      console.error('Database error creating support ticket:', dbError);
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Unable to save support request. Please try again later.',
        detail: 'Database connection error'
      });
    }

    // Return success response with ticket ID
    res.status(201).json({
      success: true,
      message: 'Support request submitted successfully',
      ticketId: ticket.ticketId,
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        subject: ticket.subject,
        status: ticket.status,
        createdAt: ticket.createdAt
      }
    });

  } catch (error) {
    console.error('Support route error:', error);

    // Handle multer errors (file size, file type)
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Attachment exceeds size limit of 5MB. Please upload a smaller file.',
          field: 'attachment'
        });
      }
      return res.status(400).json({
        error: 'File upload error',
        message: error.message
      });
    }

    // Handle file filter errors
    if (error.message && error.message.includes('Invalid file type')) {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.message,
        field: 'attachment'
      });
    }

    // Generic error
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.'
    });
  }
});

module.exports = router;

