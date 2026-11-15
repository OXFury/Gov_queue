import React, { useState, useEffect } from 'react';
import { Tv, Volume2, Users, CheckCircle2, Clock } from 'lucide-react';
import { api } from '../services/api';
import socket from '../services/socket';

export default function PublicDisplayBoard() {
  const [activeCounters, setActiveCounters] = useState([]);
  const [waitingTokens, setWaitingTokens] = useState([]);
  const [recentlyCompleted, setRecentlyCompleted] = useState([]);
  const [stats, setStats] = useState({ totalWaiting: 0, totalServing: 0, totalServedToday: 0 });
  const [lastAnnouncement, setLastAnnouncement] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const handleQueueUpdate = () => {
      fetchDashboardData();
    };

    const handleTokenCalled = (data) => {
      setLastAnnouncement(data);
      // Trigger subtle audio beep synthesis if supported
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch (e) {
        // ignore audio policy restrictions
      }
      fetchDashboardData();
    };

    socket.on('queue:updated', handleQueueUpdate);
    socket.on('token:called', handleTokenCalled);

    return () => {
      socket.off('queue:updated', handleQueueUpdate);
      socket.off('token:called', handleTokenCalled);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.getPublicDashboard();
      if (res.success) {
        setActiveCounters(res.activeCounters || []);
        setWaitingTokens(res.waitingTokens || []);
        setRecentlyCompleted(res.recentlyCompleted || []);
        setStats(res.stats || { totalWaiting: 0, totalServing: 0, totalServedToday: 0 });
      }
    } catch (err) {
      console.error('Failed to fetch public dashboard data:', err);
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '1400px' }}>
      
      {/* Live Announcement Banner */}
      {lastAnnouncement && (
        <div className="animate-call mb-6" style={{ 
          padding: '1.25rem 2rem', 
          borderRadius: '16px', 
          border: '2px solid var(--primary)', 
          display: 'flex', 
          alignItems: 'center', 
          justify: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Volume2 size={32} color="#60a5fa" />
            <div>
              <div style={{ fontSize: '0.8rem', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>NOW CALLING</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>
                TOKEN <span style={{ color: '#60a5fa' }}>{lastAnnouncement.tokenNumber}</span> → COUNTER {lastAnnouncement.counterNumber}
              </div>
            </div>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Citizen: {lastAnnouncement.citizenName} ({lastAnnouncement.serviceName})
          </div>
        </div>
      )}

      {/* Stats Overview Bar */}
      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Currently Serving</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#60a5fa' }}>{stats.totalServing}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Waiting Citizens</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24' }}>{stats.totalWaiting}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Served Today</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>{stats.totalServedToday}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        
        {/* Active Counter Display Board */}
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tv color="var(--primary)" /> Service Counters Display
          </h3>

          <div className="grid-2">
            {activeCounters.map((c) => (
              <div key={c._id} className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Counter {c.counterNumber}</h4>
                  <span className="badge badge-serving">ACTIVE</span>
                </div>

                {c.currentToken ? (
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.3)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NOW SERVING</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#60a5fa', letterSpacing: '0.05em' }}>
                      {c.currentToken.tokenNumber}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#e5e7eb', marginTop: '0.25rem' }}>
                      {c.currentToken.citizenName}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '1.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-glass)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                    Counter Ready / Idle
                  </div>
                )}

                <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Supported Services: {c.supportedServices?.map(s => s.code).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Queue Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock color="var(--warning)" size={18} /> Next Up in Queue
            </h4>

            <div style={{ display: 'grid', gap: '0.65rem' }}>
              {waitingTokens.map((t, idx) => (
                <div key={t._id} style={{ 
                  display: 'flex', 
                  justify: 'space-between', 
                  alignItems: 'center', 
                  padding: '0.65rem 0.85rem', 
                  background: 'rgba(255,255,255,0.03)', 
                  borderRadius: '8px',
                  border: '1px solid var(--border-glass)'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                      #{idx + 1} {t.tokenNumber}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {t.serviceType?.code} • {t.citizenName}
                    </div>
                  </div>
                  
                  {t.priorityType !== 'normal' && (
                    <span className="badge badge-senior" style={{ fontSize: '0.65rem' }}>
                      {t.priorityType.toUpperCase()}
                    </span>
                  )}
                </div>
              ))}
              {waitingTokens.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                  No tokens waiting in queue
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
