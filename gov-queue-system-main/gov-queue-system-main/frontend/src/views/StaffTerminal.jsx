import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Play, 
  CheckCircle, 
  XCircle, 
  Pause, 
  Power, 
  Volume2, 
  Shield, 
  Sparkles,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import socket from '../services/socket';
import { useAuth } from '../context/AuthContext';

export default function StaffTerminal() {
  const { user } = useAuth();
  const [counters, setCounters] = useState([]);
  const [selectedCounterId, setSelectedCounterId] = useState('');
  const [selectedCounter, setSelectedCounter] = useState(null);
  const [currentToken, setCurrentToken] = useState(null);
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [loadingCall, setLoadingCall] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchCounters();
  }, []);

  useEffect(() => {
    if (selectedCounterId) {
      loadCounterDetails(selectedCounterId);
    }
  }, [selectedCounterId]);

  useEffect(() => {
    const handleQueueUpdate = () => {
      if (selectedCounterId) {
        loadCounterDetails(selectedCounterId);
      }
    };

    socket.on('queue:updated', handleQueueUpdate);
    return () => {
      socket.off('queue:updated', handleQueueUpdate);
    };
  }, [selectedCounterId]);

  const fetchCounters = async () => {
    try {
      const res = await api.getAllCounters();
      if (res.success && res.counters.length > 0) {
        setCounters(res.counters);
        // Pre-select counter assigned to staff or default to first counter
        if (user && user.assignedCounter) {
          setSelectedCounterId(user.assignedCounter._id || user.assignedCounter);
        } else {
          setSelectedCounterId(res.counters[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch counters:', err);
    }
  };

  const loadCounterDetails = async (counterId) => {
    try {
      const res = await api.getAllCounters();
      if (res.success) {
        setCounters(res.counters);
        const current = res.counters.find(c => c._id === counterId);
        if (current) {
          setSelectedCounter(current);
          setCurrentToken(current.currentToken || null);
        }
      }
      
      const pubRes = await api.getPublicDashboard();
      if (pubRes.success) {
        setWaitingQueue(pubRes.waitingTokens || []);
      }
    } catch (err) {
      console.error('Error loading counter details:', err);
    }
  };

  const handleCallNext = async () => {
    if (!selectedCounterId) return;
    setLoadingCall(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await api.callNextToken(selectedCounterId);
      if (res.success) {
        if (res.token) {
          setCurrentToken(res.token);
          setMessage({ text: res.message, type: 'success' });
        } else {
          setMessage({ text: 'No waiting tokens for your supported service types.', type: 'info' });
        }
      } else {
        setMessage({ text: res.message, type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Error executing call token', type: 'error' });
    } finally {
      setLoadingCall(false);
      loadCounterDetails(selectedCounterId);
    }
  };

  const handleCompleteToken = async () => {
    if (!currentToken) return;
    try {
      const res = await api.completeToken(currentToken._id);
      if (res.success) {
        setCurrentToken(null);
        setMessage({ text: 'Token marked completed successfully!', type: 'success' });
        loadCounterDetails(selectedCounterId);
      } else {
        setMessage({ text: res.message, type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Failed to complete token', type: 'error' });
    }
  };

  const handleMarkNoShow = async () => {
    if (!currentToken) return;
    if (window.confirm('Mark this citizen as No-Show?')) {
      try {
        const res = await api.markNoShow(currentToken._id);
        if (res.success) {
          setCurrentToken(null);
          setMessage({ text: 'Token marked as No Show', type: 'info' });
          loadCounterDetails(selectedCounterId);
        }
      } catch (err) {
        setMessage({ text: 'Failed to mark no-show', type: 'error' });
      }
    }
  };

  const handleToggleStatus = async (newStatus) => {
    if (!selectedCounterId) return;
    try {
      const res = await api.toggleCounterStatus(selectedCounterId, newStatus);
      if (res.success) {
        loadCounterDetails(selectedCounterId);
      }
    } catch (err) {
      console.error('Error toggling counter status:', err);
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '1200px' }}>
      
      {/* Header & Counter Selector */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck color="var(--primary)" size={24} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Counter Staff Officer Terminal</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Logged in as: <strong>{user?.name}</strong> • Select desk counter to begin serving citizens
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>Active Desk:</label>
            <select 
              className="form-select" 
              value={selectedCounterId}
              onChange={(e) => setSelectedCounterId(e.target.value)}
              style={{ width: 'auto', minWidth: '220px', fontWeight: 600 }}
            >
              {counters.map(c => (
                <option key={c._id} value={c._id}>
                  Counter {c.counterNumber} ({c.name})
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {message.text && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          fontWeight: 600,
          background: message.type === 'error' ? 'rgba(239, 68, 68, 0.15)' :
                      message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
          color: message.type === 'error' ? '#fca5a5' :
                 message.type === 'success' ? '#34d399' : '#93c5fd',
          border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
        }}>
          {message.text}
        </div>
      )}

      {selectedCounter && (
        <div className="grid-2">
          
          {/* Main Serving Station Control */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  Counter {selectedCounter.counterNumber} Station
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Tokens Served Today: <strong>{selectedCounter.tokensServedToday || 0}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className={`btn ${selectedCounter.status === 'active' ? 'btn-success' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                  onClick={() => handleToggleStatus('active')}
                >
                  <Play size={12} /> Active
                </button>
                <button 
                  className={`btn ${selectedCounter.status === 'paused' ? 'btn-warning' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                  onClick={() => handleToggleStatus('paused')}
                >
                  <Pause size={12} /> Pause Desk
                </button>
              </div>
            </div>

            {/* Current Active Token Banner */}
            {currentToken ? (
              <div style={{ background: 'rgba(59, 130, 246, 0.12)', border: '2px solid var(--primary)', borderRadius: '16px', padding: '1.75rem', marginBottom: '1.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#93c5fd' }}>
                  CURRENTLY SERVING CITIZEN
                </div>

                <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#60a5fa', letterSpacing: '0.05em', margin: '0.25rem 0' }}>
                  {currentToken.tokenNumber}
                </div>

                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                  {currentToken.citizenName}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', margin: '0.75rem 0' }}>
                  <span className="badge badge-serving">
                    {currentToken.serviceType?.name || 'General Service'}
                  </span>
                  <span className={`badge ${currentToken.priorityType === 'normal' ? 'badge-waiting' : 'badge-senior'}`}>
                    {currentToken.priorityType.toUpperCase()} PRIORITY
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Wait duration before call: ~{currentToken.actualWaitMinutes || 10} mins
                </div>

                {/* Serving Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button className="btn btn-success" onClick={handleCompleteToken} style={{ padding: '0.75rem' }}>
                    <CheckCircle size={18} /> Mark Completed
                  </button>

                  <button className="btn btn-danger" onClick={handleMarkNoShow} style={{ padding: '0.75rem' }}>
                    <XCircle size={18} /> Mark No-Show
                  </button>
                </div>

              </div>
            ) : (
              <div style={{ 
                padding: '3rem 1.5rem', 
                borderRadius: '16px', 
                border: '2px dashed var(--border-glass)', 
                textAlign: 'center', 
                marginBottom: '1.75rem',
                background: 'rgba(255,255,255,0.01)'
              }}>
                <Clock size={36} color="var(--text-muted)" style={{ marginBottom: '0.75rem' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e5e7eb' }}>Station Idle - Ready for Next Citizen</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Click below to invoke the Fair Priority Interleaving queue engine.
                </p>
              </div>
            )}

            {/* CALL NEXT BUTTON */}
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
              onClick={handleCallNext}
              disabled={loadingCall || selectedCounter.status !== 'active'}
            >
              <Volume2 size={22} /> {loadingCall ? 'Computing Priority Interleave...' : 'CALL NEXT TOKEN TICKET'}
            </button>

          </div>

          {/* Waiting Queue List for Counter */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles color="var(--warning)" size={18} /> Waiting Queue Live Feed
            </h4>

            <div style={{ display: 'grid', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto' }}>
              {waitingQueue.map((t, idx) => (
                <div key={t._id} className="glass-card" style={{ padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                      #{idx + 1} {t.tokenNumber}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {t.citizenName} ({t.serviceType?.name})
                    </div>
                  </div>

                  <span className={`badge ${t.priorityType === 'normal' ? 'badge-waiting' : 'badge-senior'}`}>
                    {t.priorityType.toUpperCase()}
                  </span>
                </div>
              ))}
              {waitingQueue.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No citizens currently waiting in line.
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
