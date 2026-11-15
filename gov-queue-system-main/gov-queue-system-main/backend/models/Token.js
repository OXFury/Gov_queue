const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  tokenNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  serviceType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceType',
    required: true,
  },
  citizenName: {
    type: String,
    required: true,
    trim: true,
  },
  citizenPhone: {
    type: String,
    trim: true,
    default: '',
  },
  priorityType: {
    type: String,
    enum: ['normal', 'senior', 'disabled', 'urgent'],
    default: 'normal',
  },
  // Higher score = higher queue position priority
  priorityScore: {
    type: Number,
    default: 1, // normal = 1, senior/disabled/urgent = 3
  },
  status: {
    type: String,
    enum: ['waiting', 'serving', 'completed', 'cancelled', 'no_show'],
    default: 'waiting',
    index: true,
  },
  assignedCounter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Counter',
    default: null,
  },
  servedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  estimatedWaitMinutes: {
    type: Number,
    default: 0,
  },
  actualWaitMinutes: {
    type: Number,
    default: 0,
  },
  serviceDurationMinutes: {
    type: Number,
    default: 0,
  },
  calledAt: {
    type: Date,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Token', tokenSchema);
