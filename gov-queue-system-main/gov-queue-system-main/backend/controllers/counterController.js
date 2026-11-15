const Counter = require('../models/Counter');
const Token = require('../models/Token');
const { getNextTokenForCounter } = require('../services/queueEngine');

exports.callNextToken = async (req, res) => {
  try {
    const { counterId } = req.params;
    const counter = await Counter.findById(counterId).populate('supportedServices');

    if (!counter) {
      return res.status(404).json({ success: false, message: 'Counter not found' });
    }

    if (counter.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Counter is paused or closed' });
    }

    // If counter is currently serving a token, verify if it was completed or needs wrapping up
    if (counter.currentToken) {
      const current = await Token.findById(counter.currentToken);
      if (current && current.status === 'serving') {
        return res.status(400).json({ 
          success: false, 
          message: `Counter is currently serving ${current.tokenNumber}. Complete or mark no-show first.` 
        });
      }
    }

    // Call Queue Engine to fetch next priority-interleaved token
    const nextToken = await getNextTokenForCounter(counter._id);

    if (!nextToken) {
      counter.currentToken = null;
      await counter.save();

      const io = req.app.get('io');
      if (io) io.emit('queue:updated', { message: 'Queue empty for counter', counterNumber: counter.counterNumber });

      return res.json({ success: true, message: 'No waiting tokens for supported services', token: null });
    }

    // Update Token details
    const now = new Date();
    const waitTimeMs = now.getTime() - new Date(nextToken.createdAt).getTime();
    const actualWaitMinutes = Math.max(1, Math.round(waitTimeMs / (1000 * 60)));

    nextToken.status = 'serving';
    nextToken.assignedCounter = counter._id;
    nextToken.servedBy = req.user ? req.user._id : counter.assignedStaff;
    nextToken.calledAt = now;
    nextToken.actualWaitMinutes = actualWaitMinutes;
    await nextToken.save();

    // Update Counter currentToken
    counter.currentToken = nextToken._id;
    await counter.save();

    const populatedToken = await Token.findById(nextToken._id)
      .populate('serviceType')
      .populate('assignedCounter', 'counterNumber name');

    // Notify connected frontend dashboards live via Socket.io!
    const io = req.app.get('io');
    if (io) {
      io.emit('token:called', {
        tokenNumber: populatedToken.tokenNumber,
        counterNumber: counter.counterNumber,
        counterName: counter.name,
        citizenName: populatedToken.citizenName,
        serviceName: populatedToken.serviceType.name
      });
      io.emit('queue:updated', { message: 'Token called' });
    }

    res.json({
      success: true,
      message: `Token ${populatedToken.tokenNumber} called to Counter ${counter.counterNumber}`,
      token: populatedToken
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.completeToken = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const token = await Token.findById(tokenId).populate('assignedCounter');

    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    if (token.status !== 'serving') {
      return res.status(400).json({ success: false, message: `Token is in status '${token.status}', cannot complete.` });
    }

    const now = new Date();
    const durationMs = token.calledAt ? (now.getTime() - new Date(token.calledAt).getTime()) : (5 * 60 * 1000);
    const serviceDurationMinutes = Math.max(1, Math.round(durationMs / (1000 * 60)));

    token.status = 'completed';
    token.completedAt = now;
    token.serviceDurationMinutes = serviceDurationMinutes;
    await token.save();

    // Clear currentToken on assigned counter & increment served count
    if (token.assignedCounter) {
      const counter = await Counter.findById(token.assignedCounter);
      if (counter) {
        if (counter.currentToken && counter.currentToken.toString() === token._id.toString()) {
          counter.currentToken = null;
        }
        counter.tokensServedToday += 1;
        await counter.save();
      }
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('queue:updated', { message: 'Token completed', tokenNumber: token.tokenNumber });
    }

    res.json({ success: true, message: 'Token completed successfully', token });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markNoShow = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const token = await Token.findById(tokenId);

    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    token.status = 'no_show';
    await token.save();

    if (token.assignedCounter) {
      const counter = await Counter.findById(token.assignedCounter);
      if (counter && counter.currentToken && counter.currentToken.toString() === token._id.toString()) {
        counter.currentToken = null;
        await counter.save();
      }
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('queue:updated', { message: 'Token marked no-show', tokenNumber: token.tokenNumber });
    }

    res.json({ success: true, message: 'Token marked as No Show', token });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleCounterStatus = async (req, res) => {
  try {
    const { counterId } = req.params;
    const { status } = req.body; // 'active', 'paused', 'closed'

    if (!['active', 'paused', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const counter = await Counter.findById(counterId);
    if (!counter) {
      return res.status(404).json({ success: false, message: 'Counter not found' });
    }

    counter.status = status;
    await counter.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('queue:updated', { message: `Counter ${counter.counterNumber} status set to ${status}` });
    }

    res.json({ success: true, counter });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
