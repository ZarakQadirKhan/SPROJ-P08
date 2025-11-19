const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  attachment: {
    filename: {
      type: String,
      default: null
    },
    mimetype: {
      type: String,
      default: null
    },
    size: {
      type: Number,
      default: null
    },
    data: {
      type: Buffer,
      default: null
    }
  },
  userId: {
    type: String,
    default: null,
    index: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate unique ticket ID before saving
supportTicketSchema.pre('save', async function(next) {
  if (!this.ticketId) {
    // Generate ticket ID: SUPPORT-YYYYMMDD-HHMMSS-XXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.ticketId = `SUPPORT-${dateStr}-${timeStr}-${random}`;
  }
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);

