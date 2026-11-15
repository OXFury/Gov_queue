import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import CitizenKiosk from './views/CitizenKiosk';
import CitizenTracker from './views/CitizenTracker';
import PublicDisplayBoard from './views/PublicDisplayBoard';
import StaffTerminal from './views/StaffTerminal';
import AdminPanel from './views/AdminPanel';

function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('kiosk');
  const [trackedTokenNumber, setTrackedTokenNumber] = useState('');
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleTrackTokenFromKiosk = (tokenNum) => {
    setTrackedTokenNumber(tokenNum);
    setActiveTab('tracker');
  };

  const handleLoginSuccess = (role) => {
    if (role === 'admin') {
      setActiveTab('admin');
    } else if (role === 'staff') {
      setActiveTab('staff');
    }
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '3rem' }}>
      
      {/* Navigation Header */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      {/* Main View Router */}
      <main>
        {activeTab === 'kiosk' && (
          <CitizenKiosk onTrackToken={handleTrackTokenFromKiosk} />
        )}

        {activeTab === 'tracker' && (
          <CitizenTracker initialTokenNumber={trackedTokenNumber} />
        )}

        {activeTab === 'public' && (
          <PublicDisplayBoard />
        )}

        {activeTab === 'staff' && (
          <StaffTerminal />
        )}

        {activeTab === 'admin' && (
          <AdminPanel />
        )}
      </main>

      {/* Staff / Admin Login Modal */}
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)}
        onSuccess={handleLoginSuccess}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
