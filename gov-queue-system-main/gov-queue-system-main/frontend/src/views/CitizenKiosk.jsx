import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Clock, 
  CheckCircle2, 
  User, 
  Phone, 
  HeartHandshake, 
  AlertTriangle,
  Printer,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

export default function CitizenKiosk({ onTrackToken }) {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');
  const [priorityType, setPriorityType] = useState('normal');
  const [loading, setLoading] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await api.getServiceTypes();
      if (res.success) {
        setServices(res.services);
        if (res.services.length > 0) {
          setSelectedService(res.services[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch services:', err);
    }
  };

  const handleGenerateToken = async (e) => {
    e.preventDefault();
    if (!citizenName.trim()) {
      setError('Please enter citizen name');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await api.generateToken({
        serviceTypeId: selectedService,
        citizenName,
        citizenPhone,
        priorityType
      });

      if (res.success) {
        setGeneratedTicket(res.token);
      } else {
        setError(res.message || 'Token generation failed');
      }
    } catch (err) {
      setError('Failed to reach queue server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '1100px' }}>
      
      {/* Title Hero */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div className="badge badge-serving" style={{ marginBottom: '0.75rem', padding: '0.35rem 0.85rem' }}>
          <Sparkles size={14} /> Self-Service Citizen Token Kiosk
        </div>
        <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Get Your Digital Queue Ticket
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
          Select your service type and priority status. Our predictive queue algorithm will generate your ticket and calculate your estimated wait time.
        </p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        
        {/* Token Generation Form */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Ticket color="var(--primary)" /> Issue New Token
          </h3>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleGenerateToken}>
            
            {/* 1. Service Selection */}
            <div className="form-group">
              <label className="form-label">1. Select Government Service Desk</label>
              <div style={{ display: 'grid', gap: '0.65rem' }}>
                {services.map((st) => (
                  <div 
                    key={st._id}
                    onClick={() => setSelectedService(st._id)}
                    className="glass-card"
                    style={{
                      padding: '0.85rem 1rem',
                      cursor: 'pointer',
                      borderColor: selectedService === st._id ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                      background: selectedService === st._id ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255,255,255,0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{st.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{st.description}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-waiting" style={{ fontSize: '0.7rem' }}>
                        {st.waitingCount || 0} Waiting
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Priority Selection */}
            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label className="form-label">2. Priority Category</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem' }}>
                
                <button
                  type="button"
                  className={`btn ${priorityType === 'normal' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPriorityType('normal')}
                  style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem' }}
                >
                  <User size={16} /> Normal Ticket
                </button>

                <button
                  type="button"
                  className={`btn ${priorityType === 'senior' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPriorityType('senior')}
                  style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem', borderColor: priorityType === 'senior' ? 'var(--accent)' : 'var(--border-glass)' }}
                >
                  <HeartHandshake size={16} color="#c084fc" /> Senior Citizen
                </button>

                <button
                  type="button"
                  className={`btn ${priorityType === 'disabled' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPriorityType('disabled')}
                  style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem' }}
                >
                  ♿ Disabled Access
                </button>

                <button
                  type="button"
                  className={`btn ${priorityType === 'urgent' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPriorityType('urgent')}
                  style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem' }}
                >
                  <AlertTriangle size={16} color="#fca5a5" /> Urgent Case
                </button>

              </div>
            </div>

            {/* 3. Citizen Details */}
            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label className="form-label">3. Citizen Details</label>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Full Name (e.g. Ramesh Patel)"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  required
                />
                <input 
                  type="tel" 
                  className="form-input" 
                  placeholder="Phone Number for Live SMS (Optional)"
                  value={citizenPhone}
                  onChange={(e) => setCitizenPhone(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', marginTop: '1.25rem' }}
              disabled={loading}
            >
              {loading ? 'Processing Token Ticket...' : 'Generate Queue Token'}
            </button>
          </form>
        </div>

        {/* Info Box & Predictive Wait Explainer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-panel" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.08))' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} /> Dynamic Wait-Time Prediction
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Our system uses a <strong>Rolling Simple Moving Average (SMA)</strong> of recent service durations. Your predicted wait time updates dynamically as staff process tickets.
            </p>
            <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Priority Interleaving Rule:</div>
              <div style={{ fontSize: '0.825rem', color: '#e5e7eb', marginTop: '0.2rem' }}>
                Priority tokens get 2:1 ratio preference while ensuring normal tickets never starve!
              </div>
            </div>
          </div>

          {/* Quick Active Queue Counter Cards */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
              Active Government Service Desks
            </h4>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {services.map(st => (
                <div key={st._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border-glass)' }}>
                  <span>{st.code} - {st.name}</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    ~{st.estimatedWaitMinutes || 8} min wait
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Printable Token Ticket Receipt Modal */}
      {generatedTicket && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center' }}>
            
            <div style={{ 
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              padding: '1.75rem',
              borderRadius: '16px',
              border: '2px dashed var(--primary)',
              marginBottom: '1.5rem'
            }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                GOVERNMENT OF INDIA - DIGITAL TOKEN
              </div>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: '#3b82f6', letterSpacing: '0.05em', margin: '0.5rem 0' }}>
                {generatedTicket.tokenNumber}
              </div>
              
              <div className={`badge ${generatedTicket.priorityType === 'normal' ? 'badge-waiting' : 'badge-senior'}`} style={{ marginBottom: '1rem' }}>
                {generatedTicket.priorityType.toUpperCase()} PRIORITY
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(255,255,255,0.04)', padding: '1rem', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Wait</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34d399' }}>
                    ~{generatedTicket.estimatedWaitMinutes} mins
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Service Desk</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                    {generatedTicket.serviceType?.name || 'General'}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Citizen: <strong>{generatedTicket.citizenName}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => window.print()}
              >
                <Printer size={16} /> Print Receipt
              </button>
              
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }}
                onClick={() => {
                  onTrackToken(generatedTicket.tokenNumber);
                  setGeneratedTicket(null);
                }}
              >
                Live Track <ArrowRight size={16} />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
