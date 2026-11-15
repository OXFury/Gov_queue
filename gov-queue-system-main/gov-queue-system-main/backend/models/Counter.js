const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  counterNumber: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    // e.g. "Counter 1 - Passport Desk"
  },
  supportedServices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceType',
  }],
  assignedStaff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'closed'],
    default: 'active',
  },
  currentToken: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Token',
    default: null,
  },
  tokensServedToday: {
    type: Number,
    default: 0,
  },
  // Consecutive priority tokens served counter (used by Queue Engine for fair priority ratio enforcement)
  consecutivePriorityServed: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Counter', counterSchema);
