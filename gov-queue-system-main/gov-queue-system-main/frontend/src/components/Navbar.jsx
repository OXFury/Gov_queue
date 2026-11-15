import React from 'react';
import { 
  Building2, 
  Ticket, 
  Search, 
  Tv, 
  UserCheck, 
  BarChart3, 
  LogOut, 
  LogIn, 
  ShieldCheck,
  Radio
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeTab, setActiveTab, onOpenLogin }) {
  const { user, logout } = useAuth();

  return (
    <header className="glass-panel app-container mb-6" style={{ padding: '0.85rem 1.5rem', marginTop: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Brand Logo & Live Pulse */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
            padding: '0.6rem', 
            borderRadius: '12px',
            display: 'flex',
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
          }}>
            <Building2 size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #fff, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                GovQueue Pro
              </h1>
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.3rem', 
                fontSize: '0.7rem', 
                background: 'rgba(16, 185, 129, 0.15)', 
                color: '#34d399', 
                padding: '0.15rem 0.5rem', 
                borderRadius: '999px',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                <Radio size={10} className="animate-call" /> Live Engine
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Government Offices Digital Queue & Wait-Time Engine
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'kiosk' ? 'active' : ''}`}
            onClick={() => setActiveTab('kiosk')}
          >
            <Ticket size={16} /> Token Kiosk
          </button>
          
          <button 
            className={`nav-tab ${activeTab === 'tracker' ? 'active' : ''}`}
            onClick={() => setActiveTab('tracker')}
          >
            <Search size={16} /> Live Tracker
          </button>

          <button 
            className={`nav-tab ${activeTab === 'public' ? 'active' : ''}`}
            onClick={() => setActiveTab('public')}
          >
            <Tv size={16} /> Display Board
          </button>

          {/* Show Staff Terminal tab if user is staff or admin */}
          {user && (user.role === 'staff' || user.role === 'admin') && (
            <button 
              className={`nav-tab ${activeTab === 'staff' ? 'active' : ''}`}
              onClick={() => setActiveTab('staff')}
            >
              <UserCheck size={16} /> Staff Desk
            </button>
          )}

          {/* Show Admin Panel tab if user is admin */}
          {user && user.role === 'admin' && (
            <button 
              className={`nav-tab ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <BarChart3 size={16} /> Admin Analytics
            </button>
          )}
        </nav>

        {/* User Account / Auth Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name}</div>
                <div className="badge badge-serving" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                  <ShieldCheck size={10} /> {user.role.toUpperCase()}
                </div>
              </div>
              <button className="btn btn-secondary" onClick={logout} style={{ padding: '0.45rem 0.75rem' }}>
                <LogOut size={16} /> Exit
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={onOpenLogin} style={{ padding: '0.45rem 1rem' }}>
              <LogIn size={16} /> Staff / Admin Login
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
