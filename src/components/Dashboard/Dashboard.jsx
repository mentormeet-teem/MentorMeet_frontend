import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Debug: Check what user data we're receiving
  useEffect(() => {
    console.log('User data in dashboard:', user);
  }, [user]);

  const fetchPendingTutors = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('mentormeet_token');
      console.log('Fetching pending tutors with token:', token ? 'Token exists' : 'No token');
      
      const response = await axios.get('http://localhost:5010/api/admin/pending-tutors', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Pending tutors response:', response.data);
      setData(response.data);
      
    } catch (err) {
      console.error('Error fetching pending tutors:', err);
      console.error('Error response:', err.response);
      
      if (err.response?.status === 401) {
        setError('Unauthorized: Please login again');
        onLogout(); // Auto logout if token is invalid
      } else if (err.response?.status === 403) {
        setError('Access denied: Admin privileges required');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to load pending tutors. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchVerifiedTutors = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('mentormeet_token');
      console.log('=== DEBUG VERIFIED TUTORS REQUEST ===');
      console.log('Token exists:', !!token);
      console.log('User role:', user.role);
      console.log('Full user object:', user);
      
      const response = await axios.get('http://localhost:5010/api/admin/verified-tutors', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ SUCCESS - Verified tutors response:', response.data);
      setData(response.data);
      
    } catch (err) {
      console.log('❌ FULL ERROR DETAILS:');
      console.log('Error object:', err);
      console.log('Error message:', err.message);
      console.log('Error code:', err.code);
      console.log('Error status:', err.response?.status);
      console.log('Error status text:', err.response?.statusText);
      console.log('Error data:', err.response?.data);
      console.log('Error headers:', err.response?.headers);
      
      if (err.response?.status === 401) {
        setError('Unauthorized: Please login again');
        onLogout();
      } else if (err.response?.status === 403) {
        setError('Access denied: Admin privileges required');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.code === 'ERR_NETWORK') {
        setError('Network error: Cannot connect to server');
      } else {
        setError(`Failed to load verified tutors: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderAdminContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div>
            <h3>Admin Overview</h3>
            <p>Welcome to MentorMeet Admin Panel</p>
            <div className="overview-grid">
              <div className="stat-card">
                <h3>8</h3>
                <p>Pending Verifications</p>
              </div>
              <div className="stat-card">
                <h3>25</h3>
                <p>Verified Tutors</p>
              </div>
              <div className="stat-card">
                <h3>150</h3>
                <p>Total Users</p>
              </div>
              <div className="stat-card">
                <h3>45</h3>
                <p>Active Sessions</p>
              </div>
            </div>
            
            <div style={{marginTop: '30px'}}>
              <h4>Quick Actions</h4>
              <button onClick={fetchPendingTutors} className="primary-btn" style={{marginRight: '10px'}}>
                View Pending Tutors
              </button>
              <button onClick={fetchVerifiedTutors} className="primary-btn">
                View Verified Tutors
              </button>
            </div>
          </div>
        );
      
      case 'verifications':
        return (
          <div>
            <h3>Tutor Verifications</h3>
            <p>Manage tutor verification requests</p>
            
            <button onClick={fetchPendingTutors} className="primary-btn" disabled={loading}>
              {loading ? 'Loading...' : 'Load Pending Tutors'}
            </button>
            
            {error && <div className="error-message" style={{marginTop: '15px'}}>{error}</div>}
            
            {loading && <div className="loading" style={{marginTop: '15px'}}>Loading tutor data...</div>}
            
            {data && data.length > 0 && (
              <div style={{marginTop: '20px'}}>
                <h4>Pending Tutors ({data.length})</h4>
                {data.map(tutor => (
                  <div key={tutor.userId} className="tutor-card" style={{
                    border: '1px solid #e2e8f0',
                    padding: '15px',
                    margin: '10px 0',
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa'
                  }}>
                    <p><strong>{tutor.name}</strong> - {tutor.email}</p>
                    <p>Subjects: {tutor.subjects}</p>
                    <p>Qualifications: {tutor.qualifications}</p>
                    <p>Experience: {tutor.experience} years</p>
                    <button className="primary-btn" style={{marginTop: '10px'}}>Verify Tutor</button>
                  </div>
                ))}
              </div>
            )}
            
            {data && data.length === 0 && !loading && (
              <div style={{marginTop: '20px', textAlign: 'center', color: '#718096'}}>
                No pending tutor verifications
              </div>
            )}
          </div>
        );

      case 'users':
        return (
          <div>
            <h3>User Management</h3>
            <p>Manage platform users</p>
            
            <button onClick={fetchVerifiedTutors} className="primary-btn" disabled={loading}>
              {loading ? 'Loading...' : 'Load Verified Tutors'}
            </button>
            
            {error && <div className="error-message" style={{marginTop: '15px'}}>{error}</div>}
            
            {loading && <div className="loading" style={{marginTop: '15px'}}>Loading user data...</div>}
            
            {data && data.length > 0 && (
              <div style={{marginTop: '20px'}}>
                <h4>Verified Tutors ({data.length})</h4>
                {data.map(tutor => (
                  <div key={tutor.userId} className="tutor-card" style={{
                    border: '1px solid #e2e8f0',
                    padding: '15px',
                    margin: '10px 0',
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa'
                  }}>
                    <p><strong>{tutor.name}</strong> - {tutor.email}</p>
                    <p>Subjects: {tutor.subjects}</p>
                    <p>Qualifications: {tutor.qualifications}</p>
                    {tutor.verifiedAt && (
                      <p>Verified on: {new Date(tutor.verifiedAt).toLocaleDateString()}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {data && data.length === 0 && !loading && (
              <div style={{marginTop: '20px', textAlign: 'center', color: '#718096'}}>
                No verified tutors found
              </div>
            )}
          </div>
        );

      default:
        return <div>Select a tab</div>;
    }
  };

  
  const renderTutorContent = () => {
    return (
      <div>
        <h3>Tutor Dashboard</h3>
        <p>Your tutor account is active and ready for students!</p>
        <div className="overview-grid">
          <div className="stat-card">
            <h3>0</h3>
            <p>Upcoming Sessions</p>
          </div>
          <div className="stat-card">
            <h3>0</h3>
            <p>Total Students</p>
          </div>
          <div className="stat-card">
            <h3>0 ETB</h3>
            <p>Earnings</p>
          </div>
        </div>
      </div>
    );
  };

  const renderInstitutionContent = () => {
    return (
      <div>
        <h3>Institution Dashboard</h3>
        <p>Welcome to your institution portal</p>
        <div className="overview-grid">
          <div className="stat-card">
            <h3>0</h3>
            <p>Sponsored Students</p>
          </div>
          <div className="stat-card">
            <h3>0</h3>
            <p>Available Tutors</p>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;

    const userRole = user.role?.toLowerCase();
    
    switch (userRole) {
      case 'admin': return renderAdminContent();
      case 'tutor': return renderTutorContent();
      case 'institution': return renderInstitutionContent();
      default: return <div>Unknown role: {user.role}</div>;
    }
  };

  const userRole = user.role?.toLowerCase();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>MentorMeet</h1>
          <nav className="main-nav">
            <button className={activeTab === 'overview' ? 'active' : ''} 
                    onClick={() => setActiveTab('overview')}>
              Overview
            </button>
            {userRole === 'admin' && (
              <>
                <button className={activeTab === 'verifications' ? 'active' : ''} 
                        onClick={() => setActiveTab('verifications')}>
                  Verifications
                </button>
                <button className={activeTab === 'users' ? 'active' : ''} 
                        onClick={() => setActiveTab('users')}>
                  Users
                </button>
              </>
            )}
            <button className={activeTab === 'profile' ? 'active' : ''} 
                    onClick={() => setActiveTab('profile')}>
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
          <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
        </div>

        <div className="tab-content">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;