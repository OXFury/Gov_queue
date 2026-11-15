import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Clock, 
  MapPin, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Volume2, 
  RefreshCw 
} from 'lucide-react';
import { api } from '../services/api';
import socket from '../services/socket';

export default function CitizenTracker({ initialTokenNumber }) {
  const [tokenNumber, setTokenNumber] = useState(initialTokenNumber || 'PAS-106');
  const [tokenData, setTokenData] = useState(null);
  const [queueInfo, setQueueInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tokenNumber) {
      handleSearch();
    }
  }, []);

  // Listen for socket queue update events
  useEffect(() => {
    const handleQueueUpdate = () => {
      if (tokenNumber) {
        handleSearch();
      }
    };

    socket.on('queue:updated', handleQueueUpdate);
    socket.on('token:called', handleQueueUpdate);

    return () => {
      socket.off('queue:updated', handleQueueUpdate);
      socket.off('token:called', handleQueueUpdate);
    };
  }, [tokenNumber]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!tokenNumber.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await api.getTokenStatus(tokenNumber);
      if (res.success) {
        setTokenData(res.token);
        setQueueInfo(res.queueInfo);
      } else {
        setError(res.message || 'Token not found');
        setTokenData(null);
      }
    } catch (err) {
      setError('Error fetching token status');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelToken = async () => {
    if (!tokenData) return;
    if (window.confirm(`Are you sure you want to cancel token ${tokenData.tokenNumber}?`)) {
      try {
        const res = await api.cancelToken(tokenData.tokenNumber);
        if (res.success) {
          handleSearch();
        }
      } catch (err) {
        alert('Failed to cancel token');
      }
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '850px' }}>
      
      {/* Search Header */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search color="var(--primary)" /> Live Citizen Queue Tracker
        </h2>
        
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Enter Token Number (e.g. PAS-106, LIC-104)"
            value={tokenNumber}
            onChange={(e) => setTokenNumber(e.target.value.toUpperCase())}
            style={{ fontSize: '1.1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0 1.5rem' }} disabled={loading}>
            {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Track Ticket'}
          </button>
        </form>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '1rem', borderRadius: '12px', textAlign: 'center', marginBottom: '1.5rem' }}>
          <AlertCircle size={20} style={{ marginBottom: '0.25rem' }} />
          <div>{error}</div>
        </div>
      )}

      {/* Live Ticket Status Card */}
      {tokenData && (
        <div className="glass-panel" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <span className={`badge ${
                tokenData.status === 'serving' ? 'badge-serving' :
                tokenData.status === 'completed' ? 'badge-completed' : 'badge-waiting'
              }`} style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}>
                STATUS: {tokenData.status.toUpperCase()}
              </span>
              
              <h1 style={{ fontSize: '3.5rem', fontWeight: 800, color: '#fff', letterSpacing: '0.05em', marginTop: '0.5rem' }}>
                {tokenData.tokenNumber}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Citizen: <strong>{tokenData.citizenName}</strong> ({tokenData.priorityType.toUpperCase()} PRIORITY)
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Service Category</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#93c5fd' }}>
                {tokenData.serviceType?.name}
              </div>
            </div>
          </div>

          {/* Status-specific banners */}
          {tokenData.status === 'serving' && (
            <div className="animate-call" style={{ padding: '1.5rem', borderRadius: '14px', border: '2px solid var(--primary)', textAlign: 'center', marginBottom: '1.5rem' }}>
              <Volume2 size={32} color="#60a5fa" style={{ marginBottom: '0.5rem' }} />
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#60a5fa' }}>
                YOUR TOKEN IS BEING CALLED!
              </h3>
              <p style={{ fontSize: '1.1rem', color: '#fff', marginTop: '0.25rem' }}>
                Please proceed to <strong>{tokenData.assignedCounter?.name || 'Counter'}</strong>
              </p>
            </div>
          )}

          {tokenData.status === 'completed' && (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1.25rem', borderRadius: '14px', textAlign: 'center', marginBottom: '1.5rem', color: '#34d399' }}>
              <CheckCircle size={32} style={{ marginBottom: '0.5rem' }} />
              <h3>Service Completed</h3>
              <p style={{ fontSize: '0.875rem' }}>Thank you for visiting. Service duration: {tokenData.serviceDurationMinutes || 5} mins.</p>
            </div>
          )}

          {tokenData.status === 'waiting' && (
            <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
              
              <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <Clock size={24} color="#f59e0b" style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Wait</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbbf24' }}>
                  ~{tokenData.estimatedWaitMinutes} mins
                </div>
              </div>

              <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <MapPin size={24} color="#3b82f6" style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tokens Ahead</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#60a5fa' }}>
                  {queueInfo ? queueInfo.positionAhead : 0} People
                </div>
              </div>

              <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <RefreshCw size={24} color="#8b5cf6" style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Service Queue</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#c084fc' }}>
                  {queueInfo ? queueInfo.totalWaitingInService : 0} Tokens
                </div>
              </div>

            </div>
          )}

          {tokenData.status === 'waiting' && (
            <div style={{ textAlign: 'right' }}>
              <button className="btn btn-danger" onClick={handleCancelToken} style={{ fontSize: '0.85rem' }}>
                <XCircle size={16} /> Cancel Token
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
