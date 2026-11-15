const Token = require('../models/Token');
const Counter = require('../models/Counter');
const ServiceType = require('../models/ServiceType');
const User = require('../models/User');
const { analyzeQueueBottlenecks, autoRebalanceCounter } = require('../services/counterOptimizer');

exports.getAnalytics = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const totalServedToday = await Token.countDocuments({
      status: 'completed',
      completedAt: { $gte: startOfDay }
    });

    const totalWaiting = await Token.countDocuments({ status: 'waiting' });
    const totalServing = await Token.countDocuments({ status: 'serving' });
    const totalCancelled = await Token.countDocuments({ status: 'cancelled' });
    const totalNoShow = await Token.countDocuments({ status: 'no_show' });

    // Average wait time calculation
    const completedTokens = await Token.find({
      status: 'completed',
      actualWaitMinutes: { $gt: 0 }
    });

    let avgWaitTimeMinutes = 0;
    if (completedTokens.length > 0) {
      const sumWait = completedTokens.reduce((sum, t) => sum + t.actualWaitMinutes, 0);
      avgWaitTimeMinutes = Math.round((sumWait / completedTokens.length) * 10) / 10;
    }

    // Peak hours analysis (group completed/called tokens by hour of day 0-23)
    const peakHoursData = Array(24).fill(0);
    const tokensToday = await Token.find({
      createdAt: { $gte: startOfDay }
    });

    tokensToday.forEach(token => {
      const hour = new Date(token.createdAt).getHours();
      peakHoursData[hour] += 1;
    });

    // Service Breakdown
    const serviceTypes = await ServiceType.find();
    const serviceBreakdown = await Promise.all(
      serviceTypes.map(async (st) => {
        const totalCount = await Token.countDocuments({ serviceType: st._id });
        const waitingCount = await Token.countDocuments({ serviceType: st._id, status: 'waiting' });
        const completedCount = await Token.countDocuments({ serviceType: st._id, status: 'completed' });
        return {
          code: st.code,
          name: st.name,
          totalCount,
          waitingCount,
          completedCount
        };
      })
    );

    res.json({
      success: true,
      analytics: {
        totalServedToday,
        totalWaiting,
        totalServing,
        totalCancelled,
        totalNoShow,
        avgWaitTimeMinutes,
        peakHours: peakHoursData,
        serviceBreakdown
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOptimizationReport = async (req, res) => {
  try {
    const report = await analyzeQueueBottlenecks();
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.rebalanceCounters = async (req, res) => {
  try {
    const { counterId, serviceTypeId } = req.body;
    if (!counterId || !serviceTypeId) {
      return res.status(400).json({ success: false, message: 'counterId and serviceTypeId required' });
    }

    const updatedCounter = await autoRebalanceCounter(counterId, serviceTypeId);
    
    const io = req.app.get('io');
    if (io) {
      io.emit('queue:updated', { message: 'Counter service rebalanced dynamically' });
    }

    res.json({ success: true, counter: updatedCounter, message: 'Counter service rebalanced successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Counter Management (CRUD)
exports.createCounter = async (req, res) => {
  try {
    const { counterNumber, name, supportedServices, assignedStaff } = req.body;

    const existing = await Counter.findOne({ counterNumber });
    if (existing) {
      return res.status(400).json({ success: false, message: `Counter ${counterNumber} already exists.` });
    }

    const counter = await Counter.create({
      counterNumber,
      name,
      supportedServices: supportedServices || [],
      assignedStaff: assignedStaff || null,
      status: 'active'
    });

    res.status(201).json({ success: true, counter });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteCounter = async (req, res) => {
  try {
    const { counterId } = req.params;
    await Counter.findByIdAndDelete(counterId);
    res.json({ success: true, message: 'Counter removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllCounters = async (req, res) => {
  try {
    const counters = await Counter.find()
      .populate('supportedServices')
      .populate('assignedStaff', 'name email role')
      .populate('currentToken');
    res.json({ success: true, counters });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllStaff = async (req, res) => {
  try {
    const staffMembers = await User.find({ role: { $in: ['staff', 'admin'] } }).select('-password');
    res.json({ success: true, staff: staffMembers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
