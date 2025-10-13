import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('mentormeet_token');
        const response = await axios.get(`http://localhost:5000/api/dashboard/${user.role}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDashboardData(response.data);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user.role]);

  const renderOverview = () => {
    if (loading) return <div className="loading">Loading dashboard data...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!dashboardData) return <div className="no-data">No data available</div>;

    return (
      <div className="overview-grid">
        {Object.entries(dashboardData.overview || {}).map(([key, value]) => (
          <div key={key} className="stat-card">
            <h3>{value}</h3>
            <p>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderTabContent = () => {
    if (loading && activeTab === 'overview') {
      return <div className="loading">Loading...</div>;
    }

    const tabContent = {
      overview: renderOverview(),
      sessions: <div><h3>Session Management</h3><p>Session data will be loaded from backend</p></div>,
      materials: <div><h3>Learning Materials</h3><p>Materials data will be loaded from backend</p></div>,
      profile: <div><h3>Profile Settings</h3><p>Profile data will be loaded from backend</p></div>,
      users: <div><h3>User Management</h3><p>User data will be loaded from backend</p></div>,
      verifications: <div><h3>Tutor Verifications</h3><p>Verification data will be loaded from backend</p></div>,
      sponsorships: <div><h3>Student Sponsorships</h3><p>Sponsorship data will be loaded from backend</p></div>
    };

    return tabContent[activeTab] || renderOverview();
  };

  const getRoleButtons = () => {
    const roleButtons = {
      tutor: ['sessions', 'materials'],
      institution: ['sponsorships', 'materials'],
      admin: ['users', 'verifications']
    };

    return roleButtons[user.role] || [];
  };

  const getActionButton = () => {
    const actions = {
      tutor: { overview: 'Schedule New Session' },
      admin: { verifications: 'Process Verifications' },
      institution: { sponsorships: 'New Sponsorship' }
    };

    return actions[user.role]?.[activeTab];
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>MentorMeet</h1>
          <nav className="main-nav">
            <button 
              className={activeTab === 'overview' ? 'active' : ''} 
              onClick={() => setActiveTab('overview')}
            >
              Dashboard
            </button>
            {getRoleButtons().map(tab => (
              <button 
                key={tab}
                className={activeTab === tab ? 'active' : ''} 
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
            <button 
              className={activeTab === 'profile' ? 'active' : ''} 
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
          </nav>
        </div>
        
        <div className="header-right">
          <div className="user-info">
            <span>Welcome, {user.name}</span>
            <div className="user-role">{user.role}</div>
          </div>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="content-header">
          <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Overview</h2>
          {getActionButton() && (
            <button className="primary-btn">{getActionButton()}</button>
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