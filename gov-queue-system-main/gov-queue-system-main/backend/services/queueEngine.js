const Token = require('../models/Token');
const Counter = require('../models/Counter');
const ServiceType = require('../models/ServiceType');

/**
 * MODULE 2: QUEUE ENGINE & FAIR PRIORITY INTERLEAVING
 * -----------------------------------------------------------------------
 * VIVA EXPLANATION / ARCHITECTURE NOTES:
 * 1. Problem with Pure Priority Queues: Pure Priority Queueing causes 
 *    "Normal Token Starvation". If senior citizens/disabled citizens keep 
 *    arriving, normal tokens waiting for 2 hours might never get called!
 * 2. Solution: Fair Priority Interleaving (Weighted Priority Scheduling).
 * 3. Algorithm:
 *    - Each service type defines a `priorityRatio` (e.g. 2:1 ratio).
 *    - The system tracks `consecutivePriorityServed` at each counter.
 *    - If consecutive priority tokens served at counter >= priorityRatio AND 
 *      a waiting normal token exists, the queue engine FORCES serving the oldest normal token.
 *    - Otherwise, if any priority token is waiting, it serves the highest priority token first.
 *    - If no priority token is waiting, it serves the oldest normal token.
 */

/**
 * Fetches the next best token for a counter using Fair Priority Interleaving.
 * @param {String} counterId - MongoDB ID of the requesting Counter
 * @returns {Promise<Document|null>} Next Token document to be served
 */
async function getNextTokenForCounter(counterId) {
  const counter = await Counter.findById(counterId);
  if (!counter || counter.status !== 'active') {
    throw new Error('Counter is not active or invalid');
  }

  if (!counter.supportedServices || counter.supportedServices.length === 0) {
    return null;
  }

  const supportedServiceIds = counter.supportedServices;

  // Find priority tokens waiting for any service supported by this counter
  const priorityTokens = await Token.find({
    serviceType: { $in: supportedServiceIds },
    status: 'waiting',
    priorityType: { $in: ['senior', 'disabled', 'urgent'] }
  })
  .sort({ priorityScore: -1, createdAt: 1 }); // Higher priority score first, then FC-FS

  // Find normal tokens waiting for any service supported by this counter
  const normalTokens = await Token.find({
    serviceType: { $in: supportedServiceIds },
    status: 'waiting',
    priorityType: 'normal'
  })
  .sort({ createdAt: 1 }); // Pure FC-FS (First Come, First Served)

  if (priorityTokens.length === 0 && normalTokens.length === 0) {
    return null; // No tokens waiting
  }

  // Get priority ratio threshold (default to 2 if not found)
  let maxPriorityRatio = 2;
  if (priorityTokens.length > 0) {
    const st = await ServiceType.findById(priorityTokens[0].serviceType);
    if (st && st.priorityRatio) {
      maxPriorityRatio = st.priorityRatio;
    }
  }

  let selectedToken = null;

  // Starvation prevention rule check
  const forceNormal = counter.consecutivePriorityServed >= maxPriorityRatio;

  if (forceNormal && normalTokens.length > 0) {
    // Force normal token to prevent starvation!
    selectedToken = normalTokens[0];
    counter.consecutivePriorityServed = 0; // Reset consecutive priority counter
  } else if (priorityTokens.length > 0) {
    // Serve priority token
    selectedToken = priorityTokens[0];
    counter.consecutivePriorityServed += 1;
  } else if (normalTokens.length > 0) {
    // Serve normal token (no priority tokens exist)
    selectedToken = normalTokens[0];
    counter.consecutivePriorityServed = 0;
  }

  if (counter.isModified()) {
    await counter.save();
  }

  return selectedToken;
}

/**
 * Calculates current queue depth and position details for a given token.
 * @param {String} tokenId 
 */
async function getTokenQueuePosition(tokenId) {
  const token = await Token.findById(tokenId).populate('serviceType');
  if (!token) return null;

  if (token.status !== 'waiting') {
    return {
      status: token.status,
      positionAhead: 0,
      totalWaitingInService: 0
    };
  }

  // Total waiting for this service
  const totalWaitingInService = await Token.countDocuments({
    serviceType: token.serviceType._id,
    status: 'waiting'
  });

  // Calculate position ahead based on priority rules
  let countAheadQuery = {
    serviceType: token.serviceType._id,
    status: 'waiting',
    createdAt: { $lt: token.createdAt }
  };

  if (token.priorityType === 'normal') {
    // All priority tokens currently waiting count as ahead of normal token
    const priorityCount = await Token.countDocuments({
      serviceType: token.serviceType._id,
      status: 'waiting',
      priorityType: { $in: ['senior', 'disabled', 'urgent'] }
    });

    const olderNormalCount = await Token.countDocuments({
      serviceType: token.serviceType._id,
      status: 'waiting',
      priorityType: 'normal',
      createdAt: { $lt: token.createdAt }
    });

    return {
      status: 'waiting',
      positionAhead: priorityCount + olderNormalCount,
      totalWaitingInService
    };
  } else {
    // For priority tokens, only older priority tokens count as ahead
    const olderPriorityCount = await Token.countDocuments({
      serviceType: token.serviceType._id,
      status: 'waiting',
      priorityType: { $in: ['senior', 'disabled', 'urgent'] },
      createdAt: { $lt: token.createdAt }
    });

    return {
      status: 'waiting',
      positionAhead: olderPriorityCount,
      totalWaitingInService
    };
  }
}

module.exports = {
  getNextTokenForCounter,
  getTokenQueuePosition
};
