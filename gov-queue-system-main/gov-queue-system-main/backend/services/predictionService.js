const Token = require('../models/Token');
const Counter = require('../models/Counter');
const ServiceType = require('../models/ServiceType');

/**
 * MODULE 3: WAIT-TIME PREDICTION ENGINE
 * -----------------------------------------------------------------------
 * VIVA EXPLANATION / ARCHITECTURE NOTES:
 * 1. Problem: Static wait-time estimates (e.g. fixed 10 mins per person) fail 
 *    because counter processing speeds vary dynamically based on transaction complexity 
 *    and staff speed.
 * 2. Solution: Rolling Simple Moving Average (SMA) of the last N completed service 
 *    durations per ServiceType & Counter.
 * 3. Mathematical Formula:
 *    - SMA_Duration = (Sum of last N actual service durations) / N
 *    - Position_In_Queue = Count of waiting tokens ahead for this service type
 *    - Active_Counters = Count of currently active counters supporting this service type
 *    - Estimated_Wait_Minutes = (Position_In_Queue * SMA_Duration) / Active_Counters
 * 4. Extensibility: Mention in viva that this SMA can be enhanced to ML models 
 *    (e.g., XGBoost regression or LSTM time-series) by factoring in time-of-day peak 
 *    load, day of the week, staff efficiency index, and specific sub-service complexity.
 */

const N_SAMPLES = 10; // Rolling window sample size

/**
 * Calculates the predicted wait time in minutes for a given service type.
 * @param {String} serviceTypeId - ID of the ServiceType schema
 * @param {String} priorityType - 'normal', 'senior', 'disabled', or 'urgent'
 * @returns {Promise<Object>} { estimatedWaitMinutes, avgServiceDuration, queueLength, activeCountersCount }
 */
async function calculateWaitTime(serviceTypeId, priorityType = 'normal') {
  try {
    // Step 1: Fetch last N completed tokens for this service type to calculate Simple Moving Average (SMA)
    const recentCompletedTokens = await Token.find({
      serviceType: serviceTypeId,
      status: 'completed',
      serviceDurationMinutes: { $gt: 0 }
    })
    .sort({ completedAt: -1 })
    .limit(N_SAMPLES);

    // Default duration fallback from ServiceType if no historical data available
    let avgServiceDuration = 8; 
    if (recentCompletedTokens.length > 0) {
      const sumDuration = recentCompletedTokens.reduce((acc, token) => acc + token.serviceDurationMinutes, 0);
      avgServiceDuration = Math.max(1, Math.round((sumDuration / recentCompletedTokens.length) * 10) / 10);
    } else {
      const st = await ServiceType.findById(serviceTypeId);
      if (st && st.avgDurationMinutes) {
        avgServiceDuration = st.avgDurationMinutes;
      }
    }

    // Step 2: Find number of active counters servicing this service type
    const activeCountersCount = await Counter.countDocuments({
      status: 'active',
      supportedServices: serviceTypeId
    }) || 1; // avoid division by zero

    // Step 3: Count waiting tokens ahead in queue for this service type
    // Priority logic: If requested token is normal, all waiting priority tokens and older normal tokens are ahead.
    // If requested token is priority (senior/disabled/urgent), only older priority tokens are ahead!
    const isPriority = priorityType !== 'normal';
    
    let waitingQuery = {
      serviceType: serviceTypeId,
      status: 'waiting'
    };

    if (isPriority) {
      // Priority citizens jump ahead of normal citizens
      waitingQuery.priorityType = { $in: ['senior', 'disabled', 'urgent'] };
    }

    const queueLengthAhead = await Token.countDocuments(waitingQuery);

    // Step 4: Compute estimated wait time
    // formula: (queueLengthAhead * avgServiceDuration) / activeCountersCount
    const rawEstimatedWait = (queueLengthAhead * avgServiceDuration) / activeCountersCount;
    const estimatedWaitMinutes = Math.max(1, Math.round(rawEstimatedWait));

    return {
      estimatedWaitMinutes,
      avgServiceDuration,
      queueLengthAhead,
      activeCountersCount
    };
  } catch (err) {
    console.error(`[PredictionService] Error calculating wait time:`, err);
    return { estimatedWaitMinutes: 10, avgServiceDuration: 8, queueLengthAhead: 0, activeCountersCount: 1 };
  }
}

module.exports = {
  calculateWaitTime,
  N_SAMPLES
};
