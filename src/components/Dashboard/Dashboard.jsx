import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [pendingTutors, setPendingTutors] = useState([]);
  const [verifiedTutors, setVerifiedTutors] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toFileUrl = (path) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    const trimmed = String(path).startsWith('/') ? path.slice(1) : String(path);
    return `http://localhost:5010/${trimmed}`;
  };

  // Debug: Check what user data we're receiving
  useEffect(() => {
    console.log('User data in dashboard:', user);
  }, [user]);

  const fetchPendingTutors = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      const token = localStorage.getItem('mentormeet_token');
      console.log('Fetching pending tutors with token:', token ? 'Token exists' : 'No token');
      
      const response = await axios.get('http://localhost:5010/api/admin/tutors/pending', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Pending tutors response:', response.data);
      setPendingTutors(Array.isArray(response.data) ? response.data : []);
      setData(Array.isArray(response.data) ? response.data : []);
      
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
      if (!silent) setLoading(false);
    }
  };

  const fetchStats = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      const token = localStorage.getItem('mentormeet_token');
      const response = await axios.get('http://localhost:5010/api/admin/dashboard/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setStats(response.data);
      // Optionally seed counts from stats if lists not yet loaded
      if (typeof response.data.pendingTutors === 'number') {
        // leave arrays as-is; counts will read from stats in UI
      }
    } catch (err) {
      if (!silent) setError('Failed to load dashboard stats');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const verifyTutor = async (tutorUserId) => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('mentormeet_token');
      await axios.post(`http://localhost:5010/api/admin/tutors/verify/${tutorUserId}`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      // Refresh lists and counts
      await fetchPendingTutors(true);
      await fetchVerifiedTutors(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify tutor');
    } finally {
      setLoading(false);
    }
  };

  const fetchVerifiedTutors = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      const token = localStorage.getItem('mentormeet_token');
      console.log('=== DEBUG VERIFIED TUTORS REQUEST ===');
      console.log('Token exists:', !!token);
      console.log('User role:', user.role);
      console.log('Full user object:', user);
      
      const response = await axios.get('http://localhost:5010/api/admin/tutors/verified', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ SUCCESS - Verified tutors response:', response.data);
      setVerifiedTutors(Array.isArray(response.data) ? response.data : []);
      setData(Array.isArray(response.data) ? response.data : []);
      
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
      if (!silent) setLoading(false);
    }
  };

  // Preload counts for admin overview
  useEffect(() => {
    if (user?.role?.toLowerCase() === 'admin') {
      fetchPendingTutors(true);
      fetchVerifiedTutors(true);
      fetchStats(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const renderAdminContent = () => {
    // Build main content based on activeTab
    let mainContent = null;
    switch (activeTab) {
      case 'verifications':
        mainContent = (
          <div>
            <h3>Pending Tutors</h3>
            <button onClick={fetchPendingTutors} className="primary-btn" disabled={loading}>
              {loading ? 'Loading...' : 'Reload'}
            </button>
            {error && <div className="error-message" style={{marginTop: '15px'}}>{error}</div>}
            {loading && <div className="loading" style={{marginTop: '15px'}}>Loading tutor data...</div>}
            {data && data.length > 0 && (
              <div style={{marginTop: '20px'}}>
                <h4>Pending Tutors ({data.length})</h4>
                {data.map(tutor => (
                  <div key={tutor.userId} className="tutor-card" style={{
                    border: '1px solid #e2e8f0', padding: '15px', margin: '10px 0', borderRadius: '8px', backgroundColor: '#f8f9fa'
                  }}>
                    <p><strong>{tutor.name}</strong> - {tutor.email}</p>
                    <p>Experience: {tutor.yearofexperience} years</p>
                    <p>Hourly Rate: {tutor.hourlyRate}</p>
                    <p>ID Type: {tutor.idType}</p>
                    {tutor.phoneNumber && <p>Phone: {tutor.phoneNumber}</p>}
                    {tutor.dateOfBirth && <p>DOB: {new Date(tutor.dateOfBirth).toLocaleDateString()}</p>}
                    {tutor.gender && <p>Gender: {tutor.gender}</p>}
                    {tutor.createdAt && <p>Applied: {new Date(tutor.createdAt).toLocaleString()}</p>}
                    <div style={{display:'flex', gap: '8px', flexWrap:'wrap', marginTop:'8px'}}>
                      {toFileUrl(tutor.resumePath) && (
                        <a className="primary-btn" href={toFileUrl(tutor.resumePath)} target="_blank" rel="noreferrer">View Resume</a>
                      )}
                      {toFileUrl(tutor.idDocumentPath) && (
                        <a className="primary-btn" href={toFileUrl(tutor.idDocumentPath)} target="_blank" rel="noreferrer">View ID</a>
                      )}
                      {toFileUrl(tutor.certificationPath) && (
                        <a className="secondary-btn" href={toFileUrl(tutor.certificationPath)} target="_blank" rel="noreferrer">View Certificate</a>
                      )}
                    </div>
                    <button onClick={() => verifyTutor(tutor.userId)} className="primary-btn" style={{marginTop: '10px'}}>Verify Tutor</button>
                  </div>
                ))}
              </div>
            )}
            {data && data.length === 0 && !loading && (
              <div style={{marginTop: '20px', textAlign: 'center', color: '#718096'}}>No pending tutor verifications</div>
            )}
          </div>
        );
        break;
      case 'users':
        mainContent = (
          <div>
            <h3>Verified Tutors</h3>
            <button onClick={fetchVerifiedTutors} className="primary-btn" disabled={loading}>
              {loading ? 'Loading...' : 'Reload'}
            </button>
            {error && <div className="error-message" style={{marginTop: '15px'}}>{error}</div>}
            {loading && <div className="loading" style={{marginTop: '15px'}}>Loading user data...</div>}
            {data && data.length > 0 && (
              <div style={{marginTop: '20px'}}>
                <h4>Verified Tutors ({data.length})</h4>
                {data.map(tutor => (
                  <div key={tutor.userId} className="tutor-card" style={{
                    border: '1px solid #e2e8f0', padding: '15px', margin: '10px 0', borderRadius: '8px', backgroundColor: '#f8f9fa'
                  }}>
                    <p><strong>{tutor.name}</strong> - {tutor.email}</p>
                    <p>Experience: {tutor.yearofexperience} years</p>
                    <p>Hourly Rate: {tutor.hourlyRate}</p>
                    {tutor.verifiedAt && (<p>Verified on: {new Date(tutor.verifiedAt).toLocaleDateString()}</p>)}
                    {typeof tutor.isActive === 'boolean' && (<p>Status: {tutor.isActive ? 'Active' : 'Inactive'}</p>)}
                    <div style={{display:'flex', gap: '8px', flexWrap:'wrap', marginTop:'8px'}}>
                      {toFileUrl(tutor.resumePath) && (<a className="primary-btn" href={toFileUrl(tutor.resumePath)} target="_blank" rel="noreferrer">View Resume</a>)}
                      {toFileUrl(tutor.idDocumentPath) && (<a className="primary-btn" href={toFileUrl(tutor.idDocumentPath)} target="_blank" rel="noreferrer">View ID</a>)}
                      {toFileUrl(tutor.certificationPath) && (<a className="secondary-btn" href={toFileUrl(tutor.certificationPath)} target="_blank" rel="noreferrer">View Certificate</a>)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {data && data.length === 0 && !loading && (
              <div style={{marginTop: '20px', textAlign: 'center', color: '#718096'}}>No verified tutors found</div>
            )}
          </div>
        );
        break;
      case 'totalUsers':
        mainContent = (
          <div>
            <h3>Total Users</h3>
            <p style={{fontSize:'28px', fontWeight:600}}>{stats?.totalUsers ?? 0}</p>
          </div>
        );
        break;
      case 'activeUsers':
        mainContent = (
          <div>
            <h3>Active Users</h3>
            <p style={{fontSize:'28px', fontWeight:600}}>{stats?.activeUsers ?? 0}</p>
          </div>
        );
        break;
      default:
        mainContent = (
          <div>
            <h3>Welcome, Admin</h3>
          </div>
        );
    }

    // Sidebar layout
    return (
      <div style={{display:'flex', gap:'16px'}}>
        <aside style={{width:'260px', borderRight:'1px solid #e2e8f0', paddingRight:'12px'}}>
          <h4>Admin</h4>
          <nav style={{display:'grid', gap:'8px', marginTop:'10px'}}>
            <button className={activeTab==='verifications'?'active':''} onClick={() => { setActiveTab('verifications'); fetchPendingTutors(true); }}>
              Pending Tutors ({(stats?.pendingTutors ?? pendingTutors.length) || 0})
            </button>
            <button className={activeTab==='users'?'active':''} onClick={() => { setActiveTab('users'); fetchVerifiedTutors(true); }}>
              Verified Tutors ({(stats?.verifiedTutors ?? verifiedTutors.length) || 0})
            </button>
            <button className={activeTab==='totalUsers'?'active':''} onClick={() => { setActiveTab('totalUsers'); fetchStats(true); }}>
              Total Users ({stats?.totalUsers ?? 0})
            </button>
            <button className={activeTab==='activeUsers'?'active':''} onClick={() => { setActiveTab('activeUsers'); fetchStats(true); }}>
              Active Sessions ({stats?.activeUsers ?? 0})
            </button>
          </nav>
        </aside>
        <section style={{flex:1}}>
          {mainContent}
        </section>
      </div>
    );
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