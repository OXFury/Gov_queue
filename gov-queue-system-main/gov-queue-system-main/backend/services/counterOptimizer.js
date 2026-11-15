const Counter = require('../models/Counter');
const Token = require('../models/Token');
const ServiceType = require('../models/ServiceType');

/**
 * MODULE 4: COUNTER ALLOCATION OPTIMIZER & REBALANCING ENGINE
 * -----------------------------------------------------------------------
 * VIVA EXPLANATION / ARCHITECTURE NOTES:
 * 1. Problem: Fixed counters lead to bottleneck queues (e.g., Counter 1 handling 
 *    Passport Renewal has 25 waiting citizens, while Counter 3 handling Property Tax is idle).
 * 2. Solution: Dynamic Load Rebalancing Engine.
 * 3. Algorithm:
 *    - Periodically computes queue length per ServiceType.
 *    - Identifies "Overloaded Services" (queue length > threshold e.g. 5 tokens).
 *    - Identifies "Idle / Low Load Counters" operating on other services.
 *    - Suggests or automatically applies service assignment updates to assign flexible 
 *      counters to overloaded service types.
 */

async function analyzeQueueBottlenecks() {
  const serviceTypes = await ServiceType.find({ isActive: true });
  const counters = await Counter.find({ status: 'active' }).populate('supportedServices');

  const serviceStats = [];

  for (const st of serviceTypes) {
    const waitingCount = await Token.countDocuments({ serviceType: st._id, status: 'waiting' });
    const servingCount = await Token.countDocuments({ serviceType: st._id, status: 'serving' });
    
    // Counters currently configured for this service
    const activeCounterCount = counters.filter(c => 
      c.supportedServices.some(s => s._id.toString() === st._id.toString())
    ).length;

    serviceStats.push({
      serviceId: st._id,
      code: st.code,
      name: st.name,
      waitingCount,
      servingCount,
      activeCounterCount,
      loadRatio: activeCounterCount > 0 ? (waitingCount / activeCounterCount) : waitingCount,
      isBottleneck: waitingCount >= 5 && activeCounterCount < 3
    });
  }

  // Find recommendations for rebalancing
  const recommendations = [];
  const overloadedServices = serviceStats.filter(s => s.isBottleneck);

  for (const overloaded of overloadedServices) {
    // Find counters that support other low-load services and could be reassigned/added
    const candidateCounters = counters.filter(c => 
      !c.supportedServices.some(s => s._id.toString() === overloaded.serviceId.toString())
    );

    if (candidateCounters.length > 0) {
      recommendations.push({
        type: 'REBALANCE_SUGGESTION',
        overloadedService: overloaded.name,
        waitingCount: overloaded.waitingCount,
        suggestedCounterId: candidateCounters[0]._id,
        suggestedCounterNumber: candidateCounters[0].counterNumber,
        action: `Assign Service '${overloaded.name}' to Counter ${candidateCounters[0].counterNumber} to reduce wait time.`
      });
    }
  }

  return {
    serviceStats,
    recommendations,
    timestamp: new Date()
  };
}

/**
 * Auto-assigns an overloaded service type to an idle counter
 */
async function autoRebalanceCounter(counterId, serviceTypeId) {
  const counter = await Counter.findById(counterId);
  if (!counter) throw new Error('Counter not found');

  // Add serviceTypeId to supportedServices if not already present
  if (!counter.supportedServices.includes(serviceTypeId)) {
    counter.supportedServices.push(serviceTypeId);
    await counter.save();
  }

  return counter;
}

module.exports = {
  analyzeQueueBottlenecks,
  autoRebalanceCounter
};
