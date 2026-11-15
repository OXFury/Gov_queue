const Token = require('../models/Token');
const ServiceType = require('../models/ServiceType');
const Counter = require('../models/Counter');
const { calculateWaitTime } = require('../services/predictionService');
const { getTokenQueuePosition } = require('../services/queueEngine');

// Generate Token Number e.g. "PAS-101", "LIC-102"
async function generateTokenNumber(serviceCode) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const countToday = await Token.countDocuments({
    createdAt: { $gte: startOfDay }
  });

  const nextNum = 101 + countToday;
  return `${serviceCode}-${nextNum}`;
}

exports.createToken = async (req, res) => {
  try {
    const { serviceTypeId, citizenName, citizenPhone, priorityType } = req.body;

    if (!serviceTypeId || !citizenName) {
      return res.status(400).json({ success: false, message: 'Service type and citizen name are required' });
    }

    const serviceType = await ServiceType.findById(serviceTypeId);
    if (!serviceType || !serviceType.isActive) {
      return res.status(400).json({ success: false, message: 'Selected service type is invalid or inactive' });
    }

    // Priority type mapping
    const validPriority = ['normal', 'senior', 'disabled', 'urgent'].includes(priorityType) ? priorityType : 'normal';
    const priorityScore = validPriority === 'normal' ? 1 : 3; // Priority citizens get higher score

    const tokenNumber = await generateTokenNumber(serviceType.code);

    // Compute initial predicted wait time using Prediction Service
    const prediction = await calculateWaitTime(serviceType._id, validPriority);

    const newToken = await Token.create({
      tokenNumber,
      serviceType: serviceType._id,
      citizenName,
      citizenPhone: citizenPhone || '',
      priorityType: validPriority,
      priorityScore,
      status: 'waiting',
      estimatedWaitMinutes: prediction.estimatedWaitMinutes,
    });

    const populatedToken = await Token.findById(newToken._id).populate('serviceType');

    // Notify connected Socket clients live
    const io = req.app.get('io');
    if (io) {
      io.emit('queue:updated', { message: 'New token generated', tokenNumber: populatedToken.tokenNumber });
    }

    res.status(201).json({
      success: true,
      token: populatedToken,
      prediction
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTokenStatus = async (req, res) => {
  try {
    const { tokenNumber } = req.params;
    const token = await Token.findOne({ tokenNumber: tokenNumber.toUpperCase() })
      .populate('serviceType')
      .populate('assignedCounter', 'counterNumber name');

    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    const queueInfo = await getTokenQueuePosition(token._id);
    const prediction = await calculateWaitTime(token.serviceType._id, token.priorityType);

    res.json({
      success: true,
      token,
      queueInfo,
      updatedEstimatedWaitMinutes: prediction.estimatedWaitMinutes
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getServiceTypes = async (req, res) => {
  try {
    const services = await ServiceType.find({ isActive: true });
    
    // Attach current queue stats and estimated wait times
    const enrichedServices = await Promise.all(
      services.map(async (service) => {
        const waitingCount = await Token.countDocuments({ serviceType: service._id, status: 'waiting' });
        const prediction = await calculateWaitTime(service._id, 'normal');
        return {
          ...service.toObject(),
          waitingCount,
          estimatedWaitMinutes: prediction.estimatedWaitMinutes
        };
      })
    );

    res.json({ success: true, services: enrichedServices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPublicDashboardState = async (req, res) => {
  try {
    const activeCounters = await Counter.find({ status: 'active' })
      .populate('supportedServices')
      .populate({
        path: 'currentToken',
        populate: { path: 'serviceType' }
      })
      .populate('assignedStaff', 'name')
      .sort({ counterNumber: 1 });

    const waitingTokens = await Token.find({ status: 'waiting' })
      .populate('serviceType')
      .sort({ createdAt: 1 })
      .limit(10);

    const recentlyCompleted = await Token.find({ status: 'completed' })
      .populate('serviceType')
      .populate('assignedCounter', 'counterNumber')
      .sort({ completedAt: -1 })
      .limit(5);

    // Compute global stats
    const totalWaiting = await Token.countDocuments({ status: 'waiting' });
    const totalServing = await Token.countDocuments({ status: 'serving' });
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const totalServedToday = await Token.countDocuments({
      status: 'completed',
      completedAt: { $gte: startOfDay }
    });

    res.json({
      success: true,
      activeCounters,
      waitingTokens,
      recentlyCompleted,
      stats: {
        totalWaiting,
        totalServing,
        totalServedToday
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.cancelToken = async (req, res) => {
  try {
    const { tokenNumber } = req.params;
    const token = await Token.findOne({ tokenNumber: tokenNumber.toUpperCase() });

    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    if (token.status !== 'waiting') {
      return res.status(400).json({ success: false, message: `Cannot cancel token in '${token.status}' status` });
    }

    token.status = 'cancelled';
    await token.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('queue:updated', { message: 'Token cancelled', tokenNumber: token.tokenNumber });
    }

    res.json({ success: true, message: 'Token cancelled successfully', token });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
