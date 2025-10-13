import React, { useState } from 'react';
import '../../styles/Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data based on user role
  const dashboardData = {
    tutor: {
      overview: {
        sessions: 15,
        earnings: 7500,
        students: 8,
        rating: 4.8
      }
    },
    institution: {
      overview: {
        tutors: 12,
        students: 45,
        sponsorships: 5,
        materials: 23
      }
    },
    admin: {
      overview: {
        users: 150,
        activeUsers: 100,
        suspendedUsers: 50,
        pendingVerifications: 8
      }
    }
  };

  const currentData = dashboardData[user.role] || dashboardData.tutor;

  const renderOverview = () => (
    <div className="overview-grid">
      {Object.entries(currentData.overview).map(([key, value]) => (
        <div key={key} className="stat-card">
          <h3>{value}</h3>
          <p>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</p>
        </div>
      ))}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'sessions':
        return <div>Sessions Management</div>;
      case 'materials':
        return <div>Learning Materials</div>;
      case 'profile':
        return <div>Profile Settings</div>;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>MentorMeet</h1>
          <nav className="main-nav">
            <button className={activeTab === 'overview' ? 'active' : ''} 
                    onClick={() => setActiveTab('overview')}>
              Dashboard
            </button>
            {user.role === 'tutor' && (
              <>
                <button className={activeTab === 'sessions' ? 'active' : ''} 
                        onClick={() => setActiveTab('sessions')}>
                  Sessions
                </button>
                <button className={activeTab === 'materials' ? 'active' : ''} 
                        onClick={() => setActiveTab('materials')}>
                  Materials
                </button>
              </>
            )}
            {user.role === 'institution' && (
              <>
                <button className={activeTab === 'sponsorships' ? 'active' : ''} 
                        onClick={() => setActiveTab('sponsorships')}>
                  Sponsorships
                </button>
                <button className={activeTab === 'materials' ? 'active' : ''} 
                        onClick={() => setActiveTab('materials')}>
                  Materials
                </button>
              </>
            )}
            {user.role === 'admin' && (
              <>
                <button className={activeTab === 'users' ? 'active' : ''} 
                        onClick={() => setActiveTab('users')}>
                  User Management
                </button>
                <button className={activeTab === 'verifications' ? 'active' : ''} 
                        onClick={() => setActiveTab('verifications')}>
                  Verifications
                </button>
              </>
            )}
          </nav>
        </div>
        
        <div className="header-right">
          <div className="user-info">
            <span>Welcome, {user.name}</span>
            <div className="user-role">{user.role}</div>
          </div>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="content-header">
          <h2>
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Overview
          </h2>
          {user.role === 'tutor' && activeTab === 'overview' && (
            <button className="primary-btn">Schedule New Session</button>
          )}
        </div>

        <div className="tab-content">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;