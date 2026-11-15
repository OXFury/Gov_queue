const mongoose = require('mongoose');

const serviceTypeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    // e.g. 'PAS', 'LIC', 'TAX', 'DOC'
  },
  name: {
    type: String,
    required: true,
    trim: true,
    // e.g. 'Passport Services', 'Driving License', 'Property Tax'
  },
  description: {
    type: String,
    default: '',
  },
  avgDurationMinutes: {
    type: Number,
    default: 10, // Default duration fallback
  },
  // Priority interleaving ratio (e.g. 2 means 2 priority tokens per 1 normal token)
  priorityRatio: {
    type: Number,
    default: 2,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('ServiceType', serviceTypeSchema);
